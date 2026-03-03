#!/usr/bin/env node
/*
  Migrate Oceanus Conservation Google Drive tree photos to app.gainforest.ac.multimedia records.

  These photos were skipped during the initial measured-trees migration because the script
  didn't support Google Drive URLs. The skipped entries are logged in
  scripts/migrations/data/ac-measured-trees-errors.json with reason: 'google-drive-url'.

  For each unique (gdriveFileId, occurrenceRkey) pair:
    1. Convert Google Drive URL to direct download URL
    2. Download image via fetchBinaryWithRetry
    3. Compress to 800px WebP q80 via sharp
    4. uploadBlob to PDS
    5. putRecord for app.gainforest.ac.multimedia (idempotent)

  Resumability: progress tracked in scripts/migrations/data/oceanus-gdrive-progress.json
  Errors logged to: scripts/migrations/data/oceanus-gdrive-errors.json

  Usage:
    node scripts/migrations/migrate-oceanus-gdrive-to-ac-records.js \
      [--service https://climateai.org] \
      [--credentials tmp/pds-credentials.json] \
      [--handle oceanus-conservati.climateai.org] \
      [--limit N] \
      [--dry-run] \
      [--out tmp/oceanus-gdrive-migration-results.json]
*/

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const https = require('https')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const http = require('http')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const os = require('os')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const crypto = require('crypto')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AtpAgent } = require('@atproto/api')

const AWS_BASE = 'https://gainforest-transparency-dashboard.s3.amazonaws.com'
const DWC_OCCURRENCE_COLLECTION = 'app.gainforest.dwc.occurrence'
const AC_MULTIMEDIA_COLLECTION = 'app.gainforest.ac.multimedia'
const SITE_COLLECTION = 'app.gainforest.organization.site'

const OCEANUS_DID = 'did:plc:6oxtzu7gxz7xcldvtwfh3bpt'
const OCEANUS_HANDLE = 'oceanus-conservati.climateai.org'

const SOURCE_ERRORS_FILE = 'scripts/migrations/data/ac-measured-trees-errors.json'
const PROGRESS_FILE = 'scripts/migrations/data/oceanus-gdrive-progress.json'
const ERRORS_FILE = 'scripts/migrations/data/oceanus-gdrive-errors.json'

const COOLDOWN_MS = 1000 // 1s between PDS write operations

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    service: process.env.PDS_SERVICE_URL || 'https://climateai.org',
    credentials: process.env.PDS_CREDENTIALS_FILE || 'tmp/pds-credentials.json',
    handle: OCEANUS_HANDLE,
    limit: undefined,
    dryRun: false,
    out: 'tmp/oceanus-gdrive-migration-results.json'
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--service') args.service = argv[++i]
    else if (a === '--credentials') args.credentials = argv[++i]
    else if (a === '--handle') args.handle = argv[++i]
    else if (a === '--limit') args.limit = parseInt(argv[++i], 10)
    else if (a === '--dry-run') args.dryRun = true
    else if (a === '--out') args.out = argv[++i]
  }
  return args
}

// ---------------------------------------------------------------------------
// Credentials helpers
// ---------------------------------------------------------------------------

function loadCredentials(file) {
  if (!fs.existsSync(file)) {
    console.warn(`[oceanus-gdrive] WARNING: Credentials file not found: ${file}`)
    return new Map()
  }
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
  return new Map(Object.entries(raw))
}

// ---------------------------------------------------------------------------
// Progress / error tracking
// ---------------------------------------------------------------------------

function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'))
    }
  } catch {
    // ignore
  }
  return { completedKeys: [] }
}

function saveProgress(progress) {
  fs.mkdirSync(path.dirname(PROGRESS_FILE), { recursive: true })
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
}

function loadErrors() {
  try {
    if (fs.existsSync(ERRORS_FILE)) {
      return JSON.parse(fs.readFileSync(ERRORS_FILE, 'utf8'))
    }
  } catch {
    // ignore
  }
  return []
}

