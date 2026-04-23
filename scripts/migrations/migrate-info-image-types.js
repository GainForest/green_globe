#!/usr/bin/env node
/*
  Migrate coverImage and logo fields in organization info records from
  app.gainforest.common.defs#smallImage to org.hypercerts.defs#smallImage.

  The SDK lexicon expects these image fields to use org.hypercerts.defs#smallImage
  as the $type discriminator. Existing PDS records store them with the wrong type
  app.gainforest.common.defs#smallImage. This script updates the $type discriminator
  while leaving the blob ref structure ({image: {ref, mimeType, size}}) unchanged.

  CRITICAL: The ATProto SDK internalizes $type — direct bracket access (obj['$type'])
  returns undefined. We MUST use Object.entries() iteration to read it, and manually
  reconstruct the object (spread won't copy the internalized $type).

  Usage:
    node scripts/migrations/migrate-info-image-types.js \
      [--service https://climateai.org] \
      [--repos-file tmp/pds-repo-inventory-*.json] \
      [--credentials tmp/pds-credentials.json] \
      [--limit N] \
      [--handle handle.climateai.org] \
      [--dry-run] \
      [--out tmp/info-image-types-migration-results.json]
*/

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AtpAgent } = require('@atproto/api')

const COLLECTION = 'app.gainforest.organization.info'
const WRONG_TYPE = 'app.gainforest.common.defs#smallImage'
const CORRECT_TYPE = 'org.hypercerts.defs#smallImage'

function findLatestRepoInventory() {
  const dir = 'tmp'
  try {
    const entries = fs.readdirSync(dir)
    const matches = entries
      .filter((name) => /^pds-repo-inventory-.*\.json$/i.test(name))
      .sort()
    if (!matches.length) return null
    return path.join(dir, matches[matches.length - 1])
  } catch {
    return null
  }
}

function parseArgs(argv) {
  const args = {
    service: process.env.PDS_SERVICE_URL || 'https://climateai.org',
    reposFile: process.env.PDS_REPO_INVENTORY_FILE || findLatestRepoInventory(),
    credentials: process.env.PDS_CREDENTIALS_FILE || 'tmp/pds-credentials.json',
    limit: undefined,
    dryRun: false,
    handles: [],
    out: 'tmp/info-image-types-migration-results.json'
  }

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--service') args.service = argv[++i]
    else if (a === '--repos-file') args.reposFile = argv[++i]
    else if (a === '--credentials') args.credentials = argv[++i]
    else if (a === '--limit') args.limit = parseInt(argv[++i], 10)
    else if (a === '--handle') args.handles.push(argv[++i])
    else if (a === '--dry-run') args.dryRun = true
    else if (a === '--out') args.out = argv[++i]
  }

  return args
}

function loadInventory(file) {
  if (!file) throw new Error('No repository inventory file found. Run bun run pds:list-repos first or pass --repos-file.')
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
  const repos = Array.isArray(raw.repos) ? raw.repos : []
  return repos
    .filter((repo) => repo.did)
    .map((repo) => ({
      did: repo.did,
      handle: repo.handle || (repo.knownFromMigration && repo.knownFromMigration.handle) || null
    }))
}

function loadCredentials(file) {
  if (!fs.existsSync(file)) throw new Error(`Credentials file not found: ${file}`)
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
  return new Map(Object.entries(raw))
}

/**
 * Read $type from an ATProto SDK object using Object.entries() iteration.
 * Direct bracket access (obj['$type']) returns undefined due to SDK internalization.
 */
function getType(obj) {
  if (obj === null || typeof obj !== 'object') return undefined
  for (const [k, v] of Object.entries(obj)) {
    if (k === '$type') return v
  }
  return undefined
}

/**
 * Check whether an image field needs migration.
 * Returns: 'needs-migration' | 'already-correct' | 'no-field' | 'unexpected'
 */
function checkImageField(fieldValue) {
  if (fieldValue === undefined || fieldValue === null) {
    return { status: 'no-field' }
  }
  const type = getType(fieldValue)
  if (type === WRONG_TYPE) {
    return { status: 'needs-migration', type }
  }
  if (type === CORRECT_TYPE) {
    return { status: 'already-correct', type }
  }
  return { status: 'unexpected', type: type !== undefined ? type : typeof fieldValue }
}

/**
 * Reconstruct an image field with the correct $type.
 * We cannot use spread to copy $type (SDK internalizes it), so we manually
 * reconstruct the object with only the fields we know: $type and image (blob ref).
 */
