#!/usr/bin/env node
/*
  Ingest predictions and observations data from AWS, resolve species to GBIF taxon keys,
  and write to PDS collections:
    - app.gainforest.organization.predictions.flora
    - app.gainforest.organization.predictions.fauna
    - app.gainforest.organization.observations.flora
    - app.gainforest.organization.observations.fauna

  Data sources per org (kebab-cased handle):
    Plants predictions: https://gainforest-transparency-dashboard.s3.amazonaws.com/restor/<org>-Trees.json
    Plants predictions: https://gainforest-transparency-dashboard.s3.amazonaws.com/restor/<org>-Herbs.json
    Animal predictions: https://gainforest-transparency-dashboard.s3.amazonaws.com/predictions/<org>.csv
    Observations (plants/animals): https://gainforest-transparency-dashboard.s3.amazonaws.com/observations/<org>.csv

  GBIF resolution:
    https://www.gbif.org/api/species/search?q={name}&qField=SCIENTIFIC&dataset_key=d7dddbf4-2cf0-4f39-9b2a-bb099caae36c
    Take first result.key as taxonId (strip any gbif: prefix). Keys stored as strings.

  Usage:
    node scripts/migrations/upsert-predictions-observations.js \
      [--service https://climateai.org] \
      [--repos-file tmp/pds-repo-inventory-*.json] \
      [--credentials tmp/pds-credentials.json] \
      [--handle handle.climateai.org] \
      [--limit N] \
      [--dry-run] \
      [--cache tmp/gbif-cache.json] \
      [--out tmp/pred-obs-migration-results.json]
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

const AWS_BASE = 'https://gainforest-transparency-dashboard.s3.amazonaws.com'
const GBIF_SEARCH = 'https://api.gbif.org/v1/species/search'
const GBIF_MATCH = 'https://api.gbif.org/v1/species/match'
const COLLECTIONS = {
  predictionsFlora: 'app.gainforest.organization.predictions.flora',
  predictionsFauna: 'app.gainforest.organization.predictions.fauna',
  observationsFlora: 'app.gainforest.organization.observations.flora',
  observationsFauna: 'app.gainforest.organization.observations.fauna'
}
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
    predictions: new Set(),
    observations: new Set()
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

  const observationsDir = path.join(baseDir, 'observations')
  if (fs.existsSync(observationsDir)) {
    const entries = fs.readdirSync(observationsDir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isFile()) continue
      const match = entry.name.match(/^(.+)\.csv$/i)
      if (match) add(match[1], 'observations')
    }
  }

  return {
    index,
    stats: {
      total: index.size,
      restor: sourceSets.restor.size,
      predictions: sourceSets.predictions.size,
      observations: sourceSets.observations.size
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
    out: 'tmp/pred-obs-migration-results.json',
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

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          resolve(null)
          return
        }
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => resolve(data))
      })
      .on('error', reject)
  })
}

/**
 * Normalise a "Genus sp." style name to just the genus token.
 * Returns null if the name does not match the pattern.
 */
function extractGenusFromSpEntry(name) {
  // Match patterns like "Bellucia sp.", "Ficus sp", "Pouteria sp.2", "Bignoniaceae sp. (vine)"
  const m = name.match(/^([A-Z][a-z]+)\s+sp\.?(\s|$|\d)/i)
  if (m) return m[1]
  return null
}

