// GBIF publishing orchestrator
// High-level entry point for the full GBIF publishing flow.
// CLI scripts and future UI call publishToGbif() from here.

import type { Agent } from '@atproto/api'
import { deflateRawSync, crc32 } from 'node:zlib'
import { gbifConfig } from '@/config/gbif'
import { PDS_ENDPOINT } from '@/config/atproto'
import { fetchDwcaRecords, assembleDwca } from '@/lib/gbif/dwca/index'
import type { DwcaEmlInput } from '@/lib/gbif/dwca/index'
import { uploadAndGetUrl } from '@/lib/gbif/pds-archive-host'
import {
  submitUrlForValidation,
  pollValidationUntilComplete,
  isValidationIndexeable,
} from '@/lib/gbif/api/validator-client'
import {
  createDataset,
  addContact,
  addEndpoint,
  listEndpoints,
  deleteEndpoint,
  triggerCrawl,
} from '@/lib/gbif/api/registry-client'
import {
  createGbifDatasetRecord,
  updateGbifDatasetRecord,
  listGbifDatasetRecords,
} from '@/lib/gbif/pds-dataset-registry'

// ---------------------------------------------------------------------------
// Custom error
// ---------------------------------------------------------------------------

export class PublishError extends Error {
  step: string
  cause?: Error

