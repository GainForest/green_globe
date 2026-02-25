#!/usr/bin/env node
/*
  Migrate measured tree photos from S3/PDS GeoJSON blobs to dwc.occurrence records.

  For each org with tree GeoJSON data:
    1. List site records and fetch tree GeoJSON (from PDS blob or S3 fallback)
    2. For each tree feature, create a dwc.occurrence record (idempotent via deterministic rkey)
    3. Download, compress (800px wide WebP q80), and upload photos as blobs
    4. Set trunkEvidence / leafEvidence / barkEvidence on the occurrence record
    5. Create dwc.measurement records for DBH and height

  Resumability: progress tracked in scripts/migrations/data/measured-trees-progress.json
  Errors logged to: scripts/migrations/data/measured-trees-errors.json

  Usage:
    node scripts/migrations/migrate-measured-trees-to-dwc-occurrences.js \
      [--service https://climateai.org] \
      [--repos-file tmp/pds-repo-inventory-*.json] \
      [--credentials tmp/pds-credentials.json] \
      [--handle handle.climateai.org] \
      [--limit N] \
      [--dry-run] \
      [--out tmp/measured-trees-migration-results.json]
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
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { TID } = require('@atproto/common-web')

const AWS_BASE = 'https://gainforest-transparency-dashboard.s3.amazonaws.com'
const DWC_OCCURRENCE_COLLECTION = 'app.gainforest.dwc.occurrence'
const DWC_MEASUREMENT_COLLECTION = 'app.gainforest.dwc.measurement'
const SITE_COLLECTION = 'app.gainforest.organization.site'

const PROGRESS_FILE = 'scripts/migrations/data/measured-trees-progress.json'
const ERRORS_FILE = 'scripts/migrations/data/measured-trees-errors.json'

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

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
    out: 'tmp/measured-trees-migration-results.json'
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

// ---------------------------------------------------------------------------
// Inventory / credentials helpers
// ---------------------------------------------------------------------------

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
    .filter((repo) => repo.handle)
}

function loadCredentials(file) {
  if (!fs.existsSync(file)) {
    console.warn(`[measured-trees] WARNING: Credentials file not found: ${file}`)
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
  return {}
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
        console.warn(`[measured-trees]   Download returned null (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`)
        await sleep(delay)
      }
    } catch (err) {
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 500
        console.warn(`[measured-trees]   Download error (attempt ${attempt}/${maxRetries}): ${err?.message || String(err)}, retrying in ${delay}ms...`)
        await sleep(delay)
      } else {
        console.warn(`[measured-trees]   Download failed after ${maxRetries} attempts: ${err?.message || String(err)}`)
      }
    }
  }
  return null
}

/**
 * Download a URL as a Buffer (single attempt).
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
        if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
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
        if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
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
    console.warn('[measured-trees] WARNING: sharp module not available. Images will be uploaded uncompressed.')
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
    console.warn(`[measured-trees]   Image compression failed: ${err?.message || String(err)}, using original`)
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
 * Generate a deterministic rkey for a dwc.measurement record.
 * @param {string} occurrenceRkey
 * @param {string} measurementType
 * @returns {string}
 */
