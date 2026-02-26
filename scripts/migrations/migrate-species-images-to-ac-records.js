#!/usr/bin/env node
/*
  Migrate species occurrence images to app.gainforest.ac.multimedia records.

  For each organization DID:
    1. List all app.gainforest.dwc.occurrence records
    2. Filter to MachineObservation records with speciesImageUrl or thumbnailUrl
    3. For each qualifying occurrence:
       a. Check if an AC record already exists (deterministic rkey)
       b. Download the image from speciesImageUrl (or thumbnailUrl fallback)
       c. Compress to 800px wide WebP quality 80 via sharp
       d. uploadBlob to PDS
       e. createRecord for app.gainforest.ac.multimedia (atomic pattern)

  This script does NOT modify dwc.occurrence records.
  Each image = one uploadBlob + one createRecord (naturally atomic).

  Idempotency:
    Deterministic rkeys: ac${sha256(occurrenceUri + '::entireOrganism').slice(0, 20)}
    where occurrenceUri is the full AT-URI of the occurrence record.

  Progress file: scripts/migrations/data/ac-species-images-progress.json
  Error log:     scripts/migrations/data/ac-species-images-errors.json

  Usage:
    node scripts/migrations/migrate-species-images-to-ac-records.js \
      [--service https://climateai.org] \
      [--repos-file tmp/pds-repo-inventory-*.json] \
      [--credentials tmp/pds-credentials.json] \
      [--handle handle.climateai.org] \
      [--limit N] \
      [--dry-run] \
      [--out tmp/ac-species-images-migration-results.json]
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
const crypto = require('crypto')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AtpAgent } = require('@atproto/api')

const DWC_OCCURRENCE_COLLECTION = 'app.gainforest.dwc.occurrence'
const AC_MULTIMEDIA_COLLECTION = 'app.gainforest.ac.multimedia'
const SUBJECT_PART = 'entireOrganism'

const PROGRESS_FILE = 'scripts/migrations/data/ac-species-images-progress.json'
const ERRORS_FILE = 'scripts/migrations/data/ac-species-images-errors.json'

const COOLDOWN_MS = 1000 // 1s between PDS requests
const DOWNLOAD_RETRY_ATTEMPTS = 3
const DOWNLOAD_RETRY_BASE_MS = 1000 // exponential backoff base

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Compute a deterministic rkey for an AC multimedia record.
 * Format: ac${sha256(occurrenceUri + '::entireOrganism').slice(0, 20)}
 * @param {string} occurrenceUri  Full AT-URI of the dwc.occurrence record
 * @returns {string}
 */
function computeAcRkey(occurrenceUri) {
  const hash = crypto.createHash('sha256').update(occurrenceUri + '::' + SUBJECT_PART).digest('hex')
  return 'ac' + hash.slice(0, 20)
}

/**
 * Download a URL as a Buffer with retry + exponential backoff.
 * Returns null on HTTP 4xx/5xx or network error after all retries.
 * @param {string} url
 * @param {number} attempt
 * @returns {Promise<{ buffer: Buffer, mimeType: string } | null>}
 */
async function fetchBinaryWithRetry(url, attempt = 1) {
  const result = await fetchBinary(url)
  if (result !== null) return result

  if (attempt >= DOWNLOAD_RETRY_ATTEMPTS) {
    return null
  }

  const delay = DOWNLOAD_RETRY_BASE_MS * Math.pow(2, attempt - 1)
  await sleep(delay)
  return fetchBinaryWithRetry(url, attempt + 1)
}

/**
 * Download a URL as a Buffer. Returns null on HTTP 4xx/5xx or network error.
 * @param {string} url
 * @returns {Promise<{ buffer: Buffer, mimeType: string } | null>}
 */
function fetchBinary(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http
    protocol
      .get(url, (res) => {
        // Follow redirects (up to 5)
        if (res.statusCode && (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308)) {
          const location = res.headers['location']
          res.resume()
          if (location) {
            fetchBinary(location).then(resolve)
          } else {
            resolve(null)
          }
          return
        }
        if (res.statusCode && res.statusCode >= 400) {
          res.resume()
          resolve(null)
          return
        }
        const mimeType = (res.headers['content-type'] || 'image/jpeg').split(';')[0].trim()
        const chunks = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => resolve({ buffer: Buffer.concat(chunks), mimeType }))
        res.on('error', () => resolve(null))
      })
      .on('error', () => resolve(null))
  })
}

/**
 * Lazy-load sharp to avoid hard dependency at module load time.
 * @returns {object}
 */
function getSharp() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('sharp')
}

/**
 * Compress an image buffer to 800px wide WebP at quality 80.
 * @param {Buffer} inputBuffer
 * @returns {Promise<Buffer>}
 */
