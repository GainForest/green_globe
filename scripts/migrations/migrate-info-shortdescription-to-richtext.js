#!/usr/bin/env node
/*
  Migrate shortDescription fields in organization info records from plain string
  to richtext object format.

  The SDK lexicon expects shortDescription to be a richtext object:
  { text: string, facets?: array } matching app.gainforest.common.defs#richtext.
  Existing PDS records store shortDescription as a plain string. This script
  converts each string value to { text: shortDescription }.

  Usage:
    node scripts/migrations/migrate-info-shortdescription-to-richtext.js \
      [--service https://climateai.org] \
      [--repos-file tmp/pds-repo-inventory-*.json] \
      [--credentials tmp/pds-credentials.json] \
      [--limit N] \
      [--handle handle.climateai.org] \
      [--dry-run] \
      [--out tmp/info-shortdescription-richtext-migration-results.json]
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
    credentials: process.env.PDS_CREDENTIALS_FILE || 'tmp/pds-credentials.json',
    limit: undefined,
    dryRun: false,
    handles: [],
    out: 'tmp/info-shortdescription-richtext-migration-results.json'
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
  console.log(`Migrating shortDescription for ${targets.length} repo(s) (${args.dryRun ? 'dry-run' : 'live'})`)

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
    const shortDescription = current.shortDescription

    // Already migrated: shortDescription is an object with a text property
    if (shortDescription !== null && typeof shortDescription === 'object' && typeof shortDescription.text === 'string') {
      results.push({
        handle: repo.handle,
        did: repo.did,
        status: 'skipped',
        reason: 'already-migrated'
      })
      continue
    }

    // Needs migration: shortDescription is a plain string
    if (typeof shortDescription !== 'string') {
      results.push({
        handle: repo.handle,
        did: repo.did,
        status: 'skipped',
        reason: 'no-string-shortdescription'
      })
      continue
    }

    const nextRecord = { ...current, shortDescription: { text: shortDescription } }

    if (args.dryRun) {
      results.push({
        handle: repo.handle,
        did: repo.did,
        status: 'dry-run',
        shortDescriptionSample: shortDescription.slice(0, 200)
      })
      continue
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
        shortDescriptionSample: shortDescription.slice(0, 200)
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
  console.log(`Wrote shortDescription richtext migration results to ${args.out}`)
}

main().catch((err) => {
  console.error('Failed to migrate shortDescription to richtext:', err)
  process.exit(1)
})
