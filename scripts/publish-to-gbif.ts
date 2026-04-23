#!/usr/bin/env bun
/**
 * publish-to-gbif.ts — CLI script for end-to-end GBIF publishing.
 * Wraps the publishToGbif orchestrator from src/lib/gbif/publisher.ts.
 *
 * Usage:
 *   bun run scripts/publish-to-gbif.ts --did <did> [options]
 *
 * Arguments:
 *   --did <did>                (required) The PDS DID of the organization to publish
 *   --title <title>            (optional) Dataset title override
 *   --description <desc>       (optional) Dataset description override
 *   --contact-name <name>      (optional) Contact name (default: 'GainForest Tech')
 *   --contact-email <email>    (optional) Contact email (default: 'tech@gainforest.net')
 *   --skip-validation          (optional) Skip GBIF validation step
 *   --dry-run                  (optional) Generate and validate but do NOT register or crawl
 *
 * Required environment variables:
 *   PDS_ADMIN_IDENTIFIER   PDS handle or email for authentication
 *   PDS_ADMIN_PASSWORD     PDS account password
 *   GBIF_USERNAME          GBIF account username
 *   GBIF_PASSWORD          GBIF account password
 *   GBIF_ORG_KEY           GBIF organization UUID
 *   GBIF_INSTALLATION_KEY  GBIF installation UUID (from bootstrap script)
 */

import { AtpAgent } from '@atproto/api'
import { gbifConfig, isProduction } from '../src/config/gbif'
import {
  publishToGbif,
  PublishError,
} from '../src/lib/gbif/publisher'
import type { PublishOptions } from '../src/lib/gbif/publisher'
import { PDS_ENDPOINT } from '../src/config/atproto'

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

const USAGE = `
Usage:
  bun run scripts/publish-to-gbif.ts --did <did> [options]

Required arguments:
  --did <did>                The PDS DID of the organization to publish
                             (e.g., did:plc:...)

Optional arguments:
  --title <title>            Dataset title override
                             Default: fetched from PDS or 'GainForest Tree Observations'
  --description <desc>       Dataset description override
  --contact-name <name>      Contact name (default: 'GainForest Tech')
  --contact-email <email>    Contact email (default: 'tech@gainforest.net')
  --skip-validation          Skip GBIF validation step (useful for re-publishing known-good data)
  --dry-run                  Generate and validate the DwC-A but do NOT register with GBIF
                             or trigger crawl. Still uploads blob to PDS for validation URL.
  --help                     Show this help message

Required environment variables:
  PDS_ADMIN_IDENTIFIER       PDS handle or email for authentication
  PDS_ADMIN_PASSWORD         PDS account password
  GBIF_USERNAME              GBIF account username
  GBIF_PASSWORD              GBIF account password
  GBIF_ORG_KEY               GBIF organization UUID
  GBIF_INSTALLATION_KEY      GBIF installation UUID (from bootstrap script)
`.trim()

type ParsedArgs = {
  did: string
  title: string
  description: string
  contactName: string
  contactEmail: string
  skipValidation: boolean
  dryRun: boolean
}

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

  const did = get('--did')

  if (!did) {
    console.error('Error: --did is required\n')
    console.error(USAGE)
    process.exit(1)
  }

  return {
    did,
    title: get('--title') ?? 'GainForest Tree Observations',
    description:
      get('--description') ??
      'Tree planting occurrence records exported from the GainForest PDS.',
    contactName: get('--contact-name') ?? 'GainForest Tech',
    contactEmail: get('--contact-email') ?? 'tech@gainforest.net',
    skipValidation: has('--skip-validation'),
    dryRun: has('--dry-run'),
  }
}

// ---------------------------------------------------------------------------
// Env validation
// ---------------------------------------------------------------------------

