#!/usr/bin/env node
/**
 * Update defaultSite pointers from app.gainforest.organization.site
 * to app.certified.location.
 *
 * Background:
 *   Site records were migrated from organization.site to app.certified.location
 *   (via migrate-sites-to-certified-location.js), but the defaultSite.site
 *   AT-URIs were NOT updated — 74 of 75 still reference the deprecated collection.
 *   This script fixes that by matching old site records to new location records
 *   by name, then updating the defaultSite pointer.
 *
 * Strategy:
 *   1. Fetch all defaultSite records from Hyperindex (1 call)
 *   2. Fetch all app.certified.location records from Hyperindex (paginated)
 *   3. For each defaultSite still pointing to organization.site:
 *      a. Fetch the old site record from PDS to get its name
 *      b. Find the matching certified.location record by name + DID
 *      c. Login as org, putRecord to update defaultSite.site
 *
 * Usage:
 *   node scripts/migrations/update-default-site-to-certified-location.js \
 *     [--service https://climateai.org] \
 *     [--credentials tmp/pds-credentials.json] \
 *     [--handle handle.climateai.org] \
 *     [--limit N] \
 *     [--dry-run] \
 *     [--out tmp/default-site-pointer-update-results.json]
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AtpAgent } = require('@atproto/api')

const HYPERINDEX_ENDPOINT = 'https://api.hi.gainforest.app/graphql'
const OLD_SITE_COLLECTION = 'app.gainforest.organization.site'
const LOCATION_COLLECTION = 'app.certified.location'
const DEFAULT_SITE_COLLECTION = 'app.gainforest.organization.defaultSite'

const DEFAULT_CREDENTIALS_FILE = 'tmp/pds-credentials.json'
const DEFAULT_REPOS_FILE = 'tmp/pds-repo-inventory-20251118T0945-neworgs.json'
const DEFAULT_OUTPUT_FILE = 'tmp/default-site-pointer-update-results.json'

// ── Argument parsing ───────────────────────────────────────────────────────────

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

function resolveReposFile(explicit) {
  if (explicit) return explicit
  if (fs.existsSync(DEFAULT_REPOS_FILE)) return DEFAULT_REPOS_FILE
  return findLatestRepoInventory()
}

function parseArgs(argv) {
  const args = {
    service: process.env.PDS_SERVICE_URL || 'https://climateai.org',
    reposFile: resolveReposFile(process.env.PDS_REPO_INVENTORY_FILE),
    credentials: process.env.PDS_CREDENTIALS_FILE || DEFAULT_CREDENTIALS_FILE,
    handles: [],
    limit: undefined,
    dryRun: false,
    out: DEFAULT_OUTPUT_FILE
  }

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--service') args.service = argv[++i]
    else if (a === '--repos-file') args.reposFile = argv[++i]
    else if (a === '--credentials') args.credentials = argv[++i]
    else if (a === '--handle') args.handles.push(argv[++i])
    else if (a === '--limit') args.limit = parseInt(argv[++i], 10)
    else if (a === '--dry-run') args.dryRun = true
    else if (a === '--out') args.out = argv[++i]
  }

  return args
}

// ── File loaders ───────────────────────────────────────────────────────────────

function loadInventory(file) {
  if (!file) throw new Error('No repository inventory file provided. Pass --repos-file.')
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
  const repos = Array.isArray(raw.repos) ? raw.repos : Array.isArray(raw.newRepos) ? raw.newRepos : []
  return repos
    .filter((repo) => repo.did)
    .map((repo) => ({
      did: repo.did,
      handle: repo.handle || (repo.knownFromMigration && repo.knownFromMigration.handle) || null
    }))
}

function loadCredentials(file, required) {
  if (!fs.existsSync(file)) {
    if (required) throw new Error(`Credentials file not found: ${file}`)
    return new Map()
  }
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
  return new Map(Object.entries(raw))
}

// ── Hyperindex GraphQL helpers ─────────────────────────────────────────────────

async function graphqlQuery(query, variables = {}) {
  const response = await fetch(HYPERINDEX_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  })

  const result = await response.json()

  if (result.errors?.length > 0) {
    throw new Error(`Hyperindex GraphQL error: ${result.errors[0].message}`)
  }

  return result.data
}

/**
 * Fetch all defaultSite records from Hyperindex.
 * Returns array of { did, site } objects.
 */
