#!/usr/bin/env node
/*
  Create app.gainforest.dwc.occurrence records from Restor JSON and fauna CSV data.

  Data sources per org (kebab-cased handle):
    Plants (trees): S3 Observations and Predictions Data/restor/{slug}-trees.json
    Plants (herbs): S3 Observations and Predictions Data/restor/{slug}-herbs.json
    Fauna predictions: S3 Observations and Predictions Data/predictions/{slug}.csv

  For each species item in the Restor JSON items[] array, creates a rich DWC occurrence record
  with scientificName, conservationStatus, plantTraits, speciesImageUrl, etc.

  For each row in the fauna CSV, creates a DWC occurrence record with kingdom=Animalia and
  animalType in dynamicProperties.

  GBIF taxon keys are resolved from a local cache (tmp/gbif-cache.json) or via the GBIF API.

  Usage:
    node scripts/migrations/migrate-dwc-occurrences.js \
      [--service https://climateai.org] \
      [--repos-file tmp/pds-repo-inventory-*.json] \
      [--credentials tmp/pds-credentials.json] \
      [--handle handle.climateai.org] \
      [--limit N] \
      [--dry-run] \
      [--cache tmp/gbif-cache.json] \
      [--local-dir "S3 Observations and Predictions Data"] \
      [--out tmp/dwc-occurrences-migration-results.json]
*/

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const https = require('https')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { parse } = require('csv-parse/sync')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AtpAgent } = require('@atproto/api')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { TID } = require('@atproto/common-web')

const GBIF_SEARCH = 'https://api.gbif.org/v1/species/search'
const DWC_OCCURRENCE_COLLECTION = 'app.gainforest.dwc.occurrence'
const DEFAULT_LOCAL_DIR = 'S3 Observations and Predictions Data'

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

const MIN_PREFIX_MATCH = 6
const MIN_FUZZY_SIMILARITY = 0.6

function kebabCase(value) {
  if (!value || typeof value !== 'string') return null
  return value
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function longestCommonPrefixLength(a, b) {
  const limit = Math.min(a.length, b.length)
  let i = 0
  while (i < limit && a[i] === b[i]) i++
  return i
}

function levenshteinDistance(a, b) {
  if (a === b) return 0
  if (!a) return b.length
  if (!b) return a.length
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0))
  for (let i = 0; i <= a.length; i++) dp[i][0] = i
  for (let j = 0; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  return dp[a.length][b.length]
}

function similarity(a, b) {
  if (!a || !b) return 0
  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase())
  return 1 - distance / Math.max(a.length, b.length, 1)
}

function buildSlugIndex(baseDir) {
  const index = new Map()
  const sourceSets = {
    restor: new Set(),
    predictions: new Set()
  }

  function add(slug, source) {
    if (!slug) return
    const key = slug.toLowerCase()
    const existing = index.get(key) || { slug: key, sources: new Set() }
    existing.sources.add(source)
    index.set(key, existing)
    sourceSets[source].add(key)
  }

  const restorDir = path.join(baseDir, 'restor')
  if (fs.existsSync(restorDir)) {
    const entries = fs.readdirSync(restorDir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isFile()) continue
      const match = entry.name.match(/^(.+)-(trees|herbs)\.json$/i)
      if (match) add(match[1], 'restor')
    }
  }

  const predictionsDir = path.join(baseDir, 'predictions')
  if (fs.existsSync(predictionsDir)) {
    const entries = fs.readdirSync(predictionsDir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isFile()) continue
      const match = entry.name.match(/^(.+)\.csv$/i)
      if (match) add(match[1], 'predictions')
    }
  }

  return {
    index,
    stats: {
      total: index.size,
      restor: sourceSets.restor.size,
      predictions: sourceSets.predictions.size
    }
  }
}

