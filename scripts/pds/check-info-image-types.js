#!/usr/bin/env node
/*
  Check the $type of coverImage and logo in organization info records.

  For each app.gainforest.organization.info record, reports whether
  coverImage and logo have the wrong $type (app.gainforest.common.defs#smallImage,
  needs migration) or the correct $type (org.hypercerts.defs#smallImage,
  already migrated), or are absent.

  Key implementation detail: The ATProto SDK internalizes $type — direct bracket
  access (val['$type']) returns undefined. We MUST use Object.entries() iteration
  to read the $type discriminator.

  Usage:
    node scripts/pds/check-info-image-types.js \
      [--service https://climateai.org] \
      [--repos-file tmp/pds-repo-inventory-*.json] \
      [--limit N] \
      [--handle handle.climateai.org] \
      [--out tmp/info-image-types-check.json]
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
    handles: [],
    limit: undefined,
    out: 'tmp/info-image-types-check.json'
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--service') args.service = argv[++i]
    else if (a === '--repos-file') args.reposFile = argv[++i]
    else if (a === '--handle') args.handles.push(argv[++i])
    else if (a === '--limit') args.limit = parseInt(argv[++i], 10)
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
 * Categorize a single image field value.
 * Returns: 'needs-migration' | 'already-correct' | 'no-field' | 'unexpected'
 */
function categorizeImageField(fieldValue) {
  if (fieldValue === undefined || fieldValue === null) {
    return { status: 'no-field', type: undefined }
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

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const repos = loadInventory(args.reposFile)
  const agent = new AtpAgent({ service: args.service })

  const selected = repos.filter((repo) => {
    if (!repo.handle) return false
    if (!args.handles.length) return true
    return args.handles.includes(repo.handle)
  })

  const targets = args.limit ? selected.slice(0, args.limit) : selected
  console.log(`Checking ${targets.length} repo(s) for coverImage and logo $type`)

  const needsMigration = []
  const alreadyCorrect = []
  const noField = []
  const errors = []

  for (const repo of targets) {
    let record
    try {
      record = await agent.com.atproto.repo.getRecord({
        repo: repo.did,
        collection: COLLECTION,
        rkey: 'self'
      })
    } catch (err) {
      if (err?.status === 404 || err?.error === 'RecordNotFound') {
        continue
      }
      errors.push({
        handle: repo.handle,
        did: repo.did,
        error: err?.message || String(err)
      })
      continue
    }

    const value = record?.data?.value || {}
    const coverImageResult = categorizeImageField(value.coverImage)
    const logoResult = categorizeImageField(value.logo)

    const entry = {
      handle: repo.handle,
      did: repo.did,
      coverImage: coverImageResult,
      logo: logoResult
    }

    const coverNeedsMigration = coverImageResult.status === 'needs-migration'
    const logoNeedsMigration = logoResult.status === 'needs-migration'
    const coverAlreadyCorrect = coverImageResult.status === 'already-correct'
    const logoAlreadyCorrect = logoResult.status === 'already-correct'
    const coverNoField = coverImageResult.status === 'no-field'
    const logoNoField = logoResult.status === 'no-field'

    if (coverNeedsMigration || logoNeedsMigration) {
      needsMigration.push(entry)
    } else if (coverAlreadyCorrect || logoAlreadyCorrect) {
      alreadyCorrect.push(entry)
    } else if (coverNoField && logoNoField) {
      noField.push(entry)
    } else {
      // unexpected $type or mixed state — still report
      needsMigration.push(entry)
    }
  }

  const output = {
    service: args.service,
    reposFile: args.reposFile,
    checkedRepos: targets.length,
    wrongType: WRONG_TYPE,
    correctType: CORRECT_TYPE,
    needsMigration,
    alreadyCorrect,
    noField,
    errors
  }

  fs.mkdirSync(path.dirname(args.out), { recursive: true })
  fs.writeFileSync(args.out, JSON.stringify(output, null, 2))
  console.log(
    `coverImage/logo $type check written to ${args.out}. ` +
    `Needs migration: ${needsMigration.length}, already correct: ${alreadyCorrect.length}, ` +
    `no field: ${noField.length}, errors: ${errors.length}`
  )
}

main().catch((err) => {
  console.error('coverImage/logo $type check failed:', err)
  process.exit(1)
})
