#!/usr/bin/env bun
/**
 * export-dwca.ts — CLI script to export a Darwin Core Archive (DwC-A) ZIP
 * for an organization's tree data from the GainForest PDS.
 *
 * Target dataset: Bees and Trees Uganda - Comboni Tree Plantings
 * Purpose: GBIF DwC-A export pipeline
 *
 * Usage:
 *   bun scripts/export-dwca.ts \
 *     --handle bees-and-trees-uga.climateai.org \
 *     --title 'Bees and Trees Uganda - Comboni Tree Plantings' \
 *     --org 'Bees and Trees Uganda' \
 *     --contact-email info@gainforest.earth \
 *     --contact-name 'GainForest' \
 *     --license CC-BY \
 *     --measured-trees-only \
 *     --out tmp/bees-and-trees-comboni-dwca.zip \
 *     [--service https://climateai.org] \
 *     [--dry-run] \
 *     [--occurrence-only]
 *
 * Arguments:
 *   --handle              (required) PDS handle or DID of the organization
 *   --title               (required) Dataset title for EML
 *   --org                 (required) Organization name for EML
 *   --contact-email       (required) Contact email for EML
 *   --contact-name        (required) Contact name for EML
 *   --license             (required) One of: CC0, CC-BY, CC-BY-NC
 *   --out                 (required) Output ZIP file path
 *   --measured-trees-only           Only export HumanObservation records with dataType=measuredTree
 *   --occurrence-only               Output only occurrence.txt + meta.xml + eml.xml (no extensions)
 *   --service                       PDS service URL (default: https://climateai.org)
 *   --dry-run                       Fetch and assemble but don't write ZIP; print summary to stdout
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { deflateRawSync, crc32 } from 'node:zlib'
import { fetchDwcaRecords, assembleDwca } from '../src/lib/gbif/dwca/index'
import type { DwcaEmlInput } from '../src/lib/gbif/dwca/index'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ParsedArgs = {
  handle: string
  title: string
  org: string
  contactEmail: string
  contactName: string
  license: 'CC0' | 'CC-BY' | 'CC-BY-NC'
  out: string
  measuredTreesOnly: boolean
  occurrenceOnly: boolean
  service: string
  dryRun: boolean
}

// ---------------------------------------------------------------------------
// Minimal ZIP writer (no external dependencies)
// Uses DEFLATE compression via Node.js built-in zlib.deflateRawSync
// ZIP format reference: https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT
// ---------------------------------------------------------------------------

type ZipEntry = {
  filename: string
  data: Buffer
  crc: number
  compressedData: Buffer
  compressedSize: number
  uncompressedSize: number
  offset: number
}

function writeUint16LE(buf: Buffer, offset: number, value: number): void {
  buf.writeUInt16LE(value, offset)
}

function writeUint32LE(buf: Buffer, offset: number, value: number): void {
  buf.writeUInt32LE(value, offset)
}

/**
 * Build a ZIP archive buffer from a map of filename → string content.
 * Files are stored at the root level (no directory structure).
 */