function appendError(errors, entry) {
  errors.push({ ...entry, timestamp: new Date().toISOString() })
  fs.mkdirSync(path.dirname(ERRORS_FILE), { recursive: true })
  fs.writeFileSync(ERRORS_FILE, JSON.stringify(errors, null, 2))
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Download a URL as a Buffer with retry (up to maxRetries, exponential backoff).
 * Returns null on permanent failure.
 * @param {string} url
 * @param {number} maxRetries
 * @returns {Promise<{ buffer: Buffer, mimeType: string } | null>}
 */
async function fetchBinaryWithRetry(url, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fetchBinary(url)
      if (result) return result
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 500
        console.warn(`[oceanus-gdrive]   Download returned null (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`)
        await sleep(delay)
      }
    } catch (err) {
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 500
        console.warn(`[oceanus-gdrive]   Download error (attempt ${attempt}/${maxRetries}): ${err?.message || String(err)}, retrying in ${delay}ms...`)
        await sleep(delay)
      } else {
        console.warn(`[oceanus-gdrive]   Download failed after ${maxRetries} attempts: ${err?.message || String(err)}`)
      }
    }
  }
  return null
}

/**
 * Download a URL as a Buffer (single attempt).
 * Handles 301, 302, 303, 307, 308 redirects.
 * @param {string} url
 * @returns {Promise<{ buffer: Buffer, mimeType: string } | null>}
 */
function fetchBinary(url) {
  return new Promise((resolve, reject) => {
    const makeRequest = (requestUrl, redirectCount = 0) => {
      if (redirectCount > 5) {
        reject(new Error('Too many redirects'))
        return
      }
      const protocol = requestUrl.startsWith('https') ? https : http
      protocol.get(requestUrl, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 303 || res.statusCode === 307 || res.statusCode === 308) {
          res.resume()
          makeRequest(res.headers.location, redirectCount + 1)
          return
        }
        if (res.statusCode && res.statusCode >= 400) {
          res.resume()
          resolve(null)
          return
        }
        const mimeType = res.headers['content-type'] || 'image/jpeg'
        const chunks = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => resolve({ buffer: Buffer.concat(chunks), mimeType: mimeType.split(';')[0].trim() }))
        res.on('error', reject)
      }).on('error', reject)
    }
    makeRequest(url)
  })
}

/**
 * Fetch JSON from a URL.
 * @param {string} url
 * @returns {Promise<object | null>}
 */
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const makeRequest = (requestUrl, redirectCount = 0) => {
      if (redirectCount > 5) {
        reject(new Error('Too many redirects'))
        return
      }
      const protocol = requestUrl.startsWith('https') ? https : http
      protocol.get(requestUrl, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 303 || res.statusCode === 307 || res.statusCode === 308) {
          res.resume()
          makeRequest(res.headers.location, redirectCount + 1)
          return
        }
        if (res.statusCode && res.statusCode >= 400) {
          res.resume()
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
        res.on('error', reject)
      }).on('error', reject)
    }
    makeRequest(url)
  })
}

// ---------------------------------------------------------------------------
// Image compression
// ---------------------------------------------------------------------------

let sharpModule = null

async function getSharp() {
  if (sharpModule) return sharpModule
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    sharpModule = require('sharp')
    return sharpModule
  } catch {
    console.warn('[oceanus-gdrive] WARNING: sharp module not available. Images will be uploaded uncompressed.')
    return null
  }
}

/**
 * Compress an image buffer to 800px wide WebP at quality 80.
 * Falls back to original buffer if sharp is unavailable.
 * @param {Buffer} buffer
 * @returns {Promise<{ buffer: Buffer, mimeType: string }>}
 */
async function compressImage(buffer) {
  const sharp = await getSharp()
  if (!sharp) {
    return { buffer, mimeType: 'image/jpeg' }
  }
  try {
    const compressed = await sharp(buffer)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()
    return { buffer: compressed, mimeType: 'image/webp' }
  } catch (err) {
    console.warn(`[oceanus-gdrive]   Image compression failed: ${err?.message || String(err)}, using original`)
    return { buffer, mimeType: 'image/jpeg' }
  }
}

// ---------------------------------------------------------------------------
// Deterministic rkey generation
// ---------------------------------------------------------------------------

/**
 * Generate a deterministic rkey for a dwc.occurrence record from org DID + coordinates + species.
 * Uses a hash to ensure idempotency.
 * @param {string} orgDid
 * @param {number} lat
 * @param {number} lon
 * @param {string} species
 * @returns {string}
 */
