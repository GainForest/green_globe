#!/usr/bin/env node
/*
  Read layerData.json files from a local directory (downloaded from S3) and create
  app.gainforest.organization.layer records on the PDS for each organization.

  The layer data must already be present locally under:
    <local-dir>/<slug>/layerData.json

  The 'global' subdirectory is intentionally skipped — global layers remain on S3.

  Usage:
    node scripts/migrations/migrate-layers-to-pds.js \
      [--service https://climateai.org] \
      [--repos-file tmp/pds-repo-inventory-*.json] \
      [--credentials tmp/pds-credentials.json] \
      [--local-dir 'S3 Layer Data'] \
      [--handle handle.climateai.org] \
      [--limit N] \
      [--dry-run] \
      [--out tmp/layer-migration-results.json]
*/

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AtpAgent } = require('@atproto/api')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { TID } = require('@atproto/common-web')

const COLLECTION = 'app.gainforest.organization.layer'
const DEFAULT_LOCAL_DIR = 'S3 Layer Data'

/**
 * Handles truncated PDS handles that don't exactly match the S3 slug.
 * Mirrors the same map used in upsert-predictions-observations.js.
 */
const SLUG_OVERRIDES = {
  'xprize-2024': 'xprize-rainforest-finals',
  'xprize-rainforest': 'xprize-rainforest-finals',
  'xprize-rainfor-21p': 'xprize-rainforest-finals',
  'project-mocha': 'project-pulo',
  'masungi-georeserve': 'masungi',
  'green-ambassadors': 'green-ambassador',
  'nature-and-people': 'nature-and-people-as-one',
  'oceanus-conservati': 'oceanus-conservation',
  'centre-for-sustain': 'centre-for-sustainability-ph',
  'albertine-rural-re': 'albertine-rural-restoration-alert',
  'million-trees-proj': 'million-trees-project',
  'youth-leading-envi': 'youth-leading-environmental-change',
  'la-cotinga-biologi': 'la-cotinga-biological-station',
  'reserva-natural-mo': 'reserva-natural-monte-alegre',
  'pandu-alam-lestari': 'pandu-alam-lestari-foundation',
  'forrest-forest-reg': 'forrest-forest-regeneration-and-environmental-sustainability-trust',
  'community-based-en': 'community-based-environmental-conservation',
  'defensores-del-cha': 'defensores-del-chaco',
  'south-rift-associa': 'south-rift-association-of-landowners',
  'bees-and-trees-uga': 'bees-and-trees-uganda',
  'northern-rangeland': 'northern-rangelands-trust'
}

/** Valid layer type enum values from the lexicon. */
const VALID_LAYER_TYPES = new Set([
  'geojson_points',
  'geojson_points_trees',
  'geojson_line',
  'choropleth',
  'choropleth_shannon',
  'raster_tif',
  'tms_tile',
  'heatmap',
  'contour',
  'satellite_overlay'
])

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
    localDir: DEFAULT_LOCAL_DIR,
    handles: [],
    limit: undefined,
    dryRun: false,
    out: 'tmp/layer-migration-results.json'
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--service') args.service = argv[++i]
    else if (a === '--repos-file') args.reposFile = argv[++i]
    else if (a === '--credentials') args.credentials = argv[++i]
    else if (a === '--local-dir') args.localDir = argv[++i]
    else if (a === '--handle') args.handles.push(argv[++i])
    else if (a === '--limit') args.limit = parseInt(argv[++i], 10)
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
      handle: repo.handle || (repo.knownFromMigration && repo.knownFromMigration.handle) || null,
      name: repo.name || (repo.knownFromMigration && repo.knownFromMigration.name) || null
    }))
}

function loadCredentials(file) {
  if (!fs.existsSync(file)) throw new Error(`Credentials file not found: ${file}`)
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
  return new Map(Object.entries(raw))
}

/**
 * Build a set of slugs that have layerData.json in the local directory.
 * Excludes the 'global' subdirectory.
 */
function buildLayerSlugSet(localDir) {
  const slugs = new Set()
  if (!fs.existsSync(localDir)) return slugs
  const entries = fs.readdirSync(localDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (entry.name.toLowerCase() === 'global') continue
    const layerFile = path.join(localDir, entry.name, 'layerData.json')
    if (fs.existsSync(layerFile)) {
      slugs.add(entry.name.toLowerCase())
    }
  }
  return slugs
}

/**
 * Resolve the local slug for a repo by checking SLUG_OVERRIDES first,
 * then exact match, then prefix match against the available slugs.
 */