function buildZip(files: Record<string, string>): Buffer {
  const entries: ZipEntry[] = []
  let currentOffset = 0

  // Build local file headers + compressed data
  const localParts: Buffer[] = []

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
    writeUint32LE(localHeader, 0, 0x04034b50) // Local file header signature
    writeUint16LE(localHeader, 4, 20) // Version needed: 2.0
    writeUint16LE(localHeader, 6, 0x0800) // General purpose bit flag: UTF-8
    writeUint16LE(localHeader, 8, 8) // Compression method: DEFLATE
    writeUint16LE(localHeader, 10, 0) // Last mod file time
    writeUint16LE(localHeader, 12, 0) // Last mod file date
    writeUint32LE(localHeader, 14, crcValue) // CRC-32
    writeUint32LE(localHeader, 18, compressedSize) // Compressed size
    writeUint32LE(localHeader, 22, uncompressedSize) // Uncompressed size
    writeUint16LE(localHeader, 26, filenameLen) // Filename length
    writeUint16LE(localHeader, 28, 0) // Extra field length
    filenameBytes.copy(localHeader, 30)

    entries.push({
      filename,
      data: rawData,
      crc: crcValue,
      compressedData,
      compressedSize,
      uncompressedSize,
      offset: currentOffset,
    })

    const entrySize = localHeader.length + compressedData.length
    currentOffset += entrySize
    localParts.push(localHeader, compressedData)
  }

  // Build central directory
  const centralParts: Buffer[] = []
  let centralDirSize = 0

  for (const entry of entries) {
    const filenameBytes = Buffer.from(entry.filename, 'utf8')
    const filenameLen = filenameBytes.length
    const centralHeader = Buffer.alloc(46 + filenameLen)

    writeUint32LE(centralHeader, 0, 0x02014b50) // Central directory signature
    writeUint16LE(centralHeader, 4, 20) // Version made by
    writeUint16LE(centralHeader, 6, 20) // Version needed
    writeUint16LE(centralHeader, 8, 0x0800) // General purpose bit flag: UTF-8
    writeUint16LE(centralHeader, 10, 8) // Compression method: DEFLATE
    writeUint16LE(centralHeader, 12, 0) // Last mod file time
    writeUint16LE(centralHeader, 14, 0) // Last mod file date
    writeUint32LE(centralHeader, 16, entry.crc) // CRC-32
    writeUint32LE(centralHeader, 20, entry.compressedSize) // Compressed size
    writeUint32LE(centralHeader, 24, entry.uncompressedSize) // Uncompressed size
    writeUint16LE(centralHeader, 28, filenameLen) // Filename length
    writeUint16LE(centralHeader, 30, 0) // Extra field length
    writeUint16LE(centralHeader, 32, 0) // File comment length
    writeUint16LE(centralHeader, 34, 0) // Disk number start
    writeUint16LE(centralHeader, 36, 0) // Internal file attributes
    writeUint32LE(centralHeader, 38, 0) // External file attributes
    writeUint32LE(centralHeader, 42, entry.offset) // Relative offset of local header
    filenameBytes.copy(centralHeader, 46)

    centralParts.push(centralHeader)
    centralDirSize += centralHeader.length
  }

  // End of central directory record
  const eocd = Buffer.alloc(22)
  writeUint32LE(eocd, 0, 0x06054b50) // EOCD signature
  writeUint16LE(eocd, 4, 0) // Disk number
  writeUint16LE(eocd, 6, 0) // Disk with start of central directory
  writeUint16LE(eocd, 8, entries.length) // Number of entries on this disk
  writeUint16LE(eocd, 10, entries.length) // Total number of entries
  writeUint32LE(eocd, 12, centralDirSize) // Size of central directory
  writeUint32LE(eocd, 16, currentOffset) // Offset of central directory
  writeUint16LE(eocd, 20, 0) // Comment length

  return Buffer.concat([...localParts, ...centralParts, eocd])
}

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

const USAGE = `
Usage:
  bun scripts/export-dwca.ts \\
    --handle <handle-or-did> \\
    --title <dataset-title> \\
    --org <organization-name> \\
    --contact-email <email> \\
    --contact-name <name> \\
    --license <CC0|CC-BY|CC-BY-NC> \\
    --out <output.zip> \\
    [--measured-trees-only] \\
    [--service <pds-url>] \\
    [--dry-run]

Required arguments:
  --handle              PDS handle or DID of the organization
  --title               Dataset title for EML metadata
  --org                 Organization name for EML metadata
  --contact-email       Contact email for EML metadata
  --contact-name        Contact name for EML metadata
  --license             License: CC0, CC-BY, or CC-BY-NC
  --out                 Output ZIP file path

Optional arguments:
  --measured-trees-only Only export HumanObservation records with dataType=measuredTree
  --occurrence-only     Output only occurrence.txt + meta.xml + eml.xml (no extensions)
  --service             PDS service URL (default: https://climateai.org)
  --dry-run             Fetch and assemble but don't write ZIP; print summary to stdout
`.trim()