async function compressImage(inputBuffer) {
  return getSharp()(inputBuffer)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer()
}

// ---------------------------------------------------------------------------
// Progress / error tracking
// ---------------------------------------------------------------------------

/**
 * @returns {{ [orgDid: string]: { lastCursor: string | null, completedRkeys: string[] } }}
 */
function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'))
    }
  } catch {
    // ignore parse errors — start fresh
  }
  return {}
}

/**
 * @param {{ [orgDid: string]: { lastCursor: string | null, completedRkeys: string[] } }} progress
 */
function saveProgress(progress) {
  fs.mkdirSync(path.dirname(PROGRESS_FILE), { recursive: true })
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
}

/**
 * @returns {Array<object>}
 */
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

/**
 * @param {Array<object>} errors
 * @param {object} errorEntry
 */
function appendError(errors, errorEntry) {
  errors.push({ ...errorEntry, timestamp: new Date().toISOString() })
  fs.mkdirSync(path.dirname(ERRORS_FILE), { recursive: true })
  fs.writeFileSync(ERRORS_FILE, JSON.stringify(errors, null, 2))
}

// ---------------------------------------------------------------------------
// Inventory / credentials helpers
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
    console.warn(`[ac-species-images] WARNING: Credentials file not found: ${file}. Live writes will be skipped.`)
    return new Map()
  }
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
  return new Map(Object.entries(raw))
}

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    service: process.env.PDS_SERVICE_URL || 'https://climateai.org',
    reposFile: process.env.PDS_REPO_INVENTORY_FILE || findLatestRepoInventory(),
    credentials: process.env.PDS_CREDENTIALS_FILE || 'tmp/pds-credentials.json',
    handles: [],
    limit: undefined,
    dryRun: false,
    out: 'tmp/ac-species-images-migration-results.json'
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
// Core: check if AC record already exists for an occurrence
// ---------------------------------------------------------------------------

/**
 * Check if an AC multimedia record already exists for the given occurrence URI.
 * Uses the deterministic rkey to check via getRecord.
 *
 * @param {import('@atproto/api').AtpAgent} agent
 * @param {string} did  The org DID (repo owner)
 * @param {string} acRkey  The deterministic rkey
 * @returns {Promise<boolean>}
 */
