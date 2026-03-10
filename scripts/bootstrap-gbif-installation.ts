#!/usr/bin/env bun
/**
 * bootstrap-gbif-installation.ts — One-time CLI script to create an
 * HTTP_INSTALLATION for GainForest on GBIF.
 *
 * Run once per environment (UAT and production).
 *
 * Usage:
 *   bun run scripts/bootstrap-gbif-installation.ts [--title <title>]
 *
 * Arguments:
 *   --title   (optional) Installation title
 *             Default: 'GainForest Green Globe Publishing System'
 *
 * Required environment variables (read from gbifConfig):
 *   GBIF_USERNAME       GBIF account username
 *   GBIF_PASSWORD       GBIF account password
 *   GBIF_API_URL        GBIF API base URL (default: https://api.gbif-uat.org/v1)
 *   GBIF_ORG_KEY        GBIF organization UUID
 */

import { gbifConfig, isProduction } from '../src/config/gbif'
import {
  createInstallation,
  GbifApiError,
} from '../src/lib/gbif/api/registry-client'

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

const USAGE = `
Usage:
  bun run scripts/bootstrap-gbif-installation.ts [--title <title>]

Optional arguments:
  --title   Installation title
            Default: 'GainForest Green Globe Publishing System'
  --help    Show this help message
`.trim()

function parseArgs(argv: string[]): { title: string } | null {
  const args = argv.slice(2) // skip 'bun' and script path

  if (args.includes('--help') || args.includes('-h')) {
    console.log(USAGE)
    process.exit(0)
  }

  const titleIdx = args.indexOf('--title')
  const title =
    titleIdx !== -1 && args[titleIdx + 1]
      ? args[titleIdx + 1]
      : 'GainForest Green Globe Publishing System'

  return { title }
}

// ---------------------------------------------------------------------------
// Env validation
// ---------------------------------------------------------------------------

function validateEnv(): void {
  const missing: string[] = []

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

  // Validate env vars
  validateEnv()

  // Print target environment
  const env = isProduction() ? 'PRODUCTION' : 'UAT'
  console.log(`Target environment: ${env}`)
  console.log(`GBIF API URL:       ${gbifConfig.apiUrl}`)
  console.log(`Organization key:   ${gbifConfig.orgKey}`)
  console.log(`Installation title: ${args.title}`)
  console.log()

  // Create the installation
  console.log('Creating HTTP_INSTALLATION...')

  let installationKey: string
  try {
    installationKey = await createInstallation({
      organizationKey: gbifConfig.orgKey!,
      type: 'HTTP_INSTALLATION',
      title: args.title,
      description:
        'Automated DwC-A publishing from GainForest ATProto PDS',
    })
  } catch (err) {
    if (err instanceof GbifApiError) {
      console.error(`GBIF API error ${err.status} ${err.statusText}`)
      console.error(`Response body: ${err.responseBody}`)
    } else {
      console.error(
        `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
    process.exit(1)
  }

  // Success — print UUID and instructions
  console.log('Installation created successfully!')
  console.log()
  console.log(`Installation UUID: ${installationKey}`)
  console.log()
  console.log('Add the following to your .env file:')
  console.log()
  console.log(`  GBIF_INSTALLATION_KEY=${installationKey}`)
  console.log()
  console.log(
    'Note: Multiple installations are fine — GBIF allows more than one per organization.',
  )
}

main().catch((err: unknown) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