function parseArgs(argv: string[]): ParsedArgs | null {
  const args = argv.slice(2) // skip 'bun' and script path

  if (args.includes('--help') || args.includes('-h')) {
    console.log(USAGE)
    process.exit(0)
  }

  const get = (flag: string): string | undefined => {
    const idx = args.indexOf(flag)
    if (idx === -1) return undefined
    return args[idx + 1]
  }

  const has = (flag: string): boolean => args.includes(flag)

  const handle = get('--handle')
  const title = get('--title')
  const org = get('--org')
  const contactEmail = get('--contact-email')
  const contactName = get('--contact-name')
  const licenseRaw = get('--license')
  const out = get('--out')

  const missing: string[] = []
  if (!handle) missing.push('--handle')
  if (!title) missing.push('--title')
  if (!org) missing.push('--org')
  if (!contactEmail) missing.push('--contact-email')
  if (!contactName) missing.push('--contact-name')
  if (!licenseRaw) missing.push('--license')
  if (!out) missing.push('--out')

  if (missing.length > 0) {
    console.error(`Error: Missing required arguments: ${missing.join(', ')}\n`)
    console.error(USAGE)
    process.exit(1)
  }

  const validLicenses = ['CC0', 'CC-BY', 'CC-BY-NC'] as const
  if (!validLicenses.includes(licenseRaw as (typeof validLicenses)[number])) {
    console.error(
      `Error: --license must be one of: ${validLicenses.join(', ')} (got: ${licenseRaw})\n`
    )
    process.exit(1)
  }

  return {
    handle: handle!,
    title: title!,
    org: org!,
    contactEmail: contactEmail!,
    contactName: contactName!,
    license: licenseRaw as 'CC0' | 'CC-BY' | 'CC-BY-NC',
    out: out!,
    measuredTreesOnly: has('--measured-trees-only'),
    occurrenceOnly: has('--occurrence-only'),
    service: get('--service') ?? 'https://climateai.org',
    dryRun: has('--dry-run'),
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = parseArgs(process.argv)
  if (!args) return

  console.log(`Fetching DwC-A records for: ${args.handle}`)
  console.log(`PDS service: ${args.service}`)
  if (args.measuredTreesOnly) {
    console.log('Filter: measured trees only (basisOfRecord=HumanObservation, dataType=measuredTree)')
  }
  if (args.occurrenceOnly) {
    console.log('Mode: occurrence-only (extensions skipped — output: occurrence.txt, meta.xml, eml.xml)')
  }

  // 1. Fetch records from PDS
  let fetchResult
  try {
    fetchResult = await fetchDwcaRecords({
      pdsEndpoint: args.service,
      orgIdentifier: args.handle,
      measuredTreesOnly: args.measuredTreesOnly,
    })
  } catch (err) {
    console.error(`Error fetching records: ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
  }

  const { occurrences, measurements, multimedia } = fetchResult

  // 2. Check for zero occurrences
  if (occurrences.length === 0) {
    console.warn('Warning: No occurrences found. No ZIP will be created.')
    process.exit(0)
  }

  // 3. Build EML input
  const emlInput: DwcaEmlInput = {
    datasetTitle: args.title,
    abstract: `Tree planting occurrence records for ${args.org}, exported from the GainForest PDS.`,
    license: args.license,
    organizationName: args.org,
    contactEmail: args.contactEmail,
    contactName: args.contactName,
    language: 'en',
  }

  // 4. Assemble the archive
  const archiveFiles = assembleDwca({
    data: fetchResult,
    eml: emlInput,
    pdsEndpoint: args.service,
    defaultMultimediaLicense: 'http://creativecommons.org/licenses/by/4.0/legalcode',
    occurrenceOnly: args.occurrenceOnly,
  })

  // 5. Compute summary stats
  const occurrenceLines = (archiveFiles['occurrence.txt'] ?? '').split('\n').filter(Boolean)
  const occurrenceCount = Math.max(0, occurrenceLines.length - 1) // subtract header

  const measurementLines = archiveFiles['measurementOrFact.txt']
    ? archiveFiles['measurementOrFact.txt'].split('\n').filter(Boolean)
    : []
  const measurementCount = Math.max(0, measurementLines.length - 1)

  const multimediaLines = archiveFiles['multimedia.txt']
    ? archiveFiles['multimedia.txt'].split('\n').filter(Boolean)
    : []
  const multimediaCount = Math.max(0, multimediaLines.length - 1)

  const fileNames = Object.keys(archiveFiles)

  // 6. Dry-run: print summary and file contents, then exit
  if (args.dryRun) {
    console.log('\n--- DRY RUN SUMMARY ---')
    if (args.occurrenceOnly) {
      console.log('Mode:          occurrence-only (extensions skipped)')
    }
    console.log(`Occurrences:   ${occurrenceCount}`)
    console.log(`Measurements:  ${measurementCount}`)
    console.log(`Multimedia:    ${multimediaCount}`)
    console.log(`Archive files: ${fileNames.join(', ')}`)
    console.log('\n--- FILE CONTENTS ---')
    for (const [name, content] of Object.entries(archiveFiles)) {
      const lines = content.split('\n').filter(Boolean)
      console.log(`\n[${name}] — ${lines.length} line(s)`)
      // Print first 5 lines as preview
      const preview = lines.slice(0, 5)
      for (const line of preview) {
        console.log(`  ${line.slice(0, 120)}${line.length > 120 ? '…' : ''}`)
      }
      if (lines.length > 5) {
        console.log(`  … (${lines.length - 5} more lines)`)
      }
    }
    console.log('\n--- END DRY RUN ---')
    process.exit(0)
  }

  // 7. Build ZIP buffer
  const zipBuffer = buildZip(archiveFiles)

  // 8. Write ZIP to output path (create parent directories if needed)
  const outDir = dirname(args.out)
  if (outDir && outDir !== '.') {
    await mkdir(outDir, { recursive: true })
  }

  await writeFile(args.out, zipBuffer)

  const fileSizeKb = (zipBuffer.length / 1024).toFixed(1)

  // 9. Print summary
  console.log('\n--- EXPORT SUMMARY ---')
  if (args.occurrenceOnly) {
    console.log('Mode:          occurrence-only (extensions skipped)')
  }
  console.log(`Occurrences:   ${occurrenceCount}`)
  console.log(`Measurements:  ${measurementCount}`)
  console.log(`Multimedia:    ${multimediaCount}`)
  console.log(`Archive files: ${fileNames.join(', ')}`)
  console.log(`Output:        ${args.out} (${fileSizeKb} KB)`)
  console.log('Done.')
}

main().catch((err: unknown) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