function pickSlug(repo, slugIndex) {
  const handleSlug = (repo.handle || '').replace('.climateai.org', '').toLowerCase()
  const nameSlug = kebabCase(repo.name || repo.knownFromMigration?.name || '')
  const candidates = Array.from(new Set([handleSlug, nameSlug].filter(Boolean)))

  for (const cand of candidates) {
    const override = SLUG_OVERRIDES[cand]
    if (override && slugIndex.has(override)) {
      return { slug: override, reason: 'override', candidate: cand }
    }
  }

  for (const cand of candidates) {
    if (slugIndex.has(cand)) return { slug: cand, reason: 'exact', candidate: cand }
  }

  let bestPrefix = null
  for (const cand of candidates) {
    for (const slug of slugIndex.keys()) {
      const prefixLen = longestCommonPrefixLength(cand, slug)
      if (prefixLen >= MIN_PREFIX_MATCH && (slug.startsWith(cand) || cand.startsWith(slug))) {
        if (!bestPrefix || prefixLen > bestPrefix.score) {
          bestPrefix = { slug, reason: 'prefix', candidate: cand, score: prefixLen }
        }
      }
    }
  }
  if (bestPrefix) return bestPrefix

  let bestFuzzy = null
  for (const cand of candidates) {
    for (const slug of slugIndex.keys()) {
      const score = similarity(cand, slug)
      if (score >= MIN_FUZZY_SIMILARITY) {
        const prefix = longestCommonPrefixLength(cand, slug)
        if (!bestFuzzy || score > bestFuzzy.score || (score === bestFuzzy.score && prefix > (bestFuzzy.prefix || 0))) {
          bestFuzzy = { slug, reason: 'fuzzy', candidate: cand, score, prefix }
        }
      }
    }
  }

  return bestFuzzy
}

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
    handles: [],
    limit: undefined,
    dryRun: false,
    cache: 'tmp/gbif-cache.json',
    out: 'tmp/dwc-occurrences-migration-results.json',
    localDir: DEFAULT_LOCAL_DIR
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--service') args.service = argv[++i]
    else if (a === '--repos-file') args.reposFile = argv[++i]
    else if (a === '--credentials') args.credentials = argv[++i]
    else if (a === '--handle') args.handles.push(argv[++i])
    else if (a === '--limit') args.limit = parseInt(argv[++i], 10)
    else if (a === '--dry-run') args.dryRun = true
    else if (a === '--cache') args.cache = argv[++i]
    else if (a === '--local-dir') args.localDir = argv[++i]
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

function loadCache(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return {}
  }
}

function saveCache(file, cache) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(cache, null, 2))
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          resolve(null)
          return
        }
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          try {
            resolve(JSON.parse(data))
          } catch (err) {
            reject(err)
          }
        })
      })
      .on('error', reject)
  })
}

async function resolveGbifName(name, cache) {
  if (Object.prototype.hasOwnProperty.call(cache, name)) return cache[name]
  const url = `${GBIF_SEARCH}?q=${encodeURIComponent(name)}&qField=SCIENTIFIC&dataset_key=d7dddbf4-2cf0-4f39-9b2a-bb099caae36c`
  const json = await fetchJson(url)
  if (!json || !Array.isArray(json.results) || !json.results.length) {
    cache[name] = null
    return null
  }
  const key = json.results[0].key
  cache[name] = key
  return key
}

function tryReadLocal(baseDir, filePath) {
  const full = path.join(baseDir, filePath)
  if (fs.existsSync(full)) {
    try {
      return fs.readFileSync(full, 'utf8')
    } catch {
      return null
    }
  }
  return null
}

function tryReadLocalJson(baseDir, filePath) {
  const txt = tryReadLocal(baseDir, filePath)
  if (!txt) return null
  try {
    return JSON.parse(txt)
  } catch {
    return null
  }
}

