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
import { fetchDwcaRecords, assembleDwca } from '../src/lib/gbif/dwca/index'
import type { DwcaEmlInput } from '../src/lib/gbif/dwca/index'
import { buildZip } from '../src/lib/gbif/dwca/zip-builder'

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