function migrateImageField(existingField) {
  return {
    '$type': CORRECT_TYPE,
    image: existingField.image
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const repos = loadInventory(args.reposFile)
  const credentials = loadCredentials(args.credentials)
  const agent = new AtpAgent({ service: args.service })

  const selected = repos.filter((repo) => {
    if (!repo.handle) return false
    if (!args.handles.length) return true
    return args.handles.includes(repo.handle)
  })

  const targets = args.limit ? selected.slice(0, args.limit) : selected
  console.log(`Migrating coverImage/logo $type for ${targets.length} repo(s) (${args.dryRun ? 'dry-run' : 'live'})`)

  const results = []

  for (const repo of targets) {
    const password = credentials.get(repo.handle)
    if (!password) {
      results.push({
        handle: repo.handle,
        did: repo.did,
        status: 'skipped',
        reason: 'no-password'
      })
      continue
    }

    try {
      if (!args.dryRun) {
        await agent.login({ identifier: repo.handle, password })
      }
    } catch (err) {
      results.push({
        handle: repo.handle,
        did: repo.did,
        status: 'failed',
        reason: 'login-failed',
        error: err?.message || String(err)
      })
      continue
    }

    let infoRecord
    try {
      infoRecord = await agent.com.atproto.repo.getRecord({
        repo: repo.did,
        collection: COLLECTION,
        rkey: 'self'
      })
    } catch (err) {
      if (err?.status === 404 || err?.error === 'RecordNotFound') {
        results.push({
          handle: repo.handle,
          did: repo.did,
          status: 'skipped',
          reason: 'no-info-record'
        })
        continue
      }
      results.push({
        handle: repo.handle,
        did: repo.did,
        status: 'failed',
        reason: 'fetch-failed',
        error: err?.message || String(err)
      })
      continue
    }

    const current = infoRecord?.data?.value || {}
    const coverImageCheck = checkImageField(current.coverImage)
    const logoCheck = checkImageField(current.logo)

    const coverNeedsMigration = coverImageCheck.status === 'needs-migration'
    const logoNeedsMigration = logoCheck.status === 'needs-migration'

    // Neither field needs migration — skip
    if (!coverNeedsMigration && !logoNeedsMigration) {
      results.push({
        handle: repo.handle,
        did: repo.did,
        status: 'skipped',
        reason: 'already-correct-or-absent',
        coverImage: coverImageCheck,
        logo: logoCheck
      })
      continue
    }

    if (args.dryRun) {
      results.push({
        handle: repo.handle,
        did: repo.did,
        status: 'dry-run',
        coverImage: coverImageCheck,
        logo: logoCheck
      })
      continue
    }

    // Build the updated record: spread all existing fields, then override only
    // the image fields that need migration. We reconstruct each image field
    // manually because spread won't copy the internalized $type.
    const nextRecord = { ...current }
    if (coverNeedsMigration) {
      nextRecord.coverImage = migrateImageField(current.coverImage)
    }
    if (logoNeedsMigration) {
      nextRecord.logo = migrateImageField(current.logo)
    }

    try {
      await agent.com.atproto.repo.putRecord({
        repo: repo.did,
        collection: COLLECTION,
        rkey: 'self',
        record: nextRecord
      })
      results.push({
        handle: repo.handle,
        did: repo.did,
        status: 'success',
        coverImage: coverImageCheck,
        logo: logoCheck
      })
    } catch (err) {
      results.push({
        handle: repo.handle,
        did: repo.did,
        status: 'failed',
        reason: 'update-failed',
        error: err?.message || String(err)
      })
    }
  }

  const summary = {
    service: args.service,
    reposFile: args.reposFile,
    dryRun: args.dryRun,
    processedRepos: targets.length,
    stats: {
      success: results.filter((r) => r.status === 'success').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      dryRun: results.filter((r) => r.status === 'dry-run').length,
      failed: results.filter((r) => r.status === 'failed').length
    }
  }

  const out = { summary, results }
  fs.mkdirSync(path.dirname(args.out), { recursive: true })
  fs.writeFileSync(args.out, JSON.stringify(out, null, 2))
  console.log(`Wrote coverImage/logo $type migration results to ${args.out}`)
}

main().catch((err) => {
  console.error('Failed to migrate coverImage/logo $type:', err)
  process.exit(1)
})