async function fetchAllDefaultSites() {
  const data = await graphqlQuery(`
    query AllDefaultSites {
      appGainforestOrganizationDefaultSite(first: 100) {
        edges {
          node { did site }
        }
        totalCount
      }
    }
  `)
  return data.appGainforestOrganizationDefaultSite.edges.map((e) => e.node)
}

/**
 * Fetch app.certified.location records for a specific DID from Hyperindex.
 * Returns array of { uri, rkey, name }.
 */
async function fetchLocationsForDid(did) {
  const data = await graphqlQuery(
    `query LocationsForDid($did: String!, $first: Int!) {
      appCertifiedLocation(where: { did: { eq: $did } }, first: $first) {
        edges {
          node { uri rkey name }
        }
      }
    }`,
    { did, first: 100 }
  )
  return data.appCertifiedLocation.edges.map((e) => e.node)
}

// ── AT-URI helpers ─────────────────────────────────────────────────────────────

function parseAtUri(atUri) {
  if (!atUri || !atUri.startsWith('at://')) return null
  // at://did:plc:xxx/collection.name/rkey
  const withoutScheme = atUri.slice(5) // remove "at://"
  const parts = withoutScheme.split('/')
  if (parts.length < 3) return null
  return {
    did: parts[0],
    collection: parts.slice(1, parts.length - 1).join('/'),
    rkey: parts[parts.length - 1]
  }
}

function isOldSiteUri(atUri) {
  return typeof atUri === 'string' && atUri.includes(OLD_SITE_COLLECTION)
}

// ── Name matching ──────────────────────────────────────────────────────────────

function normalizeName(name) {
  if (!name || typeof name !== 'string') return ''
  return name.trim().toLowerCase()
}