async function acRecordExists(agent, did, acRkey) {
  try {
    await agent.com.atproto.repo.getRecord({
      repo: did,
      collection: AC_MULTIMEDIA_COLLECTION,
      rkey: acRkey
    })
    return true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Core: process a single occurrence record
// ---------------------------------------------------------------------------

/**
 * Download, compress, upload blob, and create AC multimedia record for one occurrence.
 *
 * @param {import('@atproto/api').AtpAgent} agent
 * @param {string} did  The org DID (repo owner)
 * @param {string} occurrenceUri  Full AT-URI of the occurrence record
 * @param {object} value  The current occurrence record value
 * @param {boolean} dryRun
 * @param {Array<object>} errors  Mutable errors array
 * @returns {Promise<'created' | 'skipped' | 'error'>}
 */
async function processOccurrenceRecord(agent, did, occurrenceUri, value, dryRun, errors) {
  // Must be MachineObservation
  if (value.basisOfRecord !== 'MachineObservation') {
    return 'skipped'
  }

  // Must have a non-empty image URL
  const imageUrl = (value.speciesImageUrl && typeof value.speciesImageUrl === 'string' && value.speciesImageUrl.trim())
    ? value.speciesImageUrl.trim()
    : (value.thumbnailUrl && typeof value.thumbnailUrl === 'string' && value.thumbnailUrl.trim())
      ? value.thumbnailUrl.trim()
      : null

  if (!imageUrl) {
    return 'skipped'
  }

  // Compute deterministic rkey
  const acRkey = computeAcRkey(occurrenceUri)

  if (dryRun) {
    console.log(`[ac-species-images]   [dry-run] Would create AC record rkey=${acRkey} for occurrence=${occurrenceUri} url=${imageUrl}`)
    return 'created'
  }

  // Check if AC record already exists (idempotency)
  const exists = await acRecordExists(agent, did, acRkey)
  if (exists) {
    console.log(`[ac-species-images]   AC record already exists rkey=${acRkey}, skipping`)
    return 'skipped'
  }

  // Download image
  let downloadResult
  try {
    downloadResult = await fetchBinaryWithRetry(imageUrl)
  } catch (err) {
    const errMsg = err?.message || String(err)
    console.warn(`[ac-species-images]   Download exception for occurrence=${occurrenceUri} url=${imageUrl}: ${errMsg}`)
    appendError(errors, { did, occurrenceUri, acRkey, imageUrl, stage: 'download', error: errMsg })
    return 'error'
  }

  if (!downloadResult) {
    console.warn(`[ac-species-images]   Dead URL (404/network) for occurrence=${occurrenceUri}: ${imageUrl}`)
    appendError(errors, { did, occurrenceUri, acRkey, imageUrl, stage: 'download', error: 'dead-url' })
    return 'error'
  }

  // Compress to 800px wide WebP quality 80
  let compressedBuffer
  try {
    compressedBuffer = await compressImage(downloadResult.buffer)
  } catch (err) {
    const errMsg = err?.message || String(err)
    console.warn(`[ac-species-images]   Compression failed for occurrence=${occurrenceUri}: ${errMsg}`)
    appendError(errors, { did, occurrenceUri, acRkey, imageUrl, stage: 'compress', error: errMsg })
    return 'error'
  }

  // Upload blob to PDS
  let blobRef
  try {
    const uploadRes = await agent.uploadBlob(compressedBuffer, { encoding: 'image/webp' })
    blobRef = uploadRes.data.blob
  } catch (err) {
    const errMsg = err?.message || String(err)
    console.warn(`[ac-species-images]   Blob upload failed for occurrence=${occurrenceUri}: ${errMsg}`)
    appendError(errors, { did, occurrenceUri, acRkey, imageUrl, stage: 'upload', error: errMsg })
    return 'error'
  }

  // Immediately createRecord for app.gainforest.ac.multimedia (atomic pattern)
  const acRecord = {
    $type: AC_MULTIMEDIA_COLLECTION,
    occurrenceRef: occurrenceUri,
    subjectPart: SUBJECT_PART,
    file: blobRef,
    format: 'image/webp',
    accessUri: imageUrl,
    variantLiteral: 'Medium Quality',
    createdAt: new Date().toISOString()
  }

  try {
    await agent.com.atproto.repo.createRecord({
      repo: did,
      collection: AC_MULTIMEDIA_COLLECTION,
      rkey: acRkey,
      record: acRecord
    })
  } catch (err) {
    const errMsg = err?.message || String(err)
    console.warn(`[ac-species-images]   createRecord failed for occurrence=${occurrenceUri} rkey=${acRkey}: ${errMsg}`)
    appendError(errors, { did, occurrenceUri, acRkey, imageUrl, stage: 'createRecord', error: errMsg })
    return 'error'
  }

  console.log(`[ac-species-images]   Created AC record rkey=${acRkey} for occurrence=${occurrenceUri}`)
  return 'created'
}

// ---------------------------------------------------------------------------
// Core: process all occurrences for one org
// ---------------------------------------------------------------------------

/**
 * @param {import('@atproto/api').AtpAgent} agent
 * @param {string} did
 * @param {string} handle  For logging
 * @param {boolean} dryRun
 * @param {{ lastCursor: string | null, completedRkeys: string[] }} orgProgress
 * @param {Array<object>} errors
 * @returns {Promise<{ created: number, skipped: number, errors: number, newCursor: string | null }>}
 */
async function processOrgOccurrences(agent, did, handle, dryRun, orgProgress, errors) {
  const completedSet = new Set(orgProgress.completedRkeys || [])
  let cursor = orgProgress.lastCursor || undefined
  let created = 0
  let skipped = 0
  let errorCount = 0
  let newCursor = null

  console.log(`[ac-species-images] Processing ${handle} (did=${did}), resuming from cursor=${cursor || 'start'}, completed=${completedSet.size}`)

  do {
    let records
    try {
      const res = await agent.com.atproto.repo.listRecords({
        repo: did,
        collection: DWC_OCCURRENCE_COLLECTION,
        limit: 100,
        cursor
      })
      records = res.data.records || []
      newCursor = res.data.cursor || null
      cursor = newCursor || undefined
    } catch (err) {
      console.error(`[ac-species-images] Failed to list records for ${handle}: ${err?.message || String(err)}`)
      break
    }

    for (const rec of records) {
      const occurrenceUri = rec.uri
      const rkey = occurrenceUri.split('/').pop()
      const value = rec.value

      // Skip already-completed occurrence rkeys (resumability)
      if (completedSet.has(rkey)) {
        skipped++
        continue
      }

      const result = await processOccurrenceRecord(agent, did, occurrenceUri, value, dryRun, errors)

      if (result === 'created') {
        created++
        completedSet.add(rkey)
        // Save progress after each successful creation
        orgProgress.completedRkeys = Array.from(completedSet)
        orgProgress.lastCursor = cursor || null
      } else if (result === 'skipped') {
        skipped++
        // Mark as completed so we don't re-examine on resume
        completedSet.add(rkey)
        orgProgress.completedRkeys = Array.from(completedSet)
      } else {
        // error — don't add to completedSet so it can be retried
        errorCount++
      }

      if (!dryRun) {
        await sleep(COOLDOWN_MS)
      }
    }

    // Update cursor in progress after each page
    orgProgress.lastCursor = cursor || null

    if (cursor && !dryRun) {
      await sleep(COOLDOWN_MS)
    }
  } while (cursor)

  return { created, skipped, errors: errorCount, newCursor }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2))

  console.log('[ac-species-images] Parsed arguments', {
    service: args.service,
    reposFile: args.reposFile,
    handles: args.handles.length,
    limit: args.limit,
    dryRun: args.dryRun,
    out: args.out
  })

  // Load inventory
  const repos = loadInventory(args.reposFile)
  console.log(`[ac-species-images] Loaded ${repos.length} PDS repos from inventory`)

  // Load credentials
  const credentials = loadCredentials(args.credentials)
  console.log(`[ac-species-images] Loaded credentials for ${credentials.size} orgs`)

  // Load progress and errors (for resumability)
  const progress = loadProgress()
  const errors = loadErrors()
  console.log(`[ac-species-images] Loaded progress for ${Object.keys(progress).length} orgs, ${errors.length} prior errors`)

  // Filter repos
  const selected = repos.filter((repo) => {
    if (!repo.handle) return false
    if (!args.handles.length) return true
    return args.handles.includes(repo.handle)
  })
  const targets = args.limit ? selected.slice(0, args.limit) : selected
  console.log(`[ac-species-images] Selected ${targets.length} target(s) (${args.dryRun ? 'dry-run' : 'live'})`)

  const agent = new AtpAgent({ service: args.service })
  const results = []

  for (const repo of targets) {
    const { handle, did } = repo

    const password = credentials.get(handle)
    if (!password) {
      console.log(`[ac-species-images] Skipping ${handle}: no credentials`)
      results.push({ handle, did, status: 'skipped', reason: 'no-credentials' })
      continue
    }

    // Login
    try {
      await agent.login({ identifier: handle, password })
      console.log(`[ac-species-images] Logged in as ${handle}`)
    } catch (err) {
      console.error(`[ac-species-images] Login failed for ${handle}: ${err?.message || String(err)}`)
      results.push({ handle, did, status: 'failed', reason: 'login-failed', error: err?.message || String(err) })
      continue
    }

    // Initialize progress entry for this org if not present
    if (!progress[did]) {
      progress[did] = { lastCursor: null, completedRkeys: [] }
    }
    const orgProgress = progress[did]

    let orgResult
    try {
      orgResult = await processOrgOccurrences(agent, did, handle, args.dryRun, orgProgress, errors)
    } catch (err) {
      console.error(`[ac-species-images] Unexpected error for ${handle}: ${err?.message || String(err)}`)
      results.push({ handle, did, status: 'failed', reason: 'unexpected-error', error: err?.message || String(err) })
      // Save progress and errors before continuing
      saveProgress(progress)
      fs.mkdirSync(path.dirname(ERRORS_FILE), { recursive: true })
      fs.writeFileSync(ERRORS_FILE, JSON.stringify(errors, null, 2))
      continue
    }

    console.log(`[ac-species-images] ${handle}: created=${orgResult.created} skipped=${orgResult.skipped} errors=${orgResult.errors}`)

    results.push({
      handle,
      did,
      status: orgResult.errors === 0 ? 'success' : orgResult.created > 0 ? 'partial' : 'failed',
      created: orgResult.created,
      skipped: orgResult.skipped,
      errors: orgResult.errors
    })

    // Persist progress and errors after each org
    saveProgress(progress)
    fs.mkdirSync(path.dirname(ERRORS_FILE), { recursive: true })
    fs.writeFileSync(ERRORS_FILE, JSON.stringify(errors, null, 2))
  }

  // Final summary
  const summary = {
    service: args.service,
    dryRun: args.dryRun,
    processedRepos: targets.length,
    stats: {
      success: results.filter((r) => r.status === 'success').length,
      partial: results.filter((r) => r.status === 'partial').length,
      failed: results.filter((r) => r.status === 'failed').length,
      skipped: results.filter((r) => r.status === 'skipped').length
    },
    totalCreated: results.reduce((sum, r) => sum + (r.created || 0), 0),
    totalErrors: errors.length
  }

  console.log('[ac-species-images] Summary:', summary)

  const output = { summary, results }
  fs.mkdirSync(path.dirname(args.out), { recursive: true })
  fs.writeFileSync(args.out, JSON.stringify(output, null, 2))
  console.log(`[ac-species-images] Wrote results to ${args.out}`)
  console.log(`[ac-species-images] Progress saved to ${PROGRESS_FILE}`)
  console.log(`[ac-species-images] Errors saved to ${ERRORS_FILE}`)
}

main().catch((err) => {
  console.error('[ac-species-images] Fatal error:', err)
  process.exit(1)
})