function makeMeasurementRkey(occurrenceRkey, measurementType) {
  const input = `${occurrenceRkey}::${measurementType}`
  const hash = crypto.createHash('sha256').update(input).digest('hex').slice(0, 16)
  return `mm${hash}`
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

/**
 * Extract event date from tree feature properties.
 * @param {object} props
 * @returns {string}
 */
function extractEventDate(props) {
  const raw =
    props.dateMeasured ||
    props.date_measured ||
    props.DateMeasured ||
    props.measurements_in_cm?.date_measured ||
    props.date_planted ||
    props['FCD-tree_records-tree_time'] ||
    null
  if (!raw) return new Date().toISOString().split('T')[0]
  // Try to parse and normalize to ISO 8601
  try {
    const d = new Date(raw)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  } catch {
    // ignore
  }
  return raw
}

/**
 * Extract DBH value from tree feature properties (in cm).
 * @param {object} props
 * @returns {string | null}
 */
function extractDbh(props) {
  const val =
    props.DBH ||
    props.dbh ||
    props.diameter ||
    props.Diameter ||
    props.measurements_in_cm?.diameter ||
    null
  if (val == null) return null
  const n = parseFloat(String(val))
  if (isNaN(n)) return null
  return String(n)
}

/**
 * Extract height value from tree feature properties (in m).
 * @param {object} props
 * @returns {string | null}
 */
function extractHeight(props) {
  const val =
    props.Height ||
    props.height ||
    props.tree_height ||
    props.TreeHeight ||
    props.measurements_in_cm?.height ||
    null
  if (val == null) return null
  const n = parseFloat(String(val))
  if (isNaN(n)) return null
  return String(n)
}

/**
 * Extract photo URLs from a tree feature.
 * Returns { trunkUrl, leafUrl, barkUrl } — each may be null.
 * Handles standard AWS/Kobo fields and Ayyoweca Uganda media_sources format.
 * @param {object} props
 * @returns {{ trunkUrl: string|null, leafUrl: string|null, barkUrl: string|null }}
 */
function extractPhotoUrls(props) {
  // Ayyoweca Uganda: media_sources.images[] format
  if (props.media_sources && Array.isArray(props.media_sources.images)) {
    const images = props.media_sources.images
    const trunk = images.find((i) => i.type === 'trunk' || i.type === 'entire_specimen')
    const leaf = images.find((i) => i.type === 'leaf')
    const bark = images.find((i) => i.type === 'bark')
    return {
      trunkUrl: trunk?.value || null,
      leafUrl: leaf?.value || null,
      barkUrl: bark?.value || null
    }
  }

  // Standard fields: prefer awsUrl over koboUrl
  const trunkUrl = props.awsUrl || props.koboUrl || props['FCD-tree_records-tree_photo'] || null
  const leafUrl = props.leafAwsUrl || props.leafKoboUrl || null
  const barkUrl = props.barkAwsUrl || props.barkKoboUrl || null

  return { trunkUrl, leafUrl, barkUrl }
}

/**
 * Check if a URL is a Google Drive URL (Oceanus Conservation).
 * @param {string|null} url
 * @returns {boolean}
 */
function isGoogleDriveUrl(url) {
  if (!url) return false
  return url.includes('drive.google.com') || url.includes('docs.google.com')
}

// ---------------------------------------------------------------------------
// PDS helpers
// ---------------------------------------------------------------------------

/**
 * List all site records for an org.
 * @param {import('@atproto/api').AtpAgent} agent
 * @param {string} did
 * @returns {Promise<Array<{ uri: string, cid: string, value: object }>>}
 */
async function listSiteRecords(agent, did) {
  const records = []
  let cursor = undefined
  do {
    const res = await agent.com.atproto.repo.listRecords({
      repo: did,
      collection: SITE_COLLECTION,
      limit: 100,
      cursor
    })
    records.push(...(res.data.records || []))
    cursor = res.data.cursor
  } while (cursor)
  return records
}

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
    console.warn(`[measured-trees] Warning: failed to list existing occurrences for ${did}: ${err?.message || String(err)}`)
  }
  return rkeys
}

/**
 * List existing dwc.measurement records for an org (for idempotency check).
 * Returns a Set of rkeys.
 * @param {import('@atproto/api').AtpAgent} agent
 * @param {string} did
 * @returns {Promise<Set<string>>}
 */