function buildPlantTraits(item) {
  if (!item.traits && !item.edibleParts) return null
  const traits = item.traits || {}
  const result = {
    $type: 'app.gainforest.dwc.defs#plantTraits',
    traitSource: 'Restor'
  }
  if (traits.woodDensity != null) result.woodDensity = String(traits.woodDensity)
  if (traits.treeHeight != null) result.maxHeight = String(traits.treeHeight)
  if (traits.stemDiameter != null) result.stemDiameter = String(traits.stemDiameter)
  if (traits.stemConduitDiameter != null) result.stemConduitDiameter = String(traits.stemConduitDiameter)
  if (traits.barkThickness != null) result.barkThickness = String(traits.barkThickness)
  if (traits.rootDepth != null) result.rootDepth = String(traits.rootDepth)
  if (Array.isArray(item.edibleParts) && item.edibleParts.length > 0) {
    result.edibleParts = item.edibleParts
  }
  // Only return if there's at least one meaningful trait field beyond $type and traitSource
  const meaningfulKeys = Object.keys(result).filter((k) => k !== '$type' && k !== 'traitSource')
  return meaningfulKeys.length > 0 ? result : null
}

function buildConservationStatus(item) {
  if (!item.iucnCategory && !item.iucnTaxonId) return null
  const status = {
    $type: 'app.gainforest.common.defs#conservationStatus'
  }
  if (item.iucnCategory) status.iucnCategory = item.iucnCategory
  if (item.iucnTaxonId != null) status.iucnTaxonId = String(item.iucnTaxonId)
  return status
}

function buildPlantOccurrenceRecord(item, gbifTaxonKey, dataType, nowIso) {
  const imageUrl = item.awsUrl || item.imageUrl || null
  const dynamicProps = {
    group: item.group || null,
    source: 'restor',
    dataType
  }

  const record = {
    $type: DWC_OCCURRENCE_COLLECTION,
    scientificName: item.scientificName,
    basisOfRecord: 'MachineObservation',
    kingdom: 'Plantae',
    eventDate: nowIso,
    createdAt: nowIso,
    dynamicProperties: JSON.stringify(dynamicProps)
  }

  if (item.key) record.occurrenceID = item.key
  if (item.commonName) record.vernacularName = item.commonName
  if (gbifTaxonKey != null) record.gbifTaxonKey = String(gbifTaxonKey)
  if (imageUrl) {
    record.speciesImageUrl = imageUrl
    record.thumbnailUrl = imageUrl
  }

  const conservationStatus = buildConservationStatus(item)
  if (conservationStatus) record.conservationStatus = conservationStatus

  const plantTraits = buildPlantTraits(item)
  if (plantTraits) record.plantTraits = plantTraits

  return record
}

function buildFaunaOccurrenceRecord(species, animalType, gbifTaxonKey, nowIso) {
  const dynamicProps = {
    animalType: animalType || null,
    source: 'restor',
    dataType: 'fauna'
  }

  const record = {
    $type: DWC_OCCURRENCE_COLLECTION,
    scientificName: species,
    basisOfRecord: 'MachineObservation',
    kingdom: 'Animalia',
    eventDate: nowIso,
    createdAt: nowIso,
    dynamicProperties: JSON.stringify(dynamicProps)
  }

  if (gbifTaxonKey != null) record.gbifTaxonKey = String(gbifTaxonKey)

  return record
}

