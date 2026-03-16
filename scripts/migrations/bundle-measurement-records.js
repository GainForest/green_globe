#!/usr/bin/env node
/*
  Backfill migration: bundle old per-measurement dwc.measurement records into the new
  bundled format where all measurements for an occurrence are stored in a single record
  with a typed floraMeasurement result.

  Old format (one record per measurement):
    { occurrenceRef, measurementType, measurementValue, measurementUnit, createdAt }

  New format (one record per occurrence, all measurements bundled):
    { occurrenceRef, result: { $type: 'app.gainforest.dwc.measurement#floraMeasurement', dbh, totalHeight, ... }, createdAt }

  For each org on the PDS:
    1. Fetch all records from app.gainforest.dwc.measurement collection
    2. Separate into old-format (has measurementType at top level) and new-format (has result)
    3. Skip orgs that have zero old-format records
    4. Group old-format records by occurrenceRef URI
    5. For each group: build a new bundled record and write it via putRecord
    6. Delete the old individual records via deleteRecord
    7. Log progress

  Resumability: progress tracked in scripts/migrations/data/bundle-measurements-progress.json
  Errors logged to: scripts/migrations/data/bundle-measurements-errors.json

  Usage:
    node scripts/migrations/bundle-measurement-records.js \
      [--service https://climateai.org] \
      [--credentials <path>] \
      [--handle <handle>] \
      [--dry-run] \
      [--limit N]
*/

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AtpAgent } = require('@atproto/api')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { TID } = require('@atproto/common-web')

const DWC_MEASUREMENT_COLLECTION = 'app.gainforest.dwc.measurement'

const PROGRESS_FILE = 'scripts/migrations/data/bundle-measurements-progress.json'
const ERRORS_FILE = 'scripts/migrations/data/bundle-measurements-errors.json'

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    service: process.env.PDS_SERVICE_URL || 'https://climateai.org',
    credentials: process.env.PDS_CREDENTIALS_FILE || 'tmp/pds-credentials.json',
    handles: [],
    limit: undefined,
    dryRun: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--service') args.service = argv[++i]
    else if (a === '--credentials') args.credentials = argv[++i]
    else if (a === '--handle') args.handles.push(argv[++i])
    else if (a === '--limit') args.limit = parseInt(argv[++i], 10)
    else if (a === '--dry-run') args.dryRun = true
  }
  return args
}

// ---------------------------------------------------------------------------
// Credentials helpers
// ---------------------------------------------------------------------------