  constructor(step: string, message: string, cause?: Error) {
    super(message)
    this.name = 'PublishError'
    this.step = step
    this.cause = cause
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PublishOptions = {
  agent: Agent
  did: string
  organizationAtUri: string
  datasetTitle: string
  description: string
  contact: {
    firstName: string
    lastName: string
    email: string
    organization?: string
    position?: string
  }
  skipValidation?: boolean
}

export type PublishResult = {
  gbifDatasetKey: string
  gbifEndpointKey: number
  archiveBlobCid: string
  archiveBlobUrl: string
  crawlTriggered: boolean
  validationPassed: boolean | null
  isNewDataset: boolean
}

export type PublishProgress = {
  step: string
  message: string
}

// ---------------------------------------------------------------------------
// Internal ZIP builder (no external dependencies)
// Mirrors the buildZip helper in scripts/export-dwca.ts
// ---------------------------------------------------------------------------

type ZipEntry = {
  filename: string
  crc: number
  compressedData: Buffer
  compressedSize: number
  uncompressedSize: number
  offset: number
}

function buildZip(files: Record<string, string>): Buffer {
  const entries: ZipEntry[] = []
  const localParts: Buffer[] = []
  let currentOffset = 0

  for (const [filename, content] of Object.entries(files)) {
    const rawData = Buffer.from(content, 'utf8')
    const uncompressedSize = rawData.length
    const crcValue = crc32(rawData) as unknown as number
    const compressedData = deflateRawSync(rawData)
    const compressedSize = compressedData.length
    const filenameBytes = Buffer.from(filename, 'utf8')
    const filenameLen = filenameBytes.length

    // Local file header: 30 bytes + filename
    const localHeader = Buffer.alloc(30 + filenameLen)
    localHeader.writeUInt32LE(0x04034b50, 0) // Local file header signature
    localHeader.writeUInt16LE(20, 4) // Version needed: 2.0
    localHeader.writeUInt16LE(0x0800, 6) // General purpose bit flag: UTF-8
    localHeader.writeUInt16LE(8, 8) // Compression method: DEFLATE
    localHeader.writeUInt16LE(0, 10) // Last mod file time
    localHeader.writeUInt16LE(0, 12) // Last mod file date
    localHeader.writeUInt32LE(crcValue, 14) // CRC-32
    localHeader.writeUInt32LE(compressedSize, 18) // Compressed size
    localHeader.writeUInt32LE(uncompressedSize, 22) // Uncompressed size
    localHeader.writeUInt16LE(filenameLen, 26) // Filename length
    localHeader.writeUInt16LE(0, 28) // Extra field length
    filenameBytes.copy(localHeader, 30)

    entries.push({
      filename,
      crc: crcValue,
      compressedData,
      compressedSize,
      uncompressedSize,
      offset: currentOffset,
    })

    currentOffset += localHeader.length + compressedData.length
    localParts.push(localHeader, compressedData)
  }

  // Central directory
  const centralParts: Buffer[] = []
  let centralDirSize = 0

  for (const entry of entries) {
    const filenameBytes = Buffer.from(entry.filename, 'utf8')
    const filenameLen = filenameBytes.length
    const centralHeader = Buffer.alloc(46 + filenameLen)

    centralHeader.writeUInt32LE(0x02014b50, 0) // Central directory signature
    centralHeader.writeUInt16LE(20, 4) // Version made by
    centralHeader.writeUInt16LE(20, 6) // Version needed
    centralHeader.writeUInt16LE(0x0800, 8) // General purpose bit flag: UTF-8
    centralHeader.writeUInt16LE(8, 10) // Compression method: DEFLATE
    centralHeader.writeUInt16LE(0, 12) // Last mod file time
    centralHeader.writeUInt16LE(0, 14) // Last mod file date
    centralHeader.writeUInt32LE(entry.crc, 16) // CRC-32
    centralHeader.writeUInt32LE(entry.compressedSize, 20) // Compressed size
    centralHeader.writeUInt32LE(entry.uncompressedSize, 24) // Uncompressed size
    centralHeader.writeUInt16LE(filenameLen, 28) // Filename length
    centralHeader.writeUInt16LE(0, 30) // Extra field length
    centralHeader.writeUInt16LE(0, 32) // File comment length
    centralHeader.writeUInt16LE(0, 34) // Disk number start
    centralHeader.writeUInt16LE(0, 36) // Internal file attributes
    centralHeader.writeUInt32LE(0, 38) // External file attributes
    centralHeader.writeUInt32LE(entry.offset, 42) // Relative offset of local header
    filenameBytes.copy(centralHeader, 46)

    centralParts.push(centralHeader)
    centralDirSize += centralHeader.length
  }

  // End of central directory record
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0) // EOCD signature
  eocd.writeUInt16LE(0, 4) // Disk number
  eocd.writeUInt16LE(0, 6) // Disk with start of central directory
  eocd.writeUInt16LE(entries.length, 8) // Number of entries on this disk
  eocd.writeUInt16LE(entries.length, 10) // Total number of entries
  eocd.writeUInt32LE(centralDirSize, 12) // Size of central directory
  eocd.writeUInt32LE(currentOffset, 16) // Offset of central directory
  eocd.writeUInt16LE(0, 20) // Comment length

  return Buffer.concat([...localParts, ...centralParts, eocd])
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

/**
 * Full GBIF publishing flow:
 * 1. Generate DwC-A archive from PDS data
 * 2. Upload archive blob to PDS
 * 3. (Optional) Validate archive with GBIF Validator
 * 4. Register or update dataset in GBIF Registry
 * 5. Trigger GBIF crawl
 *
 * @param options - Publishing options including agent, DID, and dataset metadata
 * @param onProgress - Optional callback called at each step with progress info
 * @returns PublishResult with GBIF dataset key, endpoint key, blob CID/URL, and flags
 */
export async function publishToGbif(
  options: PublishOptions,
  onProgress?: (progress: PublishProgress) => void,
): Promise<PublishResult> {
  const {
    agent,
    did,
    organizationAtUri,
    datasetTitle,
    description,
    contact,
    skipValidation = false,
  } = options

  // -------------------------------------------------------------------------
  // Step 1: Generate DwC-A archive
  // -------------------------------------------------------------------------
  onProgress?.({ step: 'generate', message: 'Generating DwC-A archive...' })

  let archiveBuffer: Uint8Array
  try {
    // Fetch records from PDS
    const fetchResult = await fetchDwcaRecords({
      pdsEndpoint: PDS_ENDPOINT,
      orgIdentifier: did,
    })

    // Build EML input from options
    const emlInput: DwcaEmlInput = {
      datasetTitle,
      abstract: description,
      license: 'CC-BY',
      organizationName: contact.organization ?? 'GainForest',
      contactEmail: contact.email,
      contactName: `${contact.firstName} ${contact.lastName}`.trim(),
      language: 'en',
    }

    // Assemble the archive files
    const archiveFiles = assembleDwca({
      data: fetchResult,
      eml: emlInput,
      pdsEndpoint: PDS_ENDPOINT,
      defaultMultimediaLicense:
        'http://creativecommons.org/licenses/by/4.0/legalcode',
    })

    // Build ZIP buffer
    archiveBuffer = buildZip(archiveFiles)
  } catch (err) {
    throw new PublishError(
      'generate',
      `Failed to generate DwC-A archive: ${err instanceof Error ? err.message : String(err)}`,
      err instanceof Error ? err : undefined,
    )
  }

  // -------------------------------------------------------------------------
  // Step 2: Upload archive to PDS
  // -------------------------------------------------------------------------
  onProgress?.({ step: 'upload', message: 'Uploading archive to PDS...' })

  let archiveBlobCid: string
  let archiveBlobUrl: string
  try {
    const uploaded = await uploadAndGetUrl(agent, did, archiveBuffer)
    archiveBlobCid = uploaded.cid
    archiveBlobUrl = uploaded.url
  } catch (err) {
    throw new PublishError(
      'upload',
      `Failed to upload archive to PDS: ${err instanceof Error ? err.message : String(err)}`,
      err instanceof Error ? err : undefined,
    )
  }

  // -------------------------------------------------------------------------
  // Step 3: Validate archive with GBIF (optional)
  // -------------------------------------------------------------------------
  let validationPassed: boolean | null = null

  if (!skipValidation) {
    onProgress?.({
      step: 'validate',
      message: 'Validating archive with GBIF...',
    })

    try {
      const submitted = await submitUrlForValidation(archiveBlobUrl)
      const finalValidation = await pollValidationUntilComplete(submitted.key)
      validationPassed = isValidationIndexeable(finalValidation)

      if (!validationPassed) {
        throw new PublishError(
          'validate',
          `GBIF validation failed: archive is not indexeable. Status: ${finalValidation.status}. Error: ${finalValidation.metrics?.error ?? 'unknown'}`,
        )
      }
    } catch (err) {
      if (err instanceof PublishError) throw err
      throw new PublishError(
        'validate',
        `GBIF validation error: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err : undefined,
      )
    }
  }

  // -------------------------------------------------------------------------
  // Step 4: Register or update dataset in GBIF Registry
  // -------------------------------------------------------------------------
  onProgress?.({ step: 'register', message: 'Registering dataset with GBIF...' })

  // Check that GBIF_INSTALLATION_KEY is configured
  const installationKey = gbifConfig.installationKey
  if (!installationKey) {
    throw new PublishError(
      'register',
      'GBIF_INSTALLATION_KEY is not set. Run the bootstrap script first: bun scripts/bootstrap-gbif-installation.ts',
    )
  }

  const publishingOrganizationKey = gbifConfig.orgKey

  let gbifDatasetKey: string
  let gbifEndpointKey: number
  let isNewDataset: boolean
  let pdsRecordRkey: string | undefined

  try {
    // Check if a PDS record already exists for this organizationAtUri
    const existingRecords = await listGbifDatasetRecords(did)
    const existingRecord = existingRecords.find(
      (r) => r.organizationRef === organizationAtUri,
    )

    if (!existingRecord) {
      // --- NEW DATASET ---
      isNewDataset = true

      // Create dataset in GBIF Registry
      gbifDatasetKey = await createDataset({
        installationKey,
        publishingOrganizationKey,
        type: 'OCCURRENCE',
        title: datasetTitle,
        language: 'eng',
        description,
      })

      // Add contact (only for new datasets)
      await addContact(gbifDatasetKey, {
        type: 'POINT_OF_CONTACT',
        primary: true,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: [contact.email],
        ...(contact.organization !== undefined && {
          organization: contact.organization,
        }),
        ...(contact.position !== undefined && {
          position: [contact.position],
        }),
      })

      // Add DWC_ARCHIVE endpoint
      gbifEndpointKey = await addEndpoint(gbifDatasetKey, {
        type: 'DWC_ARCHIVE',
        url: archiveBlobUrl,
      })

      // Create PDS record
      const created = await createGbifDatasetRecord(agent, did, {
        organizationRef: organizationAtUri,
        gbifDatasetKey,
        gbifInstallationKey: installationKey,
        gbifEndpointKey,
        datasetTitle,
        archiveBlobCid,
        lastPublishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      })
      pdsRecordRkey = created.rkey
    } else {
      // --- EXISTING DATASET ---
      isNewDataset = false
      gbifDatasetKey = existingRecord.gbifDatasetKey
      pdsRecordRkey = existingRecord.rkey

      // Get current endpoints and delete all DWC_ARCHIVE endpoints
      const endpoints = await listEndpoints(gbifDatasetKey)
      const dwcEndpoints = endpoints.filter((ep) => ep.type === 'DWC_ARCHIVE')
      for (const ep of dwcEndpoints) {
        if (ep.key !== undefined) {
          await deleteEndpoint(gbifDatasetKey, ep.key)
        }
      }

      // Add new endpoint with updated blobUrl
      gbifEndpointKey = await addEndpoint(gbifDatasetKey, {
        type: 'DWC_ARCHIVE',
        url: archiveBlobUrl,
      })

      // Update PDS record with new archiveBlobCid and lastPublishedAt
      await updateGbifDatasetRecord(agent, did, pdsRecordRkey, {
        gbifEndpointKey,
        archiveBlobCid,
        lastPublishedAt: new Date().toISOString(),
      })
    }
  } catch (err) {
    if (err instanceof PublishError) throw err
    throw new PublishError(
      'register',
      `Failed to register dataset with GBIF: ${err instanceof Error ? err.message : String(err)}`,
      err instanceof Error ? err : undefined,
    )
  }

  // -------------------------------------------------------------------------
  // Step 5: Trigger GBIF crawl
  // -------------------------------------------------------------------------
  onProgress?.({ step: 'crawl', message: 'Triggering GBIF crawl...' })

  let crawlTriggered = false
  try {
    await triggerCrawl(gbifDatasetKey)
    crawlTriggered = true
  } catch (err) {
    // Crawl trigger failure is non-fatal — log but don't throw
    console.warn(
      `Warning: Failed to trigger GBIF crawl for dataset ${gbifDatasetKey}: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  // -------------------------------------------------------------------------
  // Return result
  // -------------------------------------------------------------------------
  return {
    gbifDatasetKey,
    gbifEndpointKey,
    archiveBlobCid,
    archiveBlobUrl,
    crawlTriggered,
    validationPassed,
    isNewDataset,
  }
}