function findMatchingLocation(oldSiteName, locations) {
  if (!oldSiteName || !locations?.length) return null

  const normalizedOld = normalizeName(oldSiteName)
  if (!normalizedOld) return null

  // Exact match (case-insensitive, trimmed)
  const match = locations.find((loc) => normalizeName(loc.name) === normalizedOld)
  return match || null
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const repos = loadInventory(args.reposFile)
  const credentials = loadCredentials(args.credentials, !args.dryRun)
  const agent = new AtpAgent({ service: args.service })

  // Build DID → handle lookup from inventory
  const didToHandle = new Map()
  for (const repo of repos) {
    if (repo.did && repo.handle) {
      didToHandle.set(repo.did, repo.handle)
    }
  }

  console.log(`\n=== Update defaultSite pointers to app.certified.location ===`)
  console.log(`Mode: ${args.dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Service: ${args.service}`)
  if (args.handles.length) console.log(`Targeting handles: ${args.handles.join(', ')}`)
  if (args.limit) console.log(`Limit: ${args.limit}`)

  // Step 1: Fetch all defaultSite records from Hyperindex
  console.log('\n[1/2] Fetching defaultSite records from Hyperindex...')
  const allDefaultSites = await fetchAllDefaultSites()
  console.log(`  Found ${allDefaultSites.length} defaultSite records`)

  // Filter to only those still pointing to organization.site
  const outdatedDefaults = allDefaultSites.filter((ds) => isOldSiteUri(ds.site))
  console.log(`  ${outdatedDefaults.length} still point to organization.site (need update)`)
  console.log(`  ${allDefaultSites.length - outdatedDefaults.length} already point to certified.location (skip)`)

  // Step 2: Process each outdated defaultSite
  // (locations are fetched per-DID on demand to avoid paginating 795+ records)
  console.log('\n[2/2] Processing defaultSite updates...\n')

  // Apply handle filter if specified
  let targets = outdatedDefaults
  if (args.handles.length) {
    const handleDids = new Set()
    for (const [did, handle] of didToHandle) {
      if (args.handles.includes(handle)) handleDids.add(did)
    }
    targets = targets.filter((ds) => handleDids.has(ds.did))
    console.log(`  Filtered to ${targets.length} targets matching specified handles`)
  }
  if (args.limit) {
    targets = targets.slice(0, args.limit)
  }

  const results = []

  for (const defaultSite of targets) {
    const did = defaultSite.did
    const handle = didToHandle.get(did) || '(unknown)'
    const oldSiteUri = defaultSite.site
    const parsed = parseAtUri(oldSiteUri)

    const result = {
      handle,
      did,
      oldSiteUri,
      oldSiteRkey: parsed?.rkey || null,
      oldSiteName: null,
      newLocationUri: null,
      newLocationName: null,
      status: 'pending',
      reason: null,
      error: null
    }

    // 3a: Fetch old site record from PDS to get its name
    try {
      if (!parsed) {
        result.status = 'skipped'
        result.reason = 'invalid-at-uri'
        results.push(result)
        console.log(`  [SKIP] ${handle} — invalid AT-URI: ${oldSiteUri}`)
        continue
      }

      const oldSiteRecord = await agent.com.atproto.repo.getRecord({
        repo: did,
        collection: OLD_SITE_COLLECTION,
        rkey: parsed.rkey
      })

      if (!oldSiteRecord.success) {
        result.status = 'skipped'
        result.reason = 'old-site-not-found'
        results.push(result)
        console.log(`  [SKIP] ${handle} — old site record not found on PDS (rkey: ${parsed.rkey})`)
        continue
      }

      const oldSiteName = oldSiteRecord.data.value?.name
      result.oldSiteName = typeof oldSiteName === 'string' ? oldSiteName : null

      if (!result.oldSiteName) {
        result.status = 'skipped'
        result.reason = 'old-site-no-name'
        results.push(result)
        console.log(`  [SKIP] ${handle} — old site record has no name field`)
        continue
      }
    } catch (err) {
      result.status = 'failed'
      result.reason = 'pds-fetch-failed'
      result.error = err?.message || String(err)
      results.push(result)
      console.log(`  [FAIL] ${handle} — failed to fetch old site from PDS: ${result.error}`)
      continue
    }

    // 3b: Find matching certified.location record by name
    let orgLocations
    try {
      orgLocations = await fetchLocationsForDid(did)
    } catch (err) {
      result.status = 'failed'
      result.reason = 'location-fetch-failed'
      result.error = err?.message || String(err)
      results.push(result)
      console.log(`  [FAIL] ${handle} — failed to fetch locations from Hyperindex: ${result.error}`)
      continue
    }

    if (!orgLocations || orgLocations.length === 0) {
      result.status = 'skipped'
      result.reason = 'no-certified-locations'
      results.push(result)
      console.log(`  [SKIP] ${handle} — no app.certified.location records found for this DID`)
      continue
    }

    const matchedLocation = findMatchingLocation(result.oldSiteName, orgLocations)
    if (!matchedLocation) {
      result.status = 'skipped'
      result.reason = 'no-name-match'
      results.push(result)
      const availableNames = orgLocations.map((l) => l.name).join(', ')
      console.log(`  [SKIP] ${handle} — no location matches name "${result.oldSiteName}" (available: ${availableNames})`)
      continue
    }

    result.newLocationUri = matchedLocation.uri
    result.newLocationName = matchedLocation.name

    // 3c: Update the defaultSite record
    if (args.dryRun) {
      result.status = 'dry-run'
      results.push(result)
      console.log(`  [DRY]  ${handle} — would update: "${result.oldSiteName}" → ${matchedLocation.uri}`)
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
          site: matchedLocation.uri
        }
      })
      result.status = 'success'
      results.push(result)
      console.log(`  [OK]   ${handle} — updated: "${result.oldSiteName}" → ${matchedLocation.uri}`)
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

  console.log('\n=== Summary ===')
  console.log(`  Total:   ${stats.total}`)
  console.log(`  Success: ${stats.success}`)
  console.log(`  Dry-run: ${stats.dryRun}`)
  console.log(`  Skipped: ${stats.skipped}`)
  console.log(`  Failed:  ${stats.failed}`)

  if (stats.skipped > 0) {
    const skipReasons = {}
    for (const r of results.filter((r) => r.status === 'skipped')) {
      skipReasons[r.reason] = (skipReasons[r.reason] || 0) + 1
    }
    console.log('\n  Skip reasons:')
    for (const [reason, count] of Object.entries(skipReasons)) {
      console.log(`    ${reason}: ${count}`)
    }
  }

  // Write results
  const output = {
    updatedAt: new Date().toISOString(),
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
  console.error('Migration failed:', err)
  process.exit(1)
})