async function resolveGbifName(name, cache) {
  if (Object.prototype.hasOwnProperty.call(cache, name) && cache[name] !== null) return cache[name]

  // --- Strategy 1: genus-level lookup for "Genus sp." entries ---
  const genus = extractGenusFromSpEntry(name)
  if (genus) {
    // Check cache for the genus itself first
    if (Object.prototype.hasOwnProperty.call(cache, genus) && cache[genus] !== null) {
      cache[name] = cache[genus]
      return cache[name]
    }
    const matchUrl = `${GBIF_MATCH}?name=${encodeURIComponent(genus)}&verbose=false`
    const matchJson = await fetchJson(matchUrl)
    if (matchJson && matchJson.usageKey) {
      cache[genus] = matchJson.usageKey
      cache[name] = matchJson.usageKey
      return matchJson.usageKey
    }
    // Fallback: search for genus
    const searchUrl = `${GBIF_SEARCH}?q=${encodeURIComponent(genus)}&qField=SCIENTIFIC&dataset_key=d7dddbf4-2cf0-4f39-9b2a-bb099caae36c`
    const searchJson = await fetchJson(searchUrl)
    if (searchJson && Array.isArray(searchJson.results) && searchJson.results.length) {
      const key = searchJson.results[0].key
      cache[genus] = key
      cache[name] = key
      return key
    }
    cache[name] = null
    return null
  }

  // --- Strategy 2: GBIF species/search (existing behaviour) ---
  const searchUrl = `${GBIF_SEARCH}?q=${encodeURIComponent(name)}&qField=SCIENTIFIC&dataset_key=d7dddbf4-2cf0-4f39-9b2a-bb099caae36c`
  const searchJson = await fetchJson(searchUrl)
  if (searchJson && Array.isArray(searchJson.results) && searchJson.results.length) {
    const key = searchJson.results[0].key
    cache[name] = key
    return key
  }

  // --- Strategy 3: GBIF species/match fallback ---
  const matchUrl = `${GBIF_MATCH}?name=${encodeURIComponent(name)}&verbose=false`
  const matchJson = await fetchJson(matchUrl)
  if (matchJson && matchJson.usageKey && matchJson.matchType !== 'NONE') {
    cache[name] = matchJson.usageKey
    return matchJson.usageKey
  }

  cache[name] = null
  return null
}

function extractSpeciesFromPlantsJson(json) {
  if (!json || typeof json !== 'object') return []
  const species = new Set()
  function recurse(obj) {
    if (!obj || typeof obj !== 'object') return
    if (obj.scientificName && typeof obj.scientificName === 'string') {
      species.add(obj.scientificName.trim())
    }
    for (const val of Object.values(obj)) {
      if (Array.isArray(val)) val.forEach(recurse)
      else if (val && typeof val === 'object') recurse(val)
    }
  }
  recurse(json)
  return Array.from(species)
}

function filterLikelySpecies(names) {
  return names
    .map((n) => n && String(n).trim())
    .filter(Boolean)
    .filter((n) => {
      // require at least two tokens (e.g., Genus species) or contain ' sp.'
      if (/\bsp\.?/i.test(n)) return true
      const parts = n.split(/\s+/)
      return parts.length >= 2
    })
}

function extractSpeciesFromCsvByKingdom(text) {
  if (!text) return { flora: [], fauna: [], unknown: [] }
  const records = parse(text, { columns: true, skip_empty_lines: true })
  const flora = new Set()
  const fauna = new Set()
  const unknown = new Set()
  for (const row of records) {
    const kingdom = (row.kingdom || '').toLowerCase()
    const sci = row.scientificName || row.scientificname
    const genus = row.genus
    const epithet =
      row['specific Epithet (species)'] ||
      row['specific epithet'] ||
      row['species'] ||
      row['Species'] ||
      row['specificEpithet']

    let name = null
    if (sci) {
      name = String(sci).trim()
    } else if (genus && epithet) {
      name = `${genus} ${epithet}`.trim()
    }

    if (!name) continue
    const bucket = kingdom.includes('plantae')
      ? flora
      : kingdom.includes('animalia')
        ? fauna
        : unknown
    bucket.add(name)
  }
  return {
    flora: filterLikelySpecies(Array.from(flora)),
    fauna: filterLikelySpecies(Array.from(fauna)),
    unknown: filterLikelySpecies(Array.from(unknown))
  }
}

