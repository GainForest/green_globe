#!/usr/bin/env node
/*
  Check the type of longDescription in organization info records.

  For each app.gainforest.organization.info record, reports whether
  longDescription is a plain string (needs migration), an object with a
  'blocks' array (already migrated to linearDocument), or missing.

  Usage:
    node scripts/pds/check-info-longdescription-type.js \
      [--service https://climateai.org] \
      [--repos-file tmp/pds-repo-inventory-*.json] \
      [--limit N] \
      [--handle handle.climateai.org] \
      [--out tmp/info-longdescription-type-check.json]
*/

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AtpAgent } = require('@atproto/api')

const COLLECTION = 'app.gainforest.organization.info'

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
    out: 'tmp/info-longdescription-type-check.json'
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
  console.log(`Checking ${targets.length} repo(s) for longDescription type`)

  const needsMigration = []
  const alreadyMigrated = []
  const failures = []

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
      failures.push({
        handle: repo.handle,
        did: repo.did,
        error: err?.message || String(err)
      })
      continue
    }

    const value = record?.data?.value || {}
    const longDescription = value.longDescription

    if (typeof longDescription === 'string') {
      needsMigration.push({
        handle: repo.handle,
        did: repo.did,
        longDescriptionType: 'string',
        sample: longDescription.slice(0, 200)
      })
    } else if (longDescription !== null && typeof longDescription === 'object' && Array.isArray(longDescription.blocks)) {
      alreadyMigrated.push({
        handle: repo.handle,
        did: repo.did,
        longDescriptionType: 'linearDocument'
      })
    } else {
      needsMigration.push({
        handle: repo.handle,
        did: repo.did,
        longDescriptionType: longDescription === undefined ? 'missing' : typeof longDescription,
        sample: longDescription !== undefined ? String(longDescription).slice(0, 200) : undefined
      })
    }
  }

  const output = {
    service: args.service,
    reposFile: args.reposFile,
    checkedRepos: targets.length,
    needsMigration,
    alreadyMigrated,
    failures
  }

  fs.mkdirSync(path.dirname(args.out), { recursive: true })
  fs.writeFileSync(args.out, JSON.stringify(output, null, 2))
  console.log(
    `longDescription type check written to ${args.out}. ` +
    `Needs migration: ${needsMigration.length}, already migrated: ${alreadyMigrated.length}`
  )
}

main().catch((err) => {
  console.error('longDescription type check failed:', err)
  process.exit(1)
})