function validateEnv(): void {
  const missing: string[] = []

  if (!process.env.PDS_ADMIN_IDENTIFIER) missing.push('PDS_ADMIN_IDENTIFIER')
  if (!process.env.PDS_ADMIN_PASSWORD) missing.push('PDS_ADMIN_PASSWORD')
  if (!gbifConfig.username) missing.push('GBIF_USERNAME')
  if (!gbifConfig.password) missing.push('GBIF_PASSWORD')
  if (!gbifConfig.orgKey) missing.push('GBIF_ORG_KEY')

  if (missing.length > 0) {
    console.error(
      `Error: Missing required environment variables: ${missing.join(', ')}`,
    )
    console.error(
      'Set them in your .env file or shell environment before running this script.',
    )
    process.exit(1)
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = parseArgs(process.argv)
  if (!args) return

  validateEnv()

  const env = isProduction() ? 'PRODUCTION' : 'UAT'
  console.log(`Target environment: ${env}`)
  console.log(`GBIF API URL:       ${gbifConfig.apiUrl}`)
  console.log(`Organization DID:   ${args.did}`)
  console.log(`Dataset title:      ${args.title}`)
  if (args.dryRun) {
    console.log('Mode:               DRY RUN (will not register or crawl)')
  }
  if (args.skipValidation) {
    console.log('Validation:         SKIPPED')
  }
  console.log()

  // ---------------------------------------------------------------------------
  // Authenticate with PDS
  // ---------------------------------------------------------------------------
  console.log('[auth] Authenticating with PDS...')

  const agent = new AtpAgent({ service: PDS_ENDPOINT })

  try {
    await agent.login({
      identifier: process.env.PDS_ADMIN_IDENTIFIER!,
      password: process.env.PDS_ADMIN_PASSWORD!,
    })
    console.log(`[auth] Authenticated as ${agent.session?.handle ?? args.did}`)
  } catch (err) {
    console.error(
      `[auth] Authentication failed: ${err instanceof Error ? err.message : String(err)}`,
    )
    process.exit(1)
  }

  console.log()

  // ---------------------------------------------------------------------------
  // Parse contact name into first/last
  // ---------------------------------------------------------------------------
  const contactNameParts = args.contactName.trim().split(/\s+/)
  const contactFirstName = contactNameParts.slice(0, -1).join(' ') || args.contactName
  const contactLastName = contactNameParts[contactNameParts.length - 1] ?? ''

  // ---------------------------------------------------------------------------
  // Delegate entirely to publishToGbif (handles both dry-run and full publish)
  // ---------------------------------------------------------------------------
  const options: PublishOptions = {
    agent,
    did: args.did,
    organizationAtUri: `at://${args.did}/app.gainforest.organization.info/self`,
    datasetTitle: args.title,
    description: args.description,
    contact: {
      firstName: contactFirstName,
      lastName: contactLastName,
      email: args.contactEmail,
      organization: 'GainForest',
    },
    skipValidation: args.skipValidation,
    dryRun: args.dryRun,
  }

  let result
  try {
    result = await publishToGbif(options, (progress) => {
      console.log(`[${progress.step}] ${progress.message}`)
    })
  } catch (err) {
    if (err instanceof PublishError) {
      console.error()
      console.error(`Error at step '${err.step}': ${err.message}`)
      if (err.cause) {
        console.error(`Caused by: ${err.cause.message}`)
      }
    } else {
      console.error(
        `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
    process.exit(1)
  }

  // ---------------------------------------------------------------------------
  // Dry-run summary
  // ---------------------------------------------------------------------------
  if (result.isDryRun) {
    console.log()
    if (args.skipValidation) {
      console.log('--- DRY RUN COMPLETE (validation skipped) ---')
      console.log(`Blob URL: ${result.archiveBlobUrl}`)
    } else {
      console.log('--- DRY RUN VALIDATION RESULT ---')
      console.log(
        `Passed:  ${result.validationPassed === null ? 'skipped' : result.validationPassed ? 'YES' : 'NO'}`,
      )
    }
    console.log('--- END DRY RUN ---')
    return
  }

  // ---------------------------------------------------------------------------
  // Full publish summary
  // ---------------------------------------------------------------------------
  const gbifBaseUrl = isProduction()
    ? 'https://www.gbif.org'
    : 'https://www.gbif-uat.org'
  const datasetUrl = `${gbifBaseUrl}/dataset/${result.gbifDatasetKey}`

  console.log()
  console.log('--- PUBLISH SUMMARY ---')
  console.log(`Dataset:       ${result.isNewDataset ? 'NEW' : 'UPDATED'}`)
  console.log(`GBIF key:      ${result.gbifDatasetKey}`)
  console.log(`Endpoint key:  ${result.gbifEndpointKey}`)
  console.log(`Blob CID:      ${result.archiveBlobCid}`)
  console.log(`Blob URL:      ${result.archiveBlobUrl}`)
  console.log(
    `Validation:    ${result.validationPassed === null ? 'skipped' : result.validationPassed ? 'passed' : 'failed'}`,
  )
  console.log(`Crawl:         ${result.crawlTriggered ? 'triggered' : 'not triggered'}`)
  console.log()
  console.log(`GBIF dataset URL: ${datasetUrl}`)
  console.log('Done.')
}

main().catch((err: unknown) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