function makeOccurrenceRkey(orgDid, lat, lon, species) {
  const input = `${orgDid}::${lat}::${lon}::${(species || '').toLowerCase().trim()}`
  const hash = crypto.createHash('sha256').update(input).digest('hex').slice(0, 20)
  // ATProto rkeys must be valid TID-like strings or simple alphanumeric
  // Use a prefix + hash to ensure uniqueness and validity
  return `mt${hash}`
}

/**
 * Generate a deterministic rkey for an app.gainforest.ac.multimedia record.
 * Based on occurrence rkey + subjectPart.
 * @param {string} occurrenceRkey
 * @param {string} subjectPart
 * @returns {string}
 */
function makeAcMultimediaRkey(occurrenceRkey, subjectPart) {
  const input = `${occurrenceRkey}::${subjectPart}`
  const hash = crypto.createHash('sha256').update(input).digest('hex').slice(0, 20)
  return `ac${hash}`
}

// ---------------------------------------------------------------------------
// Tree feature property extraction
// ---------------------------------------------------------------------------

/**
 * Extract species name from tree feature properties.
 * @param {object} props
 * @returns {string}
 */
function extractSpecies(props) {
  return (
    props.species ||
    props.Plant_Name ||
    props.scientificName ||
    props.Scientific_Name ||
    props.scientific_name ||
    props.Species ||
    props.taxonomy?.species ||
    'Unknown'
  )
}

// ---------------------------------------------------------------------------
// Google Drive URL helpers
// ---------------------------------------------------------------------------

/**
 * Extract Google Drive file ID from a URL.
 * Handles: drive.google.com/open?id=XXX, drive.google.com/file/d/XXX/view
 * @param {string} url
 * @returns {string | null}
 */
function extractGdriveFileId(url) {
  if (!url) return null
  // Handle ?id= or &id= format
  const idMatch = url.match(/[?&]id=([^&]+)/)
  if (idMatch) return idMatch[1]
  // Handle /file/d/XXX/view format
  const fileMatch = url.match(/\/file\/d\/([^/]+)/)
  if (fileMatch) return fileMatch[1]
  return null
}

/**
 * Convert a Google Drive share URL to a direct download URL.
 * drive.google.com/open?id=XXX → drive.google.com/uc?export=download&id=XXX
 * @param {string} url
 * @returns {string}
 */
function convertGdriveUrl(url) {
  const fileId = extractGdriveFileId(url)
  if (!fileId) return url
  return `https://drive.google.com/uc?export=download&id=${fileId}`
}

// ---------------------------------------------------------------------------
// PDS helpers
// ---------------------------------------------------------------------------

/**
 * Fetch a blob from PDS by DID and CID.
 * @param {string} service
 * @param {string} did
 * @param {string} cid
 * @returns {Promise<{ buffer: Buffer, mimeType: string } | null>}
 */
async function fetchPdsBlob(service, did, cid) {
  const url = `${service}/xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(did)}&cid=${encodeURIComponent(cid)}`
  return fetchBinaryWithRetry(url)
}

/**
 * List existing dwc.occurrence records for an org (for idempotency check).
 * Returns a Set of rkeys.
 * @param {import('@atproto/api').AtpAgent} agent
 * @param {string} did
 * @returns {Promise<Set<string>>}
 */
async function listExistingOccurrenceRkeys(agent, did) {
  const rkeys = new Set()
  let cursor = undefined
  try {
    do {
      const res = await agent.com.atproto.repo.listRecords({
        repo: did,
        collection: DWC_OCCURRENCE_COLLECTION,
        limit: 100,
        cursor
      })
      for (const rec of res.data.records || []) {
        const rkey = rec.uri.split('/').pop()
        if (rkey) rkeys.add(rkey)
      }
      cursor = res.data.cursor
    } while (cursor)
  } catch (err) {
    console.warn(`[oceanus-gdrive] Warning: failed to list existing occurrences for ${did}: ${err?.message || String(err)}`)
  }
  return rkeys
}

/**
 * List existing app.gainforest.ac.multimedia records for an org (for idempotency check).
 * Returns a Set of rkeys.
 * @param {import('@atproto/api').AtpAgent} agent
 * @param {string} did
 * @returns {Promise<Set<string>>}
 */