function dedupe(array) {
  return Array.from(new Set(array.filter(Boolean)))
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
    console.log(`[pred-obs] ${message}${detailStr}`)
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
    out: args.out
  })
  const repos = loadInventory(args.reposFile)
  log('Loaded repository inventory', { total: repos.length })
  const credentials = loadCredentials(args.credentials)
  log('Loaded credentials', { total: credentials.size })
  const cache = loadCache(args.cache)
  // Clear null entries so the new fallback strategies get a chance to resolve them
  const nullKeys = Object.keys(cache).filter((k) => cache[k] === null)
  for (const k of nullKeys) delete cache[k]
  log('Loaded GBIF cache', { entries: Object.keys(cache).length, clearedNulls: nullKeys.length })
  const { index: slugIndex, stats: slugStats } = buildSlugIndex(args.localDir)
  log('Built slug index', {
    totalSlugs: slugStats.total,
    restorSlugs: slugStats.restor,
    predictionSlugs: slugStats.predictions,
    observationSlugs: slugStats.observations
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

  console.log(`Processing predictions/observations for ${targets.length} repo(s) (${args.dryRun ? 'dry-run' : 'live'})`)

  const results = []

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

    const handleSlug = repo.handle.replace('.climateai.org', '')
    const matchedSlug = pickSlug(repo, slugIndex)
    const orgSlug = matchedSlug?.slug || handleSlug
    const slugLog = {
      handle: repo.handle,
      slug: orgSlug,
      reason: matchedSlug?.reason || 'fallback'
    }
    if (matchedSlug?.candidate) slugLog.candidate = matchedSlug.candidate
    if (matchedSlug?.score) slugLog.score = matchedSlug.score
    if (matchedSlug?.prefix) slugLog.prefix = matchedSlug.prefix
    log('Selected local data slug', slugLog)

    // Fetch data
    function tryReadLocal(filePath) {
      const full = path.join(args.localDir, filePath)
      if (fs.existsSync(full)) {
        try {
          return fs.readFileSync(full, 'utf8')
        } catch {
          return null
        }
      }
      return null
    }

    function tryReadLocalJson(filePath) {
      const txt = tryReadLocal(filePath)
      if (!txt) return null
      try {
        return JSON.parse(txt)
      } catch {
        return null
      }
    }

    const treesJson =
      tryReadLocalJson(path.join('restor', `${orgSlug}-trees.json`)) ||
      tryReadLocalJson(path.join('restor', `${orgSlug}-Trees.json`))
    const herbsJson =
      tryReadLocalJson(path.join('restor', `${orgSlug}-herbs.json`)) ||
      tryReadLocalJson(path.join('restor', `${orgSlug}-Herbs.json`))
    const predictionsCsv = tryReadLocal(path.join('predictions', `${orgSlug}.csv`))
    const observationsCsv = tryReadLocal(path.join('observations', `${orgSlug}.csv`))
    log('Fetched data sources', {
      handle: repo.handle,
      treesJson: Boolean(treesJson),
      herbsJson: Boolean(herbsJson),
      predictionsCsv: Boolean(predictionsCsv),
      observationsCsv: Boolean(observationsCsv)
    })

    const floraPredNames = dedupe([
      ...extractSpeciesFromPlantsJson(treesJson),
      ...extractSpeciesFromPlantsJson(herbsJson)
    ])
    const faunaPredNames = dedupe(filterLikelySpecies(extractSpeciesFromCsvByKingdom(predictionsCsv).fauna || []))
    const obsSplit = extractSpeciesFromCsvByKingdom(observationsCsv)
    const floraObsNames = dedupe(obsSplit.flora)
    const faunaObsNames = dedupe(obsSplit.fauna)

    async function resolveNames(names) {
      const resolved = []
      const unresolved = []
      for (const name of names) {
        const key = await resolveGbifName(name, cache)
        if (key) resolved.push(String(key))
        else unresolved.push(name)
      }
      return { resolved: dedupe(resolved), unresolved }
    }

    const floraPred = await resolveNames(floraPredNames)
    const faunaPred = await resolveNames(faunaPredNames)
    const floraObs = await resolveNames(floraObsNames)
    const faunaObs = await resolveNames(faunaObsNames)
    log('Resolved GBIF names', {
      handle: repo.handle,
      floraPredResolved: floraPred.resolved.length,
      floraPredUnresolved: floraPred.unresolved.length,
      faunaPredResolved: faunaPred.resolved.length,
      faunaPredUnresolved: faunaPred.unresolved.length,
      floraObsResolved: floraObs.resolved.length,
      floraObsUnresolved: floraObs.unresolved.length,
      faunaObsResolved: faunaObs.resolved.length,
      faunaObsUnresolved: faunaObs.unresolved.length
    })

    const unresolvedNames = []
    if (floraPred.unresolved.length) unresolvedNames.push(...floraPred.unresolved.map((n) => ({ name: n, type: 'predictions.flora' })))
    if (faunaPred.unresolved.length) unresolvedNames.push(...faunaPred.unresolved.map((n) => ({ name: n, type: 'predictions.fauna' })))
    if (floraObs.unresolved.length) unresolvedNames.push(...floraObs.unresolved.map((n) => ({ name: n, type: 'observations.flora' })))
    if (faunaObs.unresolved.length) unresolvedNames.push(...faunaObs.unresolved.map((n) => ({ name: n, type: 'observations.fauna' })))

    async function upsert(collection, taxonKeys) {
      if (!taxonKeys.length) {
        log('Upsert skipped: no taxon keys', { handle: repo.handle, collection })
        results.push({
          handle: repo.handle,
          did: repo.did,
          collection,
          status: 'skipped',
          reason: 'no-keys'
        })
        return
      }
      const record = {
        $type: collection,
        gbifTaxonKeys: taxonKeys,
        createdAt: nowIso
      }
      const rkey = TID.nextStr()
      if (args.dryRun) {
        log('Dry-run upsert', { handle: repo.handle, collection, rkey, taxonKeys: taxonKeys.length })
        results.push({
          handle: repo.handle,
          did: repo.did,
          collection,
          rkey,
          status: 'dry-run',
          gbifTaxonKeys: taxonKeys
        })
        return
      }
      await agent.com.atproto.repo.createRecord({
        repo: repo.did,
        collection,
        rkey,
        record
      })
      log('Upsert success', { handle: repo.handle, collection, rkey, taxonKeys: taxonKeys.length })
      results.push({
        handle: repo.handle,
        did: repo.did,
        collection,
        rkey,
        status: 'success',
        gbifTaxonKeys: taxonKeys
      })
    }

    await upsert(COLLECTIONS.predictionsFlora, floraPred.resolved)
    await upsert(COLLECTIONS.predictionsFauna, faunaPred.resolved)
    await upsert(COLLECTIONS.observationsFlora, floraObs.resolved)
    await upsert(COLLECTIONS.observationsFauna, faunaObs.resolved)

    if (unresolvedNames.length) {
      log('Unresolved names found', { handle: repo.handle, count: unresolvedNames.length })
      results.push({
        handle: repo.handle,
        did: repo.did,
        status: 'unresolved',
        unresolvedNames
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
      failed: results.filter((r) => r.status === 'failed').length,
      unresolved: results.filter((r) => r.status === 'unresolved').length
    }
  }

  log('Finished processing', { processedRepos: targets.length })

  const output = { summary, results, logs }
  fs.mkdirSync(path.dirname(args.out), { recursive: true })
  fs.writeFileSync(args.out, JSON.stringify(output, null, 2))
  saveCache(args.cache, cache)
  console.log(`Wrote migration results to ${args.out}`)
}

main().catch((err) => {
  console.error('Failed to upsert predictions/observations:', err)
  process.exit(1)
})