function loadCredentials(file) {
  if (!fs.existsSync(file)) {
    console.warn(`[bundle-measurements] WARNING: Credentials file not found: ${file}`)
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
// PDS helpers
// ---------------------------------------------------------------------------

/**
 * List all dwc.measurement records for an org.
 * Returns array of { uri, cid, value } objects.
 * @param {import('@atproto/api').AtpAgent} agent
 * @param {string} did
 * @returns {Promise<Array<{ uri: string, cid: string, value: object }>>}
 */
async function listMeasurementRecords(agent, did) {
  const records = []
  let cursor = undefined
  do {
    const res = await agent.com.atproto.repo.listRecords({
      repo: did,
      collection: DWC_MEASUREMENT_COLLECTION,
      limit: 100,
      cursor,
    })
    records.push(...(res.data.records || []))
    cursor = res.data.cursor
  } while (cursor)
  return records
}

// ---------------------------------------------------------------------------
// measurementType → floraMeasurement field mapping
// ---------------------------------------------------------------------------

/**
 * Map an old-format measurementType string to a floraMeasurement field name.
 * Returns null if the type is unknown (should go into additionalMeasurements).
 * @param {string} measurementType
 * @returns {string | null}
 */
function mapMeasurementTypeToField(measurementType) {
  if (!measurementType) return null
  const t = measurementType.trim().toLowerCase()
  if (t === 'dbh') return 'dbh'
  if (t === 'tree height' || t === 'height') return 'totalHeight'
  if (t === 'diameter') return 'diameter'
  if (t === 'canopy cover') return 'canopyCoverPercent'
  return null
}

// ---------------------------------------------------------------------------
// Bundle building
// ---------------------------------------------------------------------------

/**
 * Build a new bundled measurement record from a group of old-format records
 * that all share the same occurrenceRef.
 *
 * @param {string} occurrenceRef  The AT-URI of the occurrence
 * @param {Array<{ uri: string, value: object }>} oldRecords  Old-format records in the group
 * @returns {{ record: object, rkey: string }}
 */
function buildBundledRecord(occurrenceRef, oldRecords) {
  /** @type {Record<string, string>} */
  const knownFields = {}
  /** @type {Array<{ measurementType: string, measurementValue: string, measurementUnit?: string }>} */
  const additionalMeasurements = []

  for (const { value } of oldRecords) {
    const measurementType = value.measurementType || ''
    const measurementValue = value.measurementValue != null ? String(value.measurementValue) : ''
    const measurementUnit = value.measurementUnit || undefined

    const fieldName = mapMeasurementTypeToField(measurementType)
    if (fieldName) {
      // Known field — map directly onto floraMeasurement
      // Only set if not already set (first occurrence wins)
      if (!(fieldName in knownFields)) {
        knownFields[fieldName] = measurementValue
      }
    } else {
      // Unknown type — goes into additionalMeasurements
      const entry = { measurementType, measurementValue }
      if (measurementUnit) entry.measurementUnit = measurementUnit
      additionalMeasurements.push(entry)
    }
  }

  // Build the floraMeasurement result object
  const floraMeasurement = {
    $type: 'app.gainforest.dwc.measurement#floraMeasurement',
    ...knownFields,
  }
  if (additionalMeasurements.length > 0) {
    floraMeasurement.additionalMeasurements = additionalMeasurements
  }

  // Carry over occurrenceID from the first old record that has it
  const firstWithOccurrenceId = oldRecords.find((r) => r.value.occurrenceID)
  const occurrenceID = firstWithOccurrenceId ? firstWithOccurrenceId.value.occurrenceID : undefined

  const record = {
    $type: DWC_MEASUREMENT_COLLECTION,
    occurrenceRef,
    result: floraMeasurement,
    createdAt: new Date().toISOString(),
  }
  if (occurrenceID) record.occurrenceID = occurrenceID

  // Generate a fresh TID rkey
  const rkey = TID.nextStr()

  return { record, rkey }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2))

  console.log('[bundle-measurements] Starting migration', {
    service: args.service,
    handles: args.handles,
    limit: args.limit,
    dryRun: args.dryRun,
  })

  // Load credentials
  const credentials = loadCredentials(args.credentials)
  console.log(`[bundle-measurements] Loaded credentials for ${credentials.size} orgs`)

  // Load progress
  const progress = loadProgress()
  console.log(`[bundle-measurements] Loaded progress for ${Object.keys(progress).length} orgs`)

  // Load errors
  const errors = loadErrors()
  console.log(`[bundle-measurements] Loaded ${errors.length} existing errors`)

  // Determine which handles to process
  let handles
  if (args.handles.length > 0) {
    handles = args.handles
  } else {
    handles = Array.from(credentials.keys())
  }
  if (args.limit !== undefined) {
    handles = handles.slice(0, args.limit)
  }

  console.log(`[bundle-measurements] Processing ${handles.length} orgs`)

  const agent = new AtpAgent({ service: args.service })

  let totalBundlesWritten = 0
  let totalOldRecordsDeleted = 0
  let totalOrgsSkipped = 0
  let totalOrgsProcessed = 0
  let totalOrgsErrored = 0

  for (const handle of handles) {
    console.log(`\n[bundle-measurements] === Processing ${handle} ===`)

    // Check if already completed (resumability)
    if (progress[handle] && progress[handle].completed) {
      console.log(`[bundle-measurements] Skipping ${handle}: already completed`)
      totalOrgsSkipped++
      continue
    }

    // Get credentials
    const password = credentials.get(handle)
    if (!password) {
      console.log(`[bundle-measurements] Skipping ${handle}: no credentials`)
      totalOrgsSkipped++
      continue
    }

    // Login
    if (!args.dryRun) {
      try {
        await agent.login({ identifier: handle, password })
        console.log(`[bundle-measurements] Logged in as ${handle}`)
      } catch (err) {
        console.error(`[bundle-measurements] Login failed for ${handle}: ${err?.message || String(err)}`)
        appendError(errors, { handle, phase: 'login', error: err?.message || String(err) })
        totalOrgsErrored++
        continue
      }
    } else {
      console.log(`[bundle-measurements] [DRY RUN] Would log in as ${handle}`)
    }

    // Fetch all measurement records
    let allRecords = []
    if (!args.dryRun) {
      try {
        allRecords = await listMeasurementRecords(agent, handle)
        console.log(`[bundle-measurements] Found ${allRecords.length} total measurement records for ${handle}`)
      } catch (err) {
        console.error(`[bundle-measurements] Failed to list measurements for ${handle}: ${err?.message || String(err)}`)
        appendError(errors, { handle, phase: 'list-records', error: err?.message || String(err) })
        totalOrgsErrored++
        continue
      }
    } else {
      console.log(`[bundle-measurements] [DRY RUN] Would fetch all measurement records for ${handle}`)
    }

    // Separate old-format (has measurementType at top level) from new-format (has result)
    const oldFormatRecords = allRecords.filter(
      (r) => r.value && typeof r.value.measurementType === 'string' && !r.value.result
    )
    const newFormatRecords = allRecords.filter(
      (r) => r.value && r.value.result
    )

    console.log(
      `[bundle-measurements] ${handle}: old-format=${oldFormatRecords.length} new-format=${newFormatRecords.length}`
    )

    // Skip orgs with no old-format records
    if (oldFormatRecords.length === 0) {
      console.log(`[bundle-measurements] Skipping ${handle}: no old-format records to migrate`)
      if (!args.dryRun) {
        progress[handle] = { completed: true, skippedReason: 'no-old-format-records', completedAt: new Date().toISOString() }
        saveProgress(progress)
      }
      totalOrgsSkipped++
      continue
    }

    // Group old-format records by occurrenceRef URI
    /** @type {Map<string, Array<{ uri: string, value: object }>>} */
    const groupsByOccurrenceRef = new Map()
    for (const rec of oldFormatRecords) {
      const occurrenceRef = rec.value.occurrenceRef
      if (!occurrenceRef) {
        console.warn(`[bundle-measurements]   Skipping record with no occurrenceRef: ${rec.uri}`)
        continue
      }
      if (!groupsByOccurrenceRef.has(occurrenceRef)) {
        groupsByOccurrenceRef.set(occurrenceRef, [])
      }
      groupsByOccurrenceRef.get(occurrenceRef).push(rec)
    }

    console.log(`[bundle-measurements] ${handle}: ${groupsByOccurrenceRef.size} occurrence groups to bundle`)

    if (args.dryRun) {
      // In dry-run mode, just log what would happen
      for (const [occurrenceRef, group] of groupsByOccurrenceRef) {
        const { record, rkey } = buildBundledRecord(occurrenceRef, group)
        const floraMeasurement = record.result
        const knownFieldNames = Object.keys(floraMeasurement).filter((k) => k !== '$type' && k !== 'additionalMeasurements')
        const additionalCount = floraMeasurement.additionalMeasurements ? floraMeasurement.additionalMeasurements.length : 0
        console.log(
          `[bundle-measurements]   [DRY RUN] Would bundle ${group.length} records → rkey=${rkey}` +
          ` occurrenceRef=${occurrenceRef}` +
          ` knownFields=[${knownFieldNames.join(', ')}]` +
          (additionalCount > 0 ? ` additionalMeasurements=${additionalCount}` : '')
        )
        console.log(`[bundle-measurements]   [DRY RUN] Would delete ${group.length} old records:`)
        for (const rec of group) {
          const oldRkey = rec.uri.split('/').pop()
          console.log(`[bundle-measurements]     - ${oldRkey} (measurementType=${rec.value.measurementType})`)
        }
      }
      totalOrgsProcessed++
      continue
    }

    // Process each group: write bundle then delete old records
    let orgBundlesWritten = 0
    let orgOldRecordsDeleted = 0
    let orgErrors = 0

    for (const [occurrenceRef, group] of groupsByOccurrenceRef) {
      const { record, rkey } = buildBundledRecord(occurrenceRef, group)

      // Safety: write the new bundle BEFORE deleting old records
      // If write succeeds but deletes fail, org will have duplicates (detectable) rather than data loss
      try {
        await agent.com.atproto.repo.putRecord({
          repo: handle,
          collection: DWC_MEASUREMENT_COLLECTION,
          rkey,
          record,
        })
        orgBundlesWritten++
        console.log(
          `[bundle-measurements]   Wrote bundle rkey=${rkey} for occurrenceRef=${occurrenceRef}` +
          ` (bundled ${group.length} old records)`
        )
      } catch (err) {
        console.error(
          `[bundle-measurements]   Failed to write bundle for occurrenceRef=${occurrenceRef}: ${err?.message || String(err)}`
        )
        appendError(errors, {
          handle,
          phase: 'write-bundle',
          occurrenceRef,
          error: err?.message || String(err),
        })
        orgErrors++
        // Don't delete old records if write failed — skip this group
        continue
      }

      // Delete old individual records
      for (const rec of group) {
        const oldRkey = rec.uri.split('/').pop()
        try {
          await agent.com.atproto.repo.deleteRecord({
            repo: handle,
            collection: DWC_MEASUREMENT_COLLECTION,
            rkey: oldRkey,
          })
          orgOldRecordsDeleted++
        } catch (err) {
          console.warn(
            `[bundle-measurements]   Failed to delete old record ${oldRkey}: ${err?.message || String(err)}`
          )
          appendError(errors, {
            handle,
            phase: 'delete-old-record',
            occurrenceRef,
            oldRkey,
            newBundleRkey: rkey,
            error: err?.message || String(err),
          })
          orgErrors++
          // Continue — the bundle was already written, so this is a detectable duplicate, not data loss
        }
      }
    }

    console.log(
      `[bundle-measurements] ${handle}: bundlesWritten=${orgBundlesWritten}` +
      ` oldRecordsDeleted=${orgOldRecordsDeleted}` +
      ` errors=${orgErrors}`
    )

    // Mark org as completed in progress file
    progress[handle] = {
      completed: true,
      completedAt: new Date().toISOString(),
      bundlesWritten: orgBundlesWritten,
      oldRecordsDeleted: orgOldRecordsDeleted,
      errors: orgErrors,
    }
    saveProgress(progress)

    totalBundlesWritten += orgBundlesWritten
    totalOldRecordsDeleted += orgOldRecordsDeleted
    if (orgErrors > 0) totalOrgsErrored++
    totalOrgsProcessed++
  }

  console.log('\n[bundle-measurements] Summary:', {
    service: args.service,
    dryRun: args.dryRun,
    orgsProcessed: totalOrgsProcessed,
    orgsSkipped: totalOrgsSkipped,
    orgsErrored: totalOrgsErrored,
    bundlesWritten: totalBundlesWritten,
    oldRecordsDeleted: totalOldRecordsDeleted,
  })

  if (!args.dryRun) {
    console.log(`[bundle-measurements] Progress saved to ${PROGRESS_FILE}`)
    console.log(`[bundle-measurements] Errors saved to ${ERRORS_FILE}`)
  }
}

main().catch((err) => {
  console.error('[bundle-measurements] Fatal error:', err)
  process.exit(1)
})