async function listExistingAcMultimediaRkeys(agent, did) {
  const rkeys = new Set()
  let cursor = undefined
  try {
    do {
      const res = await agent.com.atproto.repo.listRecords({
        repo: did,
        collection: AC_MULTIMEDIA_COLLECTION,
        limit: 100,
        cursor
      })
      for (const rec of res.data.records || []) {
        const rkey = rec.uri.split('/').pop()
        if (rkey) rkeys.add(rkey)
      }
      cursor = res.data.cursor
    } while (cursor)
  } catch (err) {
    console.warn(`[oceanus-gdrive] Warning: failed to list existing AC multimedia records for ${did}: ${err?.message || String(err)}`)
  }
  return rkeys
}

// ---------------------------------------------------------------------------
// photoType → subjectPart mapping
// ---------------------------------------------------------------------------

/**
 * Map photoType string to AC subjectPart value.
 * @param {string} photoType
 * @returns {string}
 */
function mapPhotoTypeToSubjectPart(photoType) {
  switch (photoType) {
    case 'trunk': return 'entireOrganism'
    case 'leaf': return 'leaf'
    case 'bark': return 'bark'
    default: return 'entireOrganism'
  }
}

// ---------------------------------------------------------------------------
// Main processing
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2))

  console.log('[oceanus-gdrive] Starting migration', {
    service: args.service,
    handle: args.handle,
    limit: args.limit,
    dryRun: args.dryRun,
    out: args.out
  })

  // Load credentials
  const credentials = loadCredentials(args.credentials)
  const password = credentials.get(args.handle)
  if (!password && !args.dryRun) {
    console.error(`[oceanus-gdrive] No credentials found for ${args.handle}`)
    process.exit(1)
  }

  // Load progress
  const progress = loadProgress()
  const completedKeys = new Set(progress.completedKeys || [])
  console.log(`[oceanus-gdrive] Loaded ${completedKeys.size} completed keys from progress`)

  // Load errors
  const errors = loadErrors()
  console.log(`[oceanus-gdrive] Loaded ${errors.length} existing errors`)

  // ---------------------------------------------------------------------------
  // Phase 1: Parse and deduplicate error log
  // ---------------------------------------------------------------------------

  console.log(`[oceanus-gdrive] Reading source error log: ${SOURCE_ERRORS_FILE}`)
  if (!fs.existsSync(SOURCE_ERRORS_FILE)) {
    console.error(`[oceanus-gdrive] Source error log not found: ${SOURCE_ERRORS_FILE}`)
    process.exit(1)
  }

  const sourceErrors = JSON.parse(fs.readFileSync(SOURCE_ERRORS_FILE, 'utf8'))
  console.log(`[oceanus-gdrive] Loaded ${sourceErrors.length} entries from source error log`)

  // Filter for google-drive-url entries from oceanus
  const gdriveEntries = sourceErrors.filter(
    (e) => e.reason === 'google-drive-url' && e.did === OCEANUS_DID
  )
  console.log(`[oceanus-gdrive] Found ${gdriveEntries.length} google-drive-url entries for ${OCEANUS_HANDLE}`)

  // Group by siteRkey for batch GeoJSON fetching
  const entriesBySiteRkey = new Map()
  for (const entry of gdriveEntries) {
    if (!entriesBySiteRkey.has(entry.siteRkey)) {
      entriesBySiteRkey.set(entry.siteRkey, [])
    }
    entriesBySiteRkey.get(entry.siteRkey).push(entry)
  }
  console.log(`[oceanus-gdrive] Found ${entriesBySiteRkey.size} unique site rkeys`)

  // ---------------------------------------------------------------------------
  // Phase 2: Resolve occurrences via GeoJSON
  // ---------------------------------------------------------------------------

  const agent = new AtpAgent({ service: args.service })
  const nowIso = new Date().toISOString()

  // Login
  if (!args.dryRun) {
    try {
      await agent.login({ identifier: args.handle, password })
      console.log(`[oceanus-gdrive] Logged in as ${args.handle}`)
    } catch (err) {
      console.error(`[oceanus-gdrive] Login failed: ${err?.message || String(err)}`)
      process.exit(1)
    }
  }

  // Cache GeoJSON per siteRkey
  const geojsonCache = new Map()

  for (const [siteRkey, _entries] of entriesBySiteRkey) {
    console.log(`[oceanus-gdrive] Fetching GeoJSON for site: ${siteRkey}`)

    let geojson = null

    // Try PDS site record first (read-only, works without auth)
    try {
      const siteRes = await agent.com.atproto.repo.getRecord({
        repo: OCEANUS_DID,
        collection: SITE_COLLECTION,
        rkey: siteRkey
      })
      const siteValue = siteRes.data.value
      const treesBlob = siteValue?.trees
      if (treesBlob) {
        const blobCid = treesBlob.blob?.ref?.$link || treesBlob.blob?.ref || treesBlob.ref?.$link || treesBlob.ref
        if (blobCid) {
          console.log(`[oceanus-gdrive]   Fetching tree GeoJSON from PDS blob: ${blobCid}`)
          try {
            const blobData = await fetchPdsBlob(args.service, OCEANUS_DID, blobCid)
            if (blobData && blobData.buffer.length > 100) {
              geojson = JSON.parse(blobData.buffer.toString('utf8'))
              console.log(`[oceanus-gdrive]   Loaded ${geojson?.features?.length || 0} features from PDS blob`)
            }
          } catch (err) {
            console.warn(`[oceanus-gdrive]   PDS blob fetch failed: ${err?.message || String(err)}`)
          }
        }
      }
    } catch (err) {
      console.warn(`[oceanus-gdrive]   Failed to fetch site record ${siteRkey}: ${err?.message || String(err)}`)
    }

    // Fall back to S3
    if (!geojson || !Array.isArray(geojson.features) || geojson.features.length === 0) {
      const s3Url = `${AWS_BASE}/shapefiles/oceanus-conservati-all-tree-plantings.geojson`
      console.log(`[oceanus-gdrive]   Falling back to S3: ${s3Url}`)
      try {
        geojson = await fetchJson(s3Url)
        if (geojson && Array.isArray(geojson.features)) {
          console.log(`[oceanus-gdrive]   Loaded ${geojson.features.length} features from S3`)
        } else {
          console.warn(`[oceanus-gdrive]   No valid GeoJSON from S3 for site ${siteRkey}`)
          geojson = null
        }
      } catch (err) {
        console.warn(`[oceanus-gdrive]   S3 fetch failed: ${err?.message || String(err)}`)
        geojson = null
      }
    }

    geojsonCache.set(siteRkey, geojson)
  }

  // ---------------------------------------------------------------------------
  // Phase 3: Build deduplicated work list
  // ---------------------------------------------------------------------------

  // Map: dedup key → work item
  const workMap = new Map()
  let totalEntries = 0
  let uniqueFileIds = new Set()
  let skippedOutOfBounds = 0

  for (const [siteRkey, entries] of entriesBySiteRkey) {
    const geojson = geojsonCache.get(siteRkey)
    const features = geojson?.features || []

    for (const entry of entries) {
      totalEntries++

      const gdriveFileId = extractGdriveFileId(entry.url)
      if (!gdriveFileId) {
        console.warn(`[oceanus-gdrive] Could not extract file ID from URL: ${entry.url}`)
        continue
      }

      uniqueFileIds.add(gdriveFileId)

      const featureIdx = entry.featureIdx
      const feature = features[featureIdx]

      if (!feature || !feature.geometry || !Array.isArray(feature.geometry.coordinates) || feature.geometry.coordinates.length < 2) {
        skippedOutOfBounds++
        if (!args.dryRun) {
          appendError(errors, {
            handle: entry.handle,
            did: entry.did,
            siteRkey,
            featureIdx,
            reason: 'feature-out-of-bounds-or-missing-coords',
            url: entry.url
          })
        }
        continue
      }

      const [lon, lat] = feature.geometry.coordinates
      const props = feature.properties || {}
      const species = extractSpecies(props)
      const occurrenceRkey = makeOccurrenceRkey(OCEANUS_DID, lat, lon, species)
      const occurrenceAtUri = `at://${OCEANUS_DID}/${DWC_OCCURRENCE_COLLECTION}/${occurrenceRkey}`
      const subjectPart = mapPhotoTypeToSubjectPart(entry.photoType)

      const dedupKey = `${gdriveFileId}::${occurrenceRkey}`

      if (!workMap.has(dedupKey)) {
        workMap.set(dedupKey, {
          gdriveFileId,
          occurrenceRkey,
          occurrenceAtUri,
          subjectPart,
          originalUrl: entry.url,
          siteRkey,
          featureIdx
        })
      }
    }
  }

  console.log(`[oceanus-gdrive] Dedup stats: ${totalEntries} error entries -> ${uniqueFileIds.size} unique file IDs -> ${workMap.size} work items`)
  if (skippedOutOfBounds > 0) {
    console.warn(`[oceanus-gdrive] Skipped ${skippedOutOfBounds} entries with out-of-bounds or missing coordinates`)
  }

  // ---------------------------------------------------------------------------
  // Phase 4: Pre-check existing records
  // ---------------------------------------------------------------------------

  let existingAcMultimediaRkeys = new Set()
  let existingOccurrenceRkeys = new Set()

  if (!args.dryRun) {
    console.log('[oceanus-gdrive] Listing existing AC multimedia records...')
    existingAcMultimediaRkeys = await listExistingAcMultimediaRkeys(agent, OCEANUS_DID)
    console.log(`[oceanus-gdrive] Found ${existingAcMultimediaRkeys.size} existing AC multimedia records`)

    console.log('[oceanus-gdrive] Listing existing occurrence records...')
    existingOccurrenceRkeys = await listExistingOccurrenceRkeys(agent, OCEANUS_DID)
    console.log(`[oceanus-gdrive] Found ${existingOccurrenceRkeys.size} existing occurrence records`)
  }

  // Build final work list (skip already completed and already existing)
  const workItems = []
  let skippedByProgress = 0
  let skippedByExisting = 0
  let warnedMissingOccurrence = 0

  for (const [dedupKey, item] of workMap) {
    // Skip if already completed in progress
    if (completedKeys.has(dedupKey)) {
      skippedByProgress++
      continue
    }

    const acRkey = makeAcMultimediaRkey(item.occurrenceRkey, item.subjectPart)

    // Skip if AC record already exists on PDS
    if (existingAcMultimediaRkeys.has(acRkey)) {
      skippedByExisting++
      continue
    }

    // Warn if occurrence is missing
    if (!args.dryRun && !existingOccurrenceRkeys.has(item.occurrenceRkey)) {
      console.warn(`[oceanus-gdrive] WARNING: occurrence ${item.occurrenceRkey} not found on PDS for work item ${dedupKey}`)
      warnedMissingOccurrence++
    }

    workItems.push({ ...item, dedupKey, acRkey })
  }

  console.log(`[oceanus-gdrive] Work list: ${workItems.length} items to process (skipped ${skippedByProgress} by progress, ${skippedByExisting} already on PDS)`)
  if (warnedMissingOccurrence > 0) {
    console.warn(`[oceanus-gdrive] WARNING: ${warnedMissingOccurrence} work items have missing occurrence records`)
  }

  // Apply limit
  const itemsToProcess = args.limit ? workItems.slice(0, args.limit) : workItems
  console.log(`[oceanus-gdrive] Processing ${itemsToProcess.length} items${args.limit ? ` (limit: ${args.limit})` : ''}`)

  // ---------------------------------------------------------------------------
  // Phase 5: Download, compress, upload, create
  // ---------------------------------------------------------------------------

  // Create a temp directory for image processing
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oceanus-gdrive-'))
  console.log(`[oceanus-gdrive] Using temp dir: ${tmpDir}`)

  // Blob ref cache: gdriveFileId → blobRef (avoid re-uploading same file)
  const blobRefCache = new Map()

  let created = 0
  let skipped = 0
  let failed = 0

  try {
    for (let i = 0; i < itemsToProcess.length; i++) {
      const item = itemsToProcess[i]
      const { gdriveFileId, occurrenceRkey, occurrenceAtUri, subjectPart, originalUrl, dedupKey, acRkey } = item

      console.log(`[oceanus-gdrive] [${i + 1}/${itemsToProcess.length}] Processing ${dedupKey}`)

      if (args.dryRun) {
        console.log(`[oceanus-gdrive]   [DRY RUN] Would create AC record: ${acRkey} (${subjectPart}) for occurrence ${occurrenceRkey}`)
        skipped++
        continue
      }

      // Convert Google Drive URL to direct download URL
      const downloadUrl = convertGdriveUrl(originalUrl)
      console.log(`[oceanus-gdrive]   Downloading: ${downloadUrl.slice(0, 80)}...`)

      const tmpFile = path.join(tmpDir, `photo-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`)

      try {
        let blobRef = blobRefCache.get(gdriveFileId)

        if (!blobRef) {
          // Download image
          const downloaded = await fetchBinaryWithRetry(downloadUrl)
          if (!downloaded) {
            console.warn(`[oceanus-gdrive]   Download failed for ${gdriveFileId}`)
            appendError(errors, {
              handle: args.handle,
              did: OCEANUS_DID,
              siteRkey: item.siteRkey,
              featureIdx: item.featureIdx,
              gdriveFileId,
              dedupKey,
              reason: 'download-failed',
              url: originalUrl
            })
            failed++
            continue
          }

          // Write to temp file
          fs.writeFileSync(tmpFile, downloaded.buffer)

          // Compress to 800px WebP q80
          const { buffer: compressed } = await compressImage(downloaded.buffer)

          // Upload blob to PDS
          const uploadRes = await agent.uploadBlob(compressed, { encoding: 'image/webp' })
          blobRef = uploadRes.data.blob
          blobRefCache.set(gdriveFileId, blobRef)

          console.log(`[oceanus-gdrive]   Uploaded blob: ${(compressed.length / 1024).toFixed(1)}KB WebP`)
        } else {
          console.log(`[oceanus-gdrive]   Reusing cached blob ref for ${gdriveFileId}`)
        }

        // Create AC multimedia record (putRecord for idempotency)
        const acRecord = {
          $type: AC_MULTIMEDIA_COLLECTION,
          occurrenceRef: occurrenceAtUri,
          subjectPart,
          file: blobRef,
          format: 'image/webp',
          accessUri: originalUrl,
          variantLiteral: 'Medium Quality',
          createdAt: nowIso
        }

        await agent.com.atproto.repo.putRecord({
          repo: OCEANUS_DID,
          collection: AC_MULTIMEDIA_COLLECTION,
          rkey: acRkey,
          record: acRecord
        })

        console.log(`[oceanus-gdrive]   Created AC multimedia record: ${acRkey} (${subjectPart})`)
        created++

        // Save progress after each success (only if not dry-run)
        if (!args.dryRun) {
          completedKeys.add(dedupKey)
          saveProgress({ completedKeys: Array.from(completedKeys) })
        }

        // Cooldown between PDS writes
        await sleep(COOLDOWN_MS)
      } catch (err) {
        console.warn(`[oceanus-gdrive]   Failed to process ${dedupKey}: ${err?.message || String(err)}`)
        appendError(errors, {
          handle: args.handle,
          did: OCEANUS_DID,
          siteRkey: item.siteRkey,
          featureIdx: item.featureIdx,
          gdriveFileId,
          dedupKey,
          acRkey,
          reason: 'processing-error',
          error: err?.message || String(err),
          url: originalUrl
        })
        failed++
      } finally {
        // Always delete temp file
        try {
          if (fs.existsSync(tmpFile)) {
            fs.unlinkSync(tmpFile)
          }
        } catch {
          // ignore
        }
      }
    }
  } finally {
    // Clean up temp directory
    try {
      const tmpFiles = fs.readdirSync(tmpDir)
      for (const f of tmpFiles) {
        try { fs.unlinkSync(path.join(tmpDir, f)) } catch { /* ignore */ }
      }
      fs.rmdirSync(tmpDir)
    } catch {
      // ignore
    }
  }

  // ---------------------------------------------------------------------------
  // Final output
  // ---------------------------------------------------------------------------

  const summary = {
    service: args.service,
    handle: args.handle,
    dryRun: args.dryRun,
    totalErrorEntries: totalEntries,
    uniqueFileIds: uniqueFileIds.size,
    workItems: workMap.size,
    processed: itemsToProcess.length,
    created,
    skipped,
    failed,
    skippedByProgress,
    skippedByExisting
  }

  console.log('\n[oceanus-gdrive] Summary:', summary)

  const output = { summary }
  fs.mkdirSync(path.dirname(args.out), { recursive: true })
  fs.writeFileSync(args.out, JSON.stringify(output, null, 2))
  console.log(`[oceanus-gdrive] Wrote results to ${args.out}`)
  console.log(`[oceanus-gdrive] Progress saved to ${PROGRESS_FILE}`)
  console.log(`[oceanus-gdrive] Errors saved to ${ERRORS_FILE}`)
}

main().catch((err) => {
  console.error('[oceanus-gdrive] Fatal error:', err)
  process.exit(1)
})