async function listExistingMeasurementRkeys(agent, did) {
  const rkeys = new Set()
  let cursor = undefined
  try {
    do {
      const res = await agent.com.atproto.repo.listRecords({
        repo: did,
        collection: DWC_MEASUREMENT_COLLECTION,
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
    console.warn(`[measured-trees] Warning: failed to list existing measurements for ${did}: ${err?.message || String(err)}`)
  }
  return rkeys
}

// ---------------------------------------------------------------------------
// Main processing
// ---------------------------------------------------------------------------

/**
 * Process a single photo URL: download, compress, upload, return blob ref.
 * Returns null on failure.
 * @param {import('@atproto/api').AtpAgent} agent
 * @param {string} url
 * @param {string} label  For logging
 * @param {string} tmpDir  Temp directory for intermediate files
 * @returns {Promise<object | null>}
 */
async function processPhoto(agent, url, label, tmpDir) {
  if (!url) return null

  // Check for Google Drive URLs (Oceanus) — skip
  if (isGoogleDriveUrl(url)) {
    console.log(`[measured-trees]     Skipping Google Drive URL (${label}): ${url}`)
    return { skipped: true, reason: 'google-drive-url', url }
  }

  // Download
  console.log(`[measured-trees]     Downloading ${label}: ${url.slice(0, 80)}...`)
  const downloaded = await fetchBinaryWithRetry(url)
  if (!downloaded) {
    console.warn(`[measured-trees]     Download failed for ${label}: ${url}`)
    return null
  }

  // Write to temp file
  const tmpFile = path.join(tmpDir, `photo-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`)
  fs.writeFileSync(tmpFile, downloaded.buffer)

  try {
    // Compress
    const { buffer: compressed, mimeType } = await compressImage(downloaded.buffer)

    // Upload blob
    const uploadRes = await agent.uploadBlob(compressed, { encoding: mimeType })
    const blobRef = uploadRes.data.blob

    console.log(`[measured-trees]     Uploaded ${label}: ${(compressed.length / 1024).toFixed(1)}KB WebP`)

    return {
      $type: 'app.gainforest.common.defs#image',
      file: blobRef
    }
  } finally {
    // Always delete temp file
    try {
      fs.unlinkSync(tmpFile)
    } catch {
      // ignore
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  console.log('[measured-trees] Starting migration', {
    service: args.service,
    reposFile: args.reposFile,
    handles: args.handles,
    limit: args.limit,
    dryRun: args.dryRun,
    out: args.out
  })

  // Load inventory
  const repos = loadInventory(args.reposFile)
  console.log(`[measured-trees] Loaded ${repos.length} repos from inventory`)

  // Load credentials
  const credentials = loadCredentials(args.credentials)
  console.log(`[measured-trees] Loaded credentials for ${credentials.size} orgs`)

  // Load progress
  const progress = loadProgress()
  console.log(`[measured-trees] Loaded progress for ${Object.keys(progress).length} orgs`)

  // Load errors
  const errors = loadErrors()
  console.log(`[measured-trees] Loaded ${errors.length} existing errors`)

  // Filter repos
  const selected = repos.filter((repo) => {
    if (!repo.handle) return false
    if (!args.handles.length) return true
    return args.handles.includes(repo.handle)
  })
  const targets = args.limit ? selected.slice(0, args.limit) : selected
  console.log(`[measured-trees] Processing ${targets.length} repos`)

  const agent = new AtpAgent({ service: args.service })
  const nowIso = new Date().toISOString()

  // Create a temp directory for image processing
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'measured-trees-'))
  console.log(`[measured-trees] Using temp dir: ${tmpDir}`)

  const results = []

  try {
    for (const repo of targets) {
      const { did, handle } = repo
      console.log(`\n[measured-trees] === Processing ${handle} (${did}) ===`)

      // Get credentials
      const password = credentials.get(handle)
      if (!password) {
        console.log(`[measured-trees] Skipping ${handle}: no credentials`)
        results.push({ handle, did, status: 'skipped', reason: 'no-credentials' })
        continue
      }

      // Login
      if (!args.dryRun) {
        try {
          await agent.login({ identifier: handle, password })
          console.log(`[measured-trees] Logged in as ${handle}`)
        } catch (err) {
          console.error(`[measured-trees] Login failed for ${handle}: ${err?.message || String(err)}`)
          appendError(errors, { handle, did, phase: 'login', error: err?.message || String(err) })
          results.push({ handle, did, status: 'failed', reason: 'login-failed', error: err?.message || String(err) })
          continue
        }
      }

      // Phase 1: List site records
      let siteRecords = []
      if (!args.dryRun) {
        try {
          siteRecords = await listSiteRecords(agent, did)
          console.log(`[measured-trees] Found ${siteRecords.length} site records for ${handle}`)
        } catch (err) {
          console.error(`[measured-trees] Failed to list sites for ${handle}: ${err?.message || String(err)}`)
          appendError(errors, { handle, did, phase: 'list-sites', error: err?.message || String(err) })
          results.push({ handle, did, status: 'failed', reason: 'list-sites-failed', error: err?.message || String(err) })
          continue
        }
      }

      // Phase 1b: Fetch existing occurrence/measurement rkeys for idempotency
      let existingOccurrenceRkeys = new Set()
      let existingMeasurementRkeys = new Set()
      if (!args.dryRun) {
        existingOccurrenceRkeys = await listExistingOccurrenceRkeys(agent, did)
        existingMeasurementRkeys = await listExistingMeasurementRkeys(agent, did)
        console.log(`[measured-trees] Existing occurrences: ${existingOccurrenceRkeys.size}, measurements: ${existingMeasurementRkeys.size}`)
      }

      // Initialize progress for this org
      if (!progress[did]) progress[did] = {}

      let orgOccurrencesCreated = 0
      let orgOccurrencesSkipped = 0
      let orgMeasurementsCreated = 0
      let orgPhotosUploaded = 0
      let orgErrors = 0

      // Process each site
      const sitesToProcess = siteRecords.length > 0 ? siteRecords : [{ uri: null, value: { trees: null } }]

      for (const siteRecord of sitesToProcess) {
        const siteRkey = siteRecord.uri ? siteRecord.uri.split('/').pop() : 'default'
        const siteUri = siteRecord.uri || null

        console.log(`[measured-trees]  Site: ${siteRkey} (${siteRecord.value?.name || 'unnamed'})`)

        // Phase 1c: Fetch tree GeoJSON
        let geojson = null

        // Try PDS blob first
        const treesBlob = siteRecord.value?.trees
        if (treesBlob && !args.dryRun) {
          const blobCid = treesBlob.blob?.ref?.$link || treesBlob.blob?.ref || treesBlob.ref?.$link || treesBlob.ref
          if (blobCid) {
            console.log(`[measured-trees]   Fetching tree GeoJSON from PDS blob: ${blobCid}`)
            try {
              const blobData = await fetchPdsBlob(args.service, did, blobCid)
              if (blobData && blobData.buffer.length > 100) {
                geojson = JSON.parse(blobData.buffer.toString('utf8'))
                console.log(`[measured-trees]   Loaded ${geojson?.features?.length || 0} features from PDS blob`)
              }
            } catch (err) {
              console.warn(`[measured-trees]   PDS blob fetch failed: ${err?.message || String(err)}`)
            }
          }
        }

        // Fall back to S3
        if (!geojson || !Array.isArray(geojson.features) || geojson.features.length === 0) {
          const handleSlug = handle.replace('.climateai.org', '')
          const s3Url = `${AWS_BASE}/shapefiles/${handleSlug}-all-tree-plantings.geojson`
          console.log(`[measured-trees]   Falling back to S3: ${s3Url}`)
          if (!args.dryRun) {
            try {
              geojson = await fetchJson(s3Url)
              if (geojson && Array.isArray(geojson.features)) {
                console.log(`[measured-trees]   Loaded ${geojson.features.length} features from S3`)
              } else {
                console.log(`[measured-trees]   No valid GeoJSON from S3 for ${handle}`)
                geojson = null
              }
            } catch (err) {
              console.warn(`[measured-trees]   S3 fetch failed: ${err?.message || String(err)}`)
              geojson = null
            }
          } else {
            console.log(`[measured-trees]   [DRY RUN] Would fetch from S3: ${s3Url}`)
          }
        }

        if (!geojson || !Array.isArray(geojson.features) || geojson.features.length === 0) {
          if (!args.dryRun) {
            console.log(`[measured-trees]   No tree features found for site ${siteRkey}, skipping`)
            continue
          }
        }

        const features = geojson?.features || []

        // Initialize site progress
        if (!progress[did][siteRkey]) {
          progress[did][siteRkey] = { lastProcessedFeatureIndex: -1, completedFeatures: [] }
        }
        const siteProgress = progress[did][siteRkey]

        // Phase 2: Process each tree feature
        for (let featureIdx = 0; featureIdx < features.length; featureIdx++) {
          // Resume: skip already-completed features
          if (siteProgress.completedFeatures.includes(featureIdx)) {
            orgOccurrencesSkipped++
            continue
          }

          const feature = features[featureIdx]
          if (!feature || feature.type !== 'Feature' || !feature.geometry) continue

          const coords = feature.geometry.coordinates
          if (!Array.isArray(coords) || coords.length < 2) continue

          const [lon, lat] = coords
          const props = feature.properties || {}

          const species = extractSpecies(props)
          const eventDate = extractEventDate(props)
          const dbh = extractDbh(props)
          const height = extractHeight(props)
          const { trunkUrl, leafUrl, barkUrl } = extractPhotoUrls(props)

          // Build deterministic rkey
          const occurrenceRkey = makeOccurrenceRkey(did, lat, lon, species)

          // Build occurrenceID
          const occurrenceId = `${did}::${lat}::${lon}::${species}`

          // Build associatedMedia (original URLs)
          const mediaUrls = [trunkUrl, leafUrl, barkUrl].filter(Boolean)
          const associatedMedia = mediaUrls.length > 0 ? mediaUrls.join('|') : undefined

          // Build dynamicProperties
          const dynamicProps = {
            source: 'field',
            dataType: 'measuredTree',
            originalAwsUrl: trunkUrl || undefined,
            originalKoboUrl: props.koboUrl || undefined
          }

          // Build occurrence record
          const occurrenceRecord = {
            $type: DWC_OCCURRENCE_COLLECTION,
            occurrenceID: occurrenceId,
            basisOfRecord: 'HumanObservation',
            kingdom: 'Plantae',
            scientificName: species,
            eventDate,
            decimalLatitude: String(lat),
            decimalLongitude: String(lon),
            dynamicProperties: JSON.stringify(dynamicProps),
            createdAt: nowIso
          }

          if (siteUri) occurrenceRecord.siteRef = siteUri
          if (associatedMedia) occurrenceRecord.associatedMedia = associatedMedia

          if (args.dryRun) {
            console.log(`[measured-trees]   [DRY RUN] Would create occurrence: ${occurrenceRkey} (${species} @ ${lat},${lon})`)
            orgOccurrencesCreated++
            siteProgress.completedFeatures.push(featureIdx)
            siteProgress.lastProcessedFeatureIndex = featureIdx
            saveProgress(progress)
            continue
          }

          // Check idempotency
          const alreadyExists = existingOccurrenceRkeys.has(occurrenceRkey)

          if (!alreadyExists) {
            // Phase 3: Upload photos (one at a time)
            let trunkEvidence = null
            let leafEvidence = null
            let barkEvidence = null

            // Process trunk photo
            if (trunkUrl) {
              try {
                const result = await processPhoto(agent, trunkUrl, 'trunk', tmpDir)
                if (result && !result.skipped) {
                  trunkEvidence = result
                  orgPhotosUploaded++
                } else if (result && result.skipped && result.reason === 'google-drive-url') {
                  appendError(errors, {
                    handle, did, siteRkey, featureIdx, photoType: 'trunk',
                    reason: 'google-drive-url', url: trunkUrl
                  })
                }
              } catch (err) {
                console.warn(`[measured-trees]   Trunk photo upload failed: ${err?.message || String(err)}`)
                appendError(errors, { handle, did, siteRkey, featureIdx, photoType: 'trunk', error: err?.message || String(err), url: trunkUrl })
                orgErrors++
              }
            }

            // Process leaf photo
            if (leafUrl) {
              try {
                const result = await processPhoto(agent, leafUrl, 'leaf', tmpDir)
                if (result && !result.skipped) {
                  leafEvidence = result
                  orgPhotosUploaded++
                } else if (result && result.skipped && result.reason === 'google-drive-url') {
                  appendError(errors, {
                    handle, did, siteRkey, featureIdx, photoType: 'leaf',
                    reason: 'google-drive-url', url: leafUrl
                  })
                }
              } catch (err) {
                console.warn(`[measured-trees]   Leaf photo upload failed: ${err?.message || String(err)}`)
                appendError(errors, { handle, did, siteRkey, featureIdx, photoType: 'leaf', error: err?.message || String(err), url: leafUrl })
                orgErrors++
              }
            }

            // Process bark photo
            if (barkUrl) {
              try {
                const result = await processPhoto(agent, barkUrl, 'bark', tmpDir)
                if (result && !result.skipped) {
                  barkEvidence = result
                  orgPhotosUploaded++
                } else if (result && result.skipped && result.reason === 'google-drive-url') {
                  appendError(errors, {
                    handle, did, siteRkey, featureIdx, photoType: 'bark',
                    reason: 'google-drive-url', url: barkUrl
                  })
                }
              } catch (err) {
                console.warn(`[measured-trees]   Bark photo upload failed: ${err?.message || String(err)}`)
                appendError(errors, { handle, did, siteRkey, featureIdx, photoType: 'bark', error: err?.message || String(err), url: barkUrl })
                orgErrors++
              }
            }

            // Set evidence on record
            if (trunkEvidence) occurrenceRecord.trunkEvidence = trunkEvidence
            if (leafEvidence) occurrenceRecord.leafEvidence = leafEvidence
            if (barkEvidence) occurrenceRecord.barkEvidence = barkEvidence

            // Create occurrence record (putRecord for idempotency)
            try {
              await agent.com.atproto.repo.putRecord({
                repo: did,
                collection: DWC_OCCURRENCE_COLLECTION,
                rkey: occurrenceRkey,
                record: occurrenceRecord
              })
              existingOccurrenceRkeys.add(occurrenceRkey)
              orgOccurrencesCreated++
              console.log(`[measured-trees]   Created occurrence: ${occurrenceRkey} (${species})`)
            } catch (err) {
              console.error(`[measured-trees]   Failed to create occurrence ${occurrenceRkey}: ${err?.message || String(err)}`)
              appendError(errors, { handle, did, siteRkey, featureIdx, phase: 'create-occurrence', error: err?.message || String(err) })
              orgErrors++
              continue
            }
          } else {
            orgOccurrencesSkipped++
            console.log(`[measured-trees]   Skipping existing occurrence: ${occurrenceRkey}`)
          }

          // Phase 4: Create measurement records
          const occurrenceAtUri = `at://${did}/${DWC_OCCURRENCE_COLLECTION}/${occurrenceRkey}`

          if (dbh !== null) {
            const dbhRkey = makeMeasurementRkey(occurrenceRkey, 'DBH')
            if (!existingMeasurementRkeys.has(dbhRkey)) {
              const dbhRecord = {
                $type: DWC_MEASUREMENT_COLLECTION,
                occurrenceRef: occurrenceAtUri,
                occurrenceID: occurrenceId,
                measurementType: 'DBH',
                measurementValue: dbh,
                measurementUnit: 'cm',
                createdAt: nowIso
              }
              try {
                await agent.com.atproto.repo.putRecord({
                  repo: did,
                  collection: DWC_MEASUREMENT_COLLECTION,
                  rkey: dbhRkey,
                  record: dbhRecord
                })
                existingMeasurementRkeys.add(dbhRkey)
                orgMeasurementsCreated++
              } catch (err) {
                console.warn(`[measured-trees]   Failed to create DBH measurement: ${err?.message || String(err)}`)
                appendError(errors, { handle, did, siteRkey, featureIdx, phase: 'create-measurement-dbh', error: err?.message || String(err) })
                orgErrors++
              }
            }
          }

          if (height !== null) {
            const heightRkey = makeMeasurementRkey(occurrenceRkey, 'height')
            if (!existingMeasurementRkeys.has(heightRkey)) {
              const heightRecord = {
                $type: DWC_MEASUREMENT_COLLECTION,
                occurrenceRef: occurrenceAtUri,
                occurrenceID: occurrenceId,
                measurementType: 'height',
                measurementValue: height,
                measurementUnit: 'm',
                createdAt: nowIso
              }
              try {
                await agent.com.atproto.repo.putRecord({
                  repo: did,
                  collection: DWC_MEASUREMENT_COLLECTION,
                  rkey: heightRkey,
                  record: heightRecord
                })
                existingMeasurementRkeys.add(heightRkey)
                orgMeasurementsCreated++
              } catch (err) {
                console.warn(`[measured-trees]   Failed to create height measurement: ${err?.message || String(err)}`)
                appendError(errors, { handle, did, siteRkey, featureIdx, phase: 'create-measurement-height', error: err?.message || String(err) })
                orgErrors++
              }
            }
          }

          // Update progress
          siteProgress.completedFeatures.push(featureIdx)
          siteProgress.lastProcessedFeatureIndex = featureIdx
          saveProgress(progress)
        } // end feature loop
      } // end site loop

      console.log(`[measured-trees] ${handle}: occurrences created=${orgOccurrencesCreated} skipped=${orgOccurrencesSkipped} measurements=${orgMeasurementsCreated} photos=${orgPhotosUploaded} errors=${orgErrors}`)

      results.push({
        handle,
        did,
        status: orgErrors === 0 ? 'success' : orgOccurrencesCreated > 0 ? 'partial' : 'failed',
        occurrencesCreated: orgOccurrencesCreated,
        occurrencesSkipped: orgOccurrencesSkipped,
        measurementsCreated: orgMeasurementsCreated,
        photosUploaded: orgPhotosUploaded,
        errors: orgErrors
      })

      // Incremental save
      fs.mkdirSync(path.dirname(args.out), { recursive: true })
      fs.writeFileSync(args.out + '.partial', JSON.stringify({ partial: true, results }, null, 2))
    } // end repo loop
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

  // Final output
  const summary = {
    service: args.service,
    dryRun: args.dryRun,
    processedRepos: targets.length,
    totalOccurrencesCreated: results.reduce((s, r) => s + (r.occurrencesCreated || 0), 0),
    totalMeasurementsCreated: results.reduce((s, r) => s + (r.measurementsCreated || 0), 0),
    totalPhotosUploaded: results.reduce((s, r) => s + (r.photosUploaded || 0), 0),
    stats: {
      success: results.filter((r) => r.status === 'success').length,
      partial: results.filter((r) => r.status === 'partial').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      failed: results.filter((r) => r.status === 'failed').length
    }
  }

  console.log('\n[measured-trees] Summary:', summary)

  const output = { summary, results }
  fs.mkdirSync(path.dirname(args.out), { recursive: true })
  fs.writeFileSync(args.out, JSON.stringify(output, null, 2))
  console.log(`[measured-trees] Wrote results to ${args.out}`)
  console.log(`[measured-trees] Progress saved to ${PROGRESS_FILE}`)
  console.log(`[measured-trees] Errors saved to ${ERRORS_FILE}`)
}

main().catch((err) => {
  console.error('[measured-trees] Fatal error:', err)
  process.exit(1)
})
