#!/usr/bin/env node
/**
 * Fix the 19 failed defaultSite pointer updates.
 *
 * Background:
 *   The initial update-default-site-to-certified-location.js script failed for
 *   19 orgs because their defaultSite.site AT-URI references an old rkey from
 *   before the migrate-sites-collection.js migration. The actual site records
 *   on the PDS have different rkeys.
 *
 * Strategy:
 *   Instead of using the rkey from defaultSite.site, this script uses
 *   listRecords to discover the actual PDS site records, then matches
 *   to app.certified.location by name.
 *
 *   - For orgs with 1 certified.location: pick it directly (17 of 19)
 *   - For orgs with multiple: match the first PDS site record's name
 *     to a certified.location by name
 *
 * Usage:
 *   node scripts/migrations/fix-failed-default-site-pointers.js \
 *     [--service https://climateai.org] \
 *     [--credentials tmp/pds-credentials.json] \
 *     [--results tmp/default-site-pointer-update-results.json] \
 *     [--handle handle.climateai.org] \
 *     [--limit N] \
 *     [--dry-run] \
 *     [--out tmp/fix-failed-default-site-pointer-results.json]
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AtpAgent } = require('@atproto/api')

const HYPERINDEX_ENDPOINT = 'https://api.hi.gainforest.app/graphql'
const OLD_SITE_COLLECTION = 'app.gainforest.organization.site'
const DEFAULT_SITE_COLLECTION = 'app.gainforest.organization.defaultSite'

const DEFAULT_CREDENTIALS_FILE = 'tmp/pds-credentials.json'
const DEFAULT_RESULTS_FILE = 'tmp/default-site-pointer-update-results.json'
const DEFAULT_OUTPUT_FILE = 'tmp/fix-failed-default-site-pointer-results.json'

// ── Argument parsing ───────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {
    service: process.env.PDS_SERVICE_URL || 'https://climateai.org',
    credentials: process.env.PDS_CREDENTIALS_FILE || DEFAULT_CREDENTIALS_FILE,
    resultsFile: DEFAULT_RESULTS_FILE,
    handles: [],
    limit: undefined,
    dryRun: false,
    out: DEFAULT_OUTPUT_FILE
  }

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--service') args.service = argv[++i]
    else if (a === '--credentials') args.credentials = argv[++i]
    else if (a === '--results') args.resultsFile = argv[++i]
    else if (a === '--handle') args.handles.push(argv[++i])
    else if (a === '--limit') args.limit = parseInt(argv[++i], 10)
    else if (a === '--dry-run') args.dryRun = true
    else if (a === '--out') args.out = argv[++i]
  }

  return args
}

function loadCredentials(file, required) {
  if (!fs.existsSync(file)) {
    if (required) throw new Error(`Credentials file not found: ${file}`)
    return new Map()
  }
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
  return new Map(Object.entries(raw))
}

// ── Hyperindex helper ──────────────────────────────────────────────────────────

async function fetchLocationsForDid(did) {
  const response = await fetch(HYPERINDEX_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query Q($did: String!) {
        appCertifiedLocation(where: { did: { eq: $did } }, first: 100) {
          edges { node { uri rkey name } }
        }
      }`,
      variables: { did }
    })
  })

  const json = await response.json()
  if (json.errors?.length > 0) {
    throw new Error(`Hyperindex error: ${json.errors[0].message}`)
  }
  return json.data.appCertifiedLocation.edges.map((e) => e.node)
}

// ── PDS helper ─────────────────────────────────────────────────────────────────

async function listSiteRecords(agent, did) {
  const records = []
  let cursor
  while (true) {
    const res = await agent.com.atproto.repo.listRecords({
      repo: did,
      collection: OLD_SITE_COLLECTION,
      limit: 100,
      cursor
    })
    records.push(...(res.data.records || []))
    if (!res.data.cursor) break
    cursor = res.data.cursor
  }
  return records
}

// ── Name matching ──────────────────────────────────────────────────────────────

function normalizeName(name) {
  if (!name || typeof name !== 'string') return ''
  return name.trim().toLowerCase()
}

function findMatchingLocation(siteName, locations) {
  if (!siteName || !locations?.length) return null
  const normalized = normalizeName(siteName)
  if (!normalized) return null
  return locations.find((loc) => normalizeName(loc.name) === normalized) || null
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const credentials = loadCredentials(args.credentials, !args.dryRun)

  // Load previous results and extract failed entries
  if (!fs.existsSync(args.resultsFile)) {
    throw new Error(`Results file not found: ${args.resultsFile}`)
  }
  const previousResults = JSON.parse(fs.readFileSync(args.resultsFile, 'utf8'))
  let failedEntries = previousResults.results.filter((r) => r.status === 'failed')

  console.log(`\n=== Fix failed defaultSite pointer updates ===`)
  console.log(`Mode: ${args.dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Service: ${args.service}`)
  console.log(`Found ${failedEntries.length} failed entries to fix`)

  // Apply handle filter
  if (args.handles.length) {
    failedEntries = failedEntries.filter((e) => args.handles.includes(e.handle))
    console.log(`Filtered to ${failedEntries.length} entries matching specified handles`)
  }
  if (args.limit) {
    failedEntries = failedEntries.slice(0, args.limit)
  }

  const agent = new AtpAgent({ service: args.service })
  const results = []

  for (const entry of failedEntries) {
    const { handle, did } = entry
    const result = {
      handle,
      did,
      pdsSiteName: null,
      matchedLocationUri: null,
      matchedLocationName: null,
      matchStrategy: null,
      status: 'pending',
      reason: null,
      error: null
    }

    // Step 1: Fetch certified.location records from Hyperindex
    let locations
    try {
      locations = await fetchLocationsForDid(did)
    } catch (err) {
      result.status = 'failed'
      result.reason = 'location-fetch-failed'
      result.error = err?.message || String(err)
      results.push(result)
      console.log(`  [FAIL] ${handle} — Hyperindex fetch failed: ${result.error}`)
      continue
    }

    if (!locations.length) {
      result.status = 'skipped'
      result.reason = 'no-certified-locations'
      results.push(result)
      console.log(`  [SKIP] ${handle} — no app.certified.location records`)
      continue
    }

    // Step 2: Determine the target location
    let targetLocation

    if (locations.length === 1) {
      // Single location — pick it directly, no name matching needed
      targetLocation = locations[0]
      result.matchStrategy = 'single-location'
    } else {
      // Multiple locations — use listRecords on PDS to find the first site's name
      let pdsRecords
      try {
        pdsRecords = await listSiteRecords(agent, did)
      } catch (err) {
        result.status = 'failed'
        result.reason = 'pds-list-failed'
        result.error = err?.message || String(err)
        results.push(result)
        console.log(`  [FAIL] ${handle} — PDS listRecords failed: ${result.error}`)
        continue
      }

      if (!pdsRecords.length) {
        result.status = 'failed'
        result.reason = 'no-pds-site-records'
        results.push(result)
        console.log(`  [FAIL] ${handle} — no organization.site records found on PDS`)
        continue
      }

      // Use the first PDS site record's name to find matching location
      const firstName = pdsRecords[0].value?.name
      result.pdsSiteName = firstName

      targetLocation = findMatchingLocation(firstName, locations)
      if (!targetLocation) {
        // If name match fails, just pick the first location as fallback
        targetLocation = locations[0]
        result.matchStrategy = 'fallback-first-location'
        const availableNames = locations.map((l) => l.name || '(null)').join(', ')
        console.log(`  [WARN] ${handle} — no name match for "${firstName}", falling back to first location. Available: [${availableNames}]`)
      } else {
        result.matchStrategy = 'name-match'
      }
    }

    result.matchedLocationUri = targetLocation.uri
    result.matchedLocationName = targetLocation.name

    // Step 3: Update the defaultSite record
    if (args.dryRun) {
      result.status = 'dry-run'
      results.push(result)
      console.log(`  [DRY]  ${handle} — would update → "${targetLocation.name}" (${result.matchStrategy}) ${targetLocation.uri}`)
      continue
    }

    // Login as org
    const password = credentials.get(handle)
    if (!password) {
      result.status = 'skipped'
      result.reason = 'no-password'
      results.push(result)
      console.log(`  [SKIP] ${handle} — no password in credentials file`)
      continue
    }

    try {
      await agent.login({ identifier: handle, password })
    } catch (err) {
      result.status = 'failed'
      result.reason = 'login-failed'
      result.error = err?.message || String(err)
      results.push(result)
      console.log(`  [FAIL] ${handle} — login failed: ${result.error}`)
      continue
    }

    try {
      await agent.com.atproto.repo.putRecord({
        repo: did,
        collection: DEFAULT_SITE_COLLECTION,
        rkey: 'self',
        record: {
          $type: DEFAULT_SITE_COLLECTION,
          site: targetLocation.uri
        }
      })
      result.status = 'success'
      results.push(result)
      console.log(`  [OK]   ${handle} — updated → "${targetLocation.name}" (${result.matchStrategy}) ${targetLocation.uri}`)
    } catch (err) {
      result.status = 'failed'
      result.reason = 'put-record-failed'
      result.error = err?.message || String(err)
      results.push(result)
      console.log(`  [FAIL] ${handle} — putRecord failed: ${result.error}`)
    }
  }

  // Summary
  const stats = {
    total: results.length,
    success: results.filter((r) => r.status === 'success').length,
    dryRun: results.filter((r) => r.status === 'dry-run').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    failed: results.filter((r) => r.status === 'failed').length
  }

  const strategies = {}
  for (const r of results.filter((r) => r.status === 'success' || r.status === 'dry-run')) {
    strategies[r.matchStrategy] = (strategies[r.matchStrategy] || 0) + 1
  }

  console.log('\n=== Summary ===')
  console.log(`  Total:   ${stats.total}`)
  console.log(`  Success: ${stats.success}`)
  console.log(`  Dry-run: ${stats.dryRun}`)
  console.log(`  Skipped: ${stats.skipped}`)
  console.log(`  Failed:  ${stats.failed}`)
  console.log('\n  Match strategies:')
  for (const [strategy, count] of Object.entries(strategies)) {
    console.log(`    ${strategy}: ${count}`)
  }

  // Write results
  const output = {
    fixedAt: new Date().toISOString(),
    service: args.service,
    dryRun: args.dryRun,
    stats,
    results
  }

  fs.mkdirSync(path.dirname(args.out), { recursive: true })
  fs.writeFileSync(args.out, JSON.stringify(output, null, 2))
  console.log(`\nResults written to ${args.out}`)
}

main().catch((err) => {
  console.error('Fix script failed:', err)
  process.exit(1)
})
