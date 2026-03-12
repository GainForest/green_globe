// GBIF publishing orchestrator
// High-level entry point for the full GBIF publishing flow.
// CLI scripts and future UI call publishToGbif() from here.

import type { Agent } from '@atproto/api'
import { gbifConfig } from '@/config/gbif'
import { PDS_ENDPOINT } from '@/config/atproto'
import { fetchDwcaRecords, assembleDwca } from '@/lib/gbif/dwca/index'
import type { DwcaEmlInput } from '@/lib/gbif/dwca/index'
import { buildZip } from '@/lib/gbif/dwca/zip-builder'
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
  findByOrganizationRef,
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
  /**
   * When true, the orchestrator stops after generate/upload/validate and does
   * NOT register the dataset with GBIF or trigger a crawl.
   */
  dryRun?: boolean
}

export type PublishResult = {
  /** Present for full publish runs; undefined for dry-run. */
  gbifDatasetKey?: string
  /** Present for full publish runs; undefined for dry-run. */
  gbifEndpointKey?: number
  archiveBlobCid: string
  archiveBlobUrl: string
  /** false for dry-run (crawl is never triggered). */
  crawlTriggered: boolean
  validationPassed: boolean | null
  /** Present for full publish runs; undefined for dry-run. */
  isNewDataset?: boolean
  /** true when the orchestrator stopped before the register/crawl steps. */
  isDryRun: boolean
}

export type PublishProgress = {
  step: string
  message: string
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
    dryRun = false,
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
  let archiveBlob: unknown
  try {
    const uploaded = await uploadAndGetUrl(agent, did, archiveBuffer)
    archiveBlobCid = uploaded.cid
    archiveBlobUrl = uploaded.url
    archiveBlob = uploaded.blob
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
  // Dry-run: stop here — do NOT register or crawl
  // -------------------------------------------------------------------------
  if (dryRun) {
    return {
      archiveBlobCid,
      archiveBlobUrl,
      crawlTriggered: false,
      validationPassed,
      isDryRun: true,
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
  if (!publishingOrganizationKey) {
    throw new PublishError(
      'register',
      'GBIF_ORG_KEY is not set. Set it in your .env file before publishing.',
    )
  }

  let gbifDatasetKey: string
  let gbifEndpointKey: number
  let isNewDataset: boolean
  let pdsRecordRkey: string | undefined

  try {
    // Check if a PDS record already exists for this organizationAtUri
    const existingRecord = await findByOrganizationRef(did, organizationAtUri)

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
        archiveBlob,
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

      // Update PDS record with new archiveBlobCid, archiveBlob, and lastPublishedAt
      await updateGbifDatasetRecord(agent, did, pdsRecordRkey, {
        gbifEndpointKey,
        archiveBlobCid,
        archiveBlob,
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
    isDryRun: false,
  }
}