function parseFaunaCsv(text) {
  if (!text) return []
  const records = parse(text, { columns: true, skip_empty_lines: true })
  const seen = new Set()
  const result = []
  for (const row of records) {
    const species = (row.Species || '').trim()
    const type = (row.Type || '').trim()
    if (!species) continue
    const key = `${species}::${type}`
    if (seen.has(key)) continue
    seen.add(key)
    result.push({ species, type })
  }
  return result
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
    console.log(`[dwc-occurrences] ${message}${detailStr}`)
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const logs = []
  const log = createLogger(logs)

  log('Parsed arguments', {
    service: args.service,
    reposFile: args.reposFile,
    handles: args.handles.length,
    limit: args.limit,
    dryRun: args.dryRun,
    cache: args.cache,
    out: args.out,
    localDir: args.localDir
  })

  const repos = loadInventory(args.reposFile)
  log('Loaded repository inventory', { total: repos.length })

  const credentials = loadCredentials(args.credentials)
  log('Loaded credentials', { total: credentials.size })

  const cache = loadCache(args.cache)
  log('Loaded GBIF cache', { entries: Object.keys(cache).length })

  const { index: slugIndex, stats: slugStats } = buildSlugIndex(args.localDir)
  log('Built slug index', {
    totalSlugs: slugStats.total,
    restorSlugs: slugStats.restor,
    predictionSlugs: slugStats.predictions
  })

  const agent = new AtpAgent({ service: args.service })
  const nowIso = new Date().toISOString()

  const selected = repos.filter((repo) => {
    if (!repo.handle) return false
    if (!args.handles.length) return true
    return args.handles.includes(repo.handle)
  })
  const targets = args.limit ? selected.slice(0, args.limit) : selected
  log('Selected targets', { available: selected.length, targets: targets.length })

  console.log(`Processing DWC occurrences for ${targets.length} repo(s) (${args.dryRun ? 'dry-run' : 'live'})`)

  const results = []
  // Per-org occurrence counts for the dry-run report
  const orgCounts = {}

  for (const repo of targets) {
    log('Processing repository', { handle: repo.handle, did: repo.did })

    const password = credentials.get(repo.handle)
    if (!password) {
      log('Skipping repository: no password found', { handle: repo.handle })
      results.push({ handle: repo.handle, did: repo.did, status: 'skipped', reason: 'no-password' })
      continue
    }

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
        error: err?.message || String(err)
      })
      continue
    }

    const matchedSlug = pickSlug(repo, slugIndex)
    const orgSlug = matchedSlug?.slug || repo.handle.replace('.climateai.org', '')
    const slugLog = {
      handle: repo.handle,
      slug: orgSlug,
      reason: matchedSlug?.reason || 'fallback'
    }
    if (matchedSlug?.candidate) slugLog.candidate = matchedSlug.candidate
    if (matchedSlug?.score) slugLog.score = matchedSlug.score
    log('Selected local data slug', slugLog)

    // Load plant data
    const treesJson =
      tryReadLocalJson(args.localDir, path.join('restor', `${orgSlug}-trees.json`)) ||
      tryReadLocalJson(args.localDir, path.join('restor', `${orgSlug}-Trees.json`))
    const herbsJson =
      tryReadLocalJson(args.localDir, path.join('restor', `${orgSlug}-herbs.json`)) ||
      tryReadLocalJson(args.localDir, path.join('restor', `${orgSlug}-Herbs.json`))
    const predictionsCsvText = tryReadLocal(args.localDir, path.join('predictions', `${orgSlug}.csv`))

    log('Loaded data sources', {
      handle: repo.handle,
      treesJson: Boolean(treesJson),
      herbsJson: Boolean(herbsJson),
      predictionsCsv: Boolean(predictionsCsvText)
    })

    const treeItems = (treesJson && Array.isArray(treesJson.items)) ? treesJson.items : []
    const herbItems = (herbsJson && Array.isArray(herbsJson.items)) ? herbsJson.items : []
    const faunaRows = parseFaunaCsv(predictionsCsvText)

    if (!treeItems.length && !herbItems.length && !faunaRows.length) {
      log('No data found for org', { handle: repo.handle, slug: orgSlug })
      results.push({ handle: repo.handle, did: repo.did, status: 'skipped', reason: 'no-data', slug: orgSlug })
      continue
    }

    // Build occurrence records for trees
    const treeRecords = []
    for (const item of treeItems) {
      if (!item.scientificName) continue
      const gbifKey = await resolveGbifName(item.scientificName, cache)
      treeRecords.push(buildPlantOccurrenceRecord(item, gbifKey, 'trees', nowIso))
    }

    // Build occurrence records for herbs
    const herbRecords = []
    for (const item of herbItems) {
      if (!item.scientificName) continue
      const gbifKey = await resolveGbifName(item.scientificName, cache)
      herbRecords.push(buildPlantOccurrenceRecord(item, gbifKey, 'herbs', nowIso))
    }

    // Build occurrence records for fauna
    const faunaRecords = []
    for (const { species, type } of faunaRows) {
      const gbifKey = await resolveGbifName(species, cache)
      faunaRecords.push(buildFaunaOccurrenceRecord(species, type, gbifKey, nowIso))
    }

    const allRecords = [...treeRecords, ...herbRecords, ...faunaRecords]
    log('Built occurrence records', {
      handle: repo.handle,
      trees: treeRecords.length,
      herbs: herbRecords.length,
      fauna: faunaRecords.length,
      total: allRecords.length
    })

    orgCounts[repo.handle] = {
      trees: treeRecords.length,
      herbs: herbRecords.length,
      fauna: faunaRecords.length,
      total: allRecords.length
    }

    if (args.dryRun) {
      log('Dry-run: would create occurrence records', {
        handle: repo.handle,
        trees: treeRecords.length,
        herbs: herbRecords.length,
        fauna: faunaRecords.length
      })
      results.push({
        handle: repo.handle,
        did: repo.did,
        status: 'dry-run',
        slug: orgSlug,
        occurrenceCounts: {
          trees: treeRecords.length,
          herbs: herbRecords.length,
          fauna: faunaRecords.length,
          total: allRecords.length
        }
      })
      continue
    }

    // Live: create records on PDS
    let created = 0
    let failed = 0
    for (const record of allRecords) {
      const rkey = TID.nextStr()
      try {
        await agent.com.atproto.repo.createRecord({
          repo: repo.did,
          collection: DWC_OCCURRENCE_COLLECTION,
          rkey,
          record
        })
        created++
      } catch (err) {
        log('Failed to create occurrence record', {
          handle: repo.handle,
          scientificName: record.scientificName,
          error: err?.message || String(err)
        })
        failed++
      }
    }

    log('Finished creating occurrence records', { handle: repo.handle, created, failed })
    results.push({
      handle: repo.handle,
      did: repo.did,
      status: failed === 0 ? 'success' : 'partial',
      slug: orgSlug,
      occurrenceCounts: {
        trees: treeRecords.length,
        herbs: herbRecords.length,
        fauna: faunaRecords.length,
        total: allRecords.length
      },
      created,
      failed
    })
  }

  const orgsWithData = Object.keys(orgCounts).length
  const totalOccurrences = Object.values(orgCounts).reduce((sum, c) => sum + c.total, 0)

  const summary = {
    service: args.service,
    reposFile: args.reposFile,
    dryRun: args.dryRun,
    processedRepos: targets.length,
    orgsWithData,
    totalOccurrences,
    stats: {
      success: results.filter((r) => r.status === 'success').length,
      partial: results.filter((r) => r.status === 'partial').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      dryRun: results.filter((r) => r.status === 'dry-run').length,
      failed: results.filter((r) => r.status === 'failed').length
    },
    perOrgCounts: orgCounts
  }

  log('Finished processing', { processedRepos: targets.length, orgsWithData, totalOccurrences })

  const output = { summary, results, logs }
  fs.mkdirSync(path.dirname(args.out), { recursive: true })
  fs.writeFileSync(args.out, JSON.stringify(output, null, 2))
  saveCache(args.cache, cache)

  console.log(`\nDry-run report:`)
  console.log(`  Orgs with data: ${orgsWithData}`)
  console.log(`  Total occurrences: ${totalOccurrences}`)
  if (orgsWithData > 0) {
    console.log(`\n  Per-org breakdown:`)
    for (const [handle, counts] of Object.entries(orgCounts)) {
      console.log(`    ${handle}: trees=${counts.trees} herbs=${counts.herbs} fauna=${counts.fauna} total=${counts.total}`)
    }
  }
  console.log(`\nWrote migration results to ${args.out}`)
}

main().catch((err) => {
  console.error('Failed to migrate DWC occurrences:', err)
  process.exit(1)
})