function resolveSlug(repo, availableSlugs) {
  const handleSlug = (repo.handle || '').replace('.climateai.org', '').toLowerCase()

  // Check override first
  const override = SLUG_OVERRIDES[handleSlug]
  if (override && availableSlugs.has(override)) {
    return { slug: override, reason: 'override' }
  }

  // Exact match
  if (availableSlugs.has(handleSlug)) {
    return { slug: handleSlug, reason: 'exact' }
  }

  // Prefix match: handle slug starts with available slug or vice versa
  for (const slug of availableSlugs) {
    if (handleSlug.startsWith(slug) || slug.startsWith(handleSlug)) {
      return { slug, reason: 'prefix' }
    }
  }

  return null
}

/**
 * Read and parse a layerData.json file. Returns null if missing or invalid.
 */
function readLayerData(localDir, slug) {
  const filePath = path.join(localDir, slug, 'layerData.json')
  if (!fs.existsSync(filePath)) return null
  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/**
 * Map a raw S3 layer object to a PDS layer record.
 * - endpoint is stored as-is (may contain template literals like ${process.env.TITILER_ENDPOINT})
 * - legend is only included if it is an array of objects with label+color
 * - string legend values (like "pm2.5") are dropped since they don't match the lexicon schema
 */
function mapLayerToRecord(layer, createdAt) {
  const record = {
    $type: COLLECTION,
    name: String(layer.name || '').slice(0, 256),
    type: VALID_LAYER_TYPES.has(layer.type) ? layer.type : undefined,
    uri: String(layer.endpoint || ''),
    createdAt
  }

  if (!record.type) {
    // Keep the raw value so the caller can log it, but mark as invalid
    record._invalidType = layer.type
    record.type = layer.type
  }

  if (layer.description && typeof layer.description === 'string') {
    record.description = layer.description.slice(0, 2000)
  }

  if (layer.category && typeof layer.category === 'string') {
    record.category = layer.category.slice(0, 128)
  }

  // legend must be an array of { label, color, value? } objects
  if (Array.isArray(layer.legend)) {
    const entries = layer.legend
      .filter((e) => e && typeof e === 'object' && typeof e.label === 'string' && typeof e.color === 'string')
      .map((e) => {
        const entry = { label: e.label.slice(0, 128), color: e.color.slice(0, 16) }
        if (e.value !== undefined) entry.value = String(e.value).slice(0, 64)
        return entry
      })
    if (entries.length > 0) {
      record.legend = entries.slice(0, 20)
    }
  }
  // String legend values (e.g. "pm2.5") are intentionally not migrated —
  // they reference named legend configs that don't map to the lexicon schema.

  // isDefault from visible or isDefault field
  const isDefaultRaw = layer.isDefault !== undefined ? layer.isDefault : layer.visible
  if (typeof isDefaultRaw === 'boolean') {
    record.isDefault = isDefaultRaw
  }

  return record
}

function createLogger(target) {
  return (message, details) => {
    const entry = { timestamp: new Date().toISOString(), message }
    let detailStr = ''
    if (details && typeof details === 'object') {
      entry.details = details
      detailStr = ` ${JSON.stringify(details)}`
    }
    target.push(entry)
    console.log(`[migrate-layers] ${message}${detailStr}`)
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const logs = []
  const log = createLogger(logs)

  log('Parsed arguments', {
    service: args.service,
    reposFile: args.reposFile,
    localDir: args.localDir,
    handles: args.handles.length,
    limit: args.limit,
    dryRun: args.dryRun,
    out: args.out
  })

  const repos = loadInventory(args.reposFile)
  log('Loaded repository inventory', { total: repos.length })

  const credentials = loadCredentials(args.credentials)
  log('Loaded credentials', { total: credentials.size })

  const availableSlugs = buildLayerSlugSet(args.localDir)
  log('Found local layer slugs', { slugs: Array.from(availableSlugs) })

  const agent = new AtpAgent({ service: args.service })
  const nowIso = new Date().toISOString()

  const selected = repos.filter((repo) => {
    if (!repo.handle) return false
    if (!args.handles.length) return true
    return args.handles.includes(repo.handle)
  })
  const targets = args.limit ? selected.slice(0, args.limit) : selected
  log('Selected targets', { available: selected.length, targets: targets.length })

  console.log(`Processing layer migration for ${targets.length} repo(s) (${args.dryRun ? 'dry-run' : 'live'})`)

  const results = []

  for (const repo of targets) {
    log('Processing repository', { handle: repo.handle, did: repo.did })

    // Resolve local slug
    const resolved = resolveSlug(repo, availableSlugs)
    if (!resolved) {
      log('Skipping repository: no matching layer data found', { handle: repo.handle })
      results.push({ handle: repo.handle, did: repo.did, status: 'skipped', reason: 'no-layer-data' })
      continue
    }

    const { slug, reason: slugReason } = resolved
    log('Resolved local slug', { handle: repo.handle, slug, reason: slugReason })

    // Read layerData.json
    const layerData = readLayerData(args.localDir, slug)
    if (!layerData || !Array.isArray(layerData.layers) || layerData.layers.length === 0) {
      log('Skipping repository: layerData.json missing or empty', { handle: repo.handle, slug })
      results.push({ handle: repo.handle, did: repo.did, status: 'skipped', reason: 'empty-layer-data', slug })
      continue
    }

    const layers = layerData.layers
    log('Read layer data', { handle: repo.handle, slug, layerCount: layers.length })

    // Check credentials
    const password = credentials.get(repo.handle)
    if (!password) {
      log('Skipping repository: no password found', { handle: repo.handle })
      results.push({
        handle: repo.handle,
        did: repo.did,
        status: 'skipped',
        reason: 'no-password',
        slug,
        layerCount: layers.length
      })
      continue
    }

    // Login
    try {
      if (!args.dryRun) {
        await agent.login({ identifier: repo.handle, password })
        log('Login succeeded', { handle: repo.handle })
      } else {
        log('Dry-run: skipping login', { handle: repo.handle })
      }
    } catch (err) {
      log('Login failed', { handle: repo.handle, error: err?.message || String(err) })
      results.push({
        handle: repo.handle,
        did: repo.did,
        status: 'failed',
        reason: 'login-failed',
        error: err?.message || String(err),
        slug,
        layerCount: layers.length
      })
      continue
    }

    // Create records for each layer
    const layerResults = []
    for (const layer of layers) {
      const record = mapLayerToRecord(layer, nowIso)
      const hasInvalidType = Boolean(record._invalidType)
      if (hasInvalidType) {
        log('Layer has invalid type — skipping', { handle: repo.handle, name: layer.name, type: layer.type })
        layerResults.push({ name: layer.name, status: 'skipped', reason: 'invalid-type', type: layer.type })
        continue
      }

      // Remove internal marker before writing
      delete record._invalidType

      const rkey = TID.nextStr()

      if (args.dryRun) {
        log('Dry-run: would create layer record', { handle: repo.handle, name: record.name, type: record.type, rkey })
        layerResults.push({ name: record.name, type: record.type, rkey, status: 'dry-run' })
        continue
      }

      try {
        await agent.com.atproto.repo.createRecord({
          repo: repo.did,
          collection: COLLECTION,
          rkey,
          record
        })
        log('Created layer record', { handle: repo.handle, name: record.name, type: record.type, rkey })
        layerResults.push({ name: record.name, type: record.type, rkey, status: 'success' })
      } catch (err) {
        log('Failed to create layer record', {
          handle: repo.handle,
          name: record.name,
          error: err?.message || String(err)
        })
        layerResults.push({
          name: record.name,
          type: record.type,
          status: 'failed',
          error: err?.message || String(err)
        })
      }
    }

    const orgStatus =
      layerResults.every((r) => r.status === 'dry-run')
        ? 'dry-run'
        : layerResults.some((r) => r.status === 'success')
          ? 'success'
          : layerResults.every((r) => r.status === 'skipped')
            ? 'skipped'
            : 'failed'

    results.push({
      handle: repo.handle,
      did: repo.did,
      status: orgStatus,
      slug,
      slugReason,
      layerCount: layers.length,
      layers: layerResults
    })
  }

  const summary = {
    service: args.service,
    reposFile: args.reposFile,
    localDir: args.localDir,
    dryRun: args.dryRun,
    processedRepos: targets.length,
    stats: {
      success: results.filter((r) => r.status === 'success').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      dryRun: results.filter((r) => r.status === 'dry-run').length,
      failed: results.filter((r) => r.status === 'failed').length
    }
  }

  log('Finished processing', { processedRepos: targets.length })

  const output = { summary, results, logs }
  fs.mkdirSync(path.dirname(args.out), { recursive: true })
  fs.writeFileSync(args.out, JSON.stringify(output, null, 2))
  console.log(`Wrote layer migration results to ${args.out}`)
}

main().catch((err) => {
  console.error('Failed to migrate layers:', err)
  process.exit(1)
})
