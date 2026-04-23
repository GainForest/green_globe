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
const AUDIT_FILE = 'scripts/migrations/data/bundle-measurements-audit.json'

const USAGE = `Usage:
  node scripts/migrations/bundle-measurement-records.js \\
    [--service https://climateai.org] \\
    [--credentials <path>] \\
    [--handle <handle>] \\
    [--limit N] \\
    [--dry-run]

Options:
  --service <url>       PDS service URL (default: https://climateai.org)
  --credentials <path>  JSON file mapping handle -> password
  --handle <handle>     Process a single handle (may be repeated)
  --limit <n>           Process at most n handles
  --dry-run             Fetch and analyze real records without writing/deleting
  --help, -h            Show this message
`

const KNOWN_MEASUREMENT_TYPES = new Map([
  ['dbh', { fieldName: 'dbh', canonicalType: 'DBH', measurementUnit: 'cm' }],
  ['tree height', { fieldName: 'totalHeight', canonicalType: 'tree height', measurementUnit: 'm' }],
  ['height', { fieldName: 'totalHeight', canonicalType: 'tree height', measurementUnit: 'm' }],
  ['diameter', { fieldName: 'basalDiameter', canonicalType: 'diameter', measurementUnit: 'cm' }],
  ['canopy cover', { fieldName: 'canopyCoverPercent', canonicalType: 'canopy cover', measurementUnit: '%' }],
])

const FIELD_TO_MEASUREMENT_ENTRY = {
  dbh: { measurementType: 'DBH', measurementUnit: 'cm' },
  totalHeight: { measurementType: 'tree height', measurementUnit: 'm' },
  basalDiameter: { measurementType: 'diameter', measurementUnit: 'cm' },
  canopyCoverPercent: { measurementType: 'canopy cover', measurementUnit: '%' },
}

const TOP_LEVEL_METADATA_FIELDS = [
  { oldField: 'measurementDeterminedBy', newField: 'measuredBy' },
  { oldField: 'measurementDeterminedDate', newField: 'measurementDate' },
  { oldField: 'measurementMethod', newField: 'measurementMethod' },
  { oldField: 'measurementRemarks', newField: 'measurementRemarks' },
]

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

  const requireValue = (flag, index) => {
    const value = argv[index + 1]
    if (value === undefined || value.startsWith('--')) {
      throw new Error(`Missing value for ${flag}`)
    }
    return value
  }

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--help' || a === '-h') {
      console.log(USAGE)
      process.exit(0)
    }
    if (a === '--service') args.service = requireValue(a, i++)
    else if (a === '--credentials') args.credentials = requireValue(a, i++)
    else if (a === '--handle') args.handles.push(requireValue(a, i++))
    else if (a === '--limit') args.limit = parseInt(requireValue(a, i++), 10)
    else if (a === '--dry-run') args.dryRun = true
    else throw new Error(`Unknown argument: ${a}`)
  }

  if (args.limit !== undefined && (!Number.isInteger(args.limit) || args.limit < 1)) {
    throw new Error(`--limit must be a positive integer (received: ${args.limit})`)
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

function loadAudit() {
  try {
    if (fs.existsSync(AUDIT_FILE)) {
      return JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8'))
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

function recordError(errors, entry, shouldPersist) {
  if (shouldPersist) {
    appendError(errors, entry)
    return
  }
  errors.push({ ...entry, timestamp: new Date().toISOString() })
}

function appendAuditEntries(auditEntries, entries, shouldPersist) {
  auditEntries.push(...entries)
  if (!shouldPersist) return
  fs.mkdirSync(path.dirname(AUDIT_FILE), { recursive: true })
  fs.writeFileSync(AUDIT_FILE, JSON.stringify(auditEntries, null, 2))
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

async function resolveDid(agent, handle) {
  if (typeof handle === 'string' && handle.startsWith('did:')) {
    return handle
  }
  const res = await agent.resolveHandle({ handle })
  return res.data.did
}

// ---------------------------------------------------------------------------
// measurementType → floraMeasurement field mapping
// ---------------------------------------------------------------------------

function normalizeString(value) {
  if (value === undefined || value === null) return null
  const normalized = String(value).trim()
  return normalized === '' ? null : normalized
}

function normalizeMeasurementKey(measurementType, measurementValue, measurementUnit) {
  return [
    normalizeString(measurementType)?.toLowerCase() || '',
    normalizeString(measurementValue) || '',
    normalizeString(measurementUnit)?.toLowerCase() || '',
  ].join('::')
}

function normalizeMeasurementRowIdentity(entry) {
  return [
    normalizeMeasurementKey(entry.measurementType, entry.measurementValue, entry.measurementUnit),
    normalizeString(entry.measurementMethod) || '',
    normalizeString(entry.measurementAccuracy) || '',
    normalizeString(entry.measurementRemarks) || '',
  ].join('::')
}

function createAuditEntries(handle, occurrenceRef, group, bundleInfo) {
  return group.map((record) => {
    const descriptor = getMeasurementDescriptor(record.value.measurementType)

    return {
      timestamp: new Date().toISOString(),
      handle,
      occurrenceRef,
      oldRecordUri: record.uri,
      oldMeasurementID: normalizeString(record.value.measurementID),
      oldMeasurementType: normalizeString(record.value.measurementType),
      oldMeasurementValue: normalizeString(record.value.measurementValue),
      oldMeasurementUnit: normalizeString(record.value.measurementUnit),
      mappedField: descriptor ? descriptor.fieldName : null,
      bundleUri: bundleInfo.bundleUri,
      bundleRkey: bundleInfo.bundleRkey,
      bundleSource: bundleInfo.bundleSource,
    }
  })
}

function getMeasurementDescriptor(measurementType) {
  const normalized = normalizeString(measurementType)
  if (!normalized) return null
  return KNOWN_MEASUREMENT_TYPES.get(normalized.toLowerCase()) || null
}

function getConsistentValue(records, fieldName) {
  const normalizedValues = records.map((record) => normalizeString(record.value[fieldName]))
  const values = new Set(normalizedValues.filter(Boolean))
  const hasBlankValues = normalizedValues.some((value) => value === null)

  if (values.size > 1) {
    return { status: 'conflict', values: Array.from(values) }
  }

  if (values.size === 1) {
    if (hasBlankValues) {
      return { status: 'partial', value: Array.from(values)[0] }
    }
    return { status: 'value', value: Array.from(values)[0] }
  }

  return { status: 'absent' }
}

function getEarliestCreatedAt(records) {
  let earliestValue = null
  let earliestTimestamp = Infinity

  for (const record of records) {
    const createdAt = normalizeString(record.value.createdAt)
    if (!createdAt) continue
    const timestamp = Date.parse(createdAt)
    if (Number.isNaN(timestamp)) continue
    if (timestamp < earliestTimestamp) {
      earliestTimestamp = timestamp
      earliestValue = createdAt
    }
  }

  return earliestValue
}

function collectGroupMetadata(oldRecords) {
  const metadata = {}
  const conflicts = []

  for (const { oldField, newField } of TOP_LEVEL_METADATA_FIELDS) {
    const result = getConsistentValue(oldRecords, oldField)
    if (result.status === 'conflict') {
      conflicts.push({
        type: 'metadata-conflict',
        oldField,
        newField,
        values: result.values,
      })
      continue
    }

    if (result.status === 'partial') {
      conflicts.push({
        type: 'partial-metadata-conflict',
        oldField,
        newField,
        value: result.value,
      })
      continue
    }

    if (result.status === 'value') {
      metadata[newField] = result.value
    }
  }

  const earliestCreatedAt = getEarliestCreatedAt(oldRecords)
  if (earliestCreatedAt) {
    metadata.createdAt = earliestCreatedAt
  }

  return { metadata, conflicts }
}

function extractComparableMeasurementsFromBundle(bundleValue) {
  const result = bundleValue && typeof bundleValue.result === 'object' && bundleValue.result !== null
    ? bundleValue.result
    : null

  if (!result) {
    return { keys: new Set(), entries: [] }
  }

  const keys = new Set()
  const entries = []

  for (const [fieldName, definition] of Object.entries(FIELD_TO_MEASUREMENT_ENTRY)) {
    const value = normalizeString(result[fieldName])
    if (!value) continue
    const entry = {
      measurementType: definition.measurementType,
      measurementValue: value,
      measurementUnit: definition.measurementUnit,
      measurementMethod: null,
      measurementAccuracy: null,
      measurementRemarks: null,
    }
    keys.add(normalizeMeasurementKey(entry.measurementType, entry.measurementValue, entry.measurementUnit))
    entries.push(entry)
  }

  const listFields = []
  if (Array.isArray(result.additionalMeasurements)) {
    listFields.push(...result.additionalMeasurements)
  }
  if (Array.isArray(result.measurements)) {
    listFields.push(...result.measurements)
  }

  for (const entry of listFields) {
    if (!entry || typeof entry !== 'object') continue
    const type = normalizeString(entry.measurementType)
    const value = normalizeString(entry.measurementValue)
    if (!type || !value) continue
    const unit = normalizeString(entry.measurementUnit)
    const normalizedEntry = {
      measurementType: type,
      measurementValue: value,
      measurementUnit: unit,
      measurementMethod: normalizeString(entry.measurementMethod),
      measurementAccuracy: normalizeString(entry.measurementAccuracy),
      measurementRemarks: normalizeString(entry.measurementRemarks),
    }
    keys.add(normalizeMeasurementKey(type, value, unit))
    entries.push(normalizedEntry)
  }

  return { keys, entries }
}

function analyzeOldGroupAgainstBundle(bundleValue, oldRecords) {
  const conflicts = []
  const seenMeasurementRows = new Set()

  const { metadata, conflicts: metadataConflicts } = collectGroupMetadata(oldRecords)
  conflicts.push(...metadataConflicts)

  const occurrenceIDResult = getConsistentValue(oldRecords, 'occurrenceID')
  if (occurrenceIDResult.status === 'conflict') {
    conflicts.push({ type: 'occurrence-id-conflict', values: occurrenceIDResult.values })
  } else if (occurrenceIDResult.status === 'partial') {
    conflicts.push({ type: 'partial-occurrence-id-conflict', value: occurrenceIDResult.value })
  }

  const comparableBundle = extractComparableMeasurementsFromBundle(bundleValue)
  const comparableEntries = comparableBundle.keys
  const bundleEntries = comparableBundle.entries

  for (const { value } of oldRecords) {
    const descriptor = getMeasurementDescriptor(value.measurementType)
    const measurementValue = normalizeString(value.measurementValue)
    const measurementUnit = normalizeString(value.measurementUnit)
    const measurementMethod = normalizeString(value.measurementMethod)
    const measurementAccuracy = normalizeString(value.measurementAccuracy)
    const measurementRemarks = normalizeString(value.measurementRemarks)

    if (!measurementValue) {
      conflicts.push({
        type: 'empty-measurement-value',
        measurementType: normalizeString(value.measurementType),
      })
      continue
    }

    const rowIdentity = normalizeMeasurementRowIdentity({
      measurementType: value.measurementType,
      measurementValue,
      measurementUnit,
      measurementMethod,
      measurementAccuracy,
      measurementRemarks,
    })
    if (seenMeasurementRows.has(rowIdentity)) {
      conflicts.push({
        type: 'duplicate-old-measurement-row',
        measurementType: normalizeString(value.measurementType),
        measurementValue,
        measurementUnit,
      })
      continue
    }
    seenMeasurementRows.add(rowIdentity)

    if (descriptor) {
      if (measurementAccuracy) {
        conflicts.push({
          type: 'unsupported-typed-accuracy',
          measurementType: normalizeString(value.measurementType),
          measurementAccuracy,
        })
        continue
      }

      if (measurementUnit && measurementUnit !== descriptor.measurementUnit) {
        conflicts.push({
          type: 'unit-mismatch',
          measurementType: normalizeString(value.measurementType),
          measurementUnit,
          expectedUnit: descriptor.measurementUnit,
        })
        continue
      }
    }

    if (!descriptor) {
      const unknownMeasurementMatch = bundleEntries.some((entry) =>
        normalizeMeasurementKey(entry.measurementType, entry.measurementValue, entry.measurementUnit) ===
          normalizeMeasurementKey(value.measurementType, measurementValue, measurementUnit) &&
        entry.measurementMethod === measurementMethod &&
        entry.measurementAccuracy === measurementAccuracy &&
        entry.measurementRemarks === measurementRemarks
      )

      if (!unknownMeasurementMatch) {
        conflicts.push({
          type: 'bundle-missing-old-measurement',
          measurementType: normalizeString(value.measurementType),
          measurementValue,
          measurementUnit,
          measurementMethod,
          measurementAccuracy,
          measurementRemarks,
        })
      }
      continue
    }

    const key = normalizeMeasurementKey(
      descriptor.canonicalType,
      measurementValue,
      descriptor.measurementUnit
    )

    if (!comparableEntries.has(key)) {
      conflicts.push({
        type: 'bundle-missing-old-measurement',
        measurementType: normalizeString(value.measurementType),
        measurementValue,
        measurementUnit,
      })
    }
  }

  for (const [newField, newValue] of Object.entries(metadata)) {
    if (newField === 'createdAt') continue
    const bundledValue = normalizeString(bundleValue[newField])
    if (bundledValue !== newValue) {
      conflicts.push({
        type: 'bundle-metadata-mismatch',
        field: newField,
        expected: newValue,
        actual: bundledValue,
      })
    }
  }

  if (occurrenceIDResult.status === 'value') {
    const bundledOccurrenceId = normalizeString(bundleValue.occurrenceID)
    if (bundledOccurrenceId !== occurrenceIDResult.value) {
      conflicts.push({
        type: 'bundle-occurrence-id-mismatch',
        expected: occurrenceIDResult.value,
        actual: bundledOccurrenceId,
      })
    }
  }

  return {
    matches: conflicts.length === 0,
    conflicts,
  }
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
 * @returns {{ ok: true, record: object, rkey: string } | { ok: false, conflicts: object[] }}
 */
function buildBundledRecord(occurrenceRef, oldRecords) {
  const conflicts = []
  const seenMeasurementRows = new Set()

  /** @type {Record<string, string>} */
  const knownFields = {}
  /** @type {Array<{ measurementType: string, measurementValue: string, measurementUnit?: string, measurementMethod?: string, measurementAccuracy?: string, measurementRemarks?: string }>} */
  const additionalMeasurements = []

  const { metadata, conflicts: metadataConflicts } = collectGroupMetadata(oldRecords)
  conflicts.push(...metadataConflicts)

  const occurrenceIDResult = getConsistentValue(oldRecords, 'occurrenceID')
  if (occurrenceIDResult.status === 'conflict') {
    conflicts.push({ type: 'occurrence-id-conflict', values: occurrenceIDResult.values })
  } else if (occurrenceIDResult.status === 'partial') {
    conflicts.push({ type: 'partial-occurrence-id-conflict', value: occurrenceIDResult.value })
  }

  for (const { value } of oldRecords) {
    const measurementType = normalizeString(value.measurementType)
    const measurementValue = normalizeString(value.measurementValue)
    const measurementUnit = normalizeString(value.measurementUnit)
    const measurementMethod = normalizeString(value.measurementMethod)
    const measurementAccuracy = normalizeString(value.measurementAccuracy)
    const measurementRemarks = normalizeString(value.measurementRemarks)

    if (!measurementType || !measurementValue) {
      conflicts.push({ type: 'invalid-old-record', measurementType, measurementValue })
      continue
    }

    const rowIdentity = normalizeMeasurementRowIdentity({
      measurementType,
      measurementValue,
      measurementUnit,
      measurementMethod,
      measurementAccuracy,
      measurementRemarks,
    })
    if (seenMeasurementRows.has(rowIdentity)) {
      conflicts.push({
        type: 'duplicate-old-measurement-row',
        measurementType,
        measurementValue,
        measurementUnit,
      })
      continue
    }
    seenMeasurementRows.add(rowIdentity)

    const descriptor = getMeasurementDescriptor(measurementType)
    if (descriptor) {
      // Known field — map directly onto floraMeasurement
      if (measurementUnit && measurementUnit !== descriptor.measurementUnit) {
        conflicts.push({
          type: 'unit-mismatch',
          measurementType,
          measurementUnit,
          expectedUnit: descriptor.measurementUnit,
        })
        continue
      }

      if (measurementAccuracy) {
        conflicts.push({
          type: 'unsupported-typed-accuracy',
          measurementType,
          measurementAccuracy,
        })
        continue
      }

      const existingValue = knownFields[descriptor.fieldName]
      if (existingValue !== undefined && existingValue !== measurementValue) {
        conflicts.push({
          type: 'conflicting-known-field-values',
          fieldName: descriptor.fieldName,
          firstValue: existingValue,
          secondValue: measurementValue,
        })
        continue
      }
      knownFields[descriptor.fieldName] = measurementValue
    } else {
      // Unknown type — goes into additionalMeasurements
      const entry = { measurementType, measurementValue }
      if (measurementUnit) entry.measurementUnit = measurementUnit
      if (measurementMethod) entry.measurementMethod = measurementMethod
      if (measurementAccuracy) entry.measurementAccuracy = measurementAccuracy
      if (measurementRemarks) entry.measurementRemarks = measurementRemarks
      additionalMeasurements.push(entry)
    }
  }

  if (conflicts.length > 0) {
    return { ok: false, conflicts }
  }

  // Build the floraMeasurement result object
  const floraMeasurement = {
    $type: 'app.gainforest.dwc.measurement#floraMeasurement',
    ...knownFields,
  }
  if (additionalMeasurements.length > 0) {
    floraMeasurement.additionalMeasurements = additionalMeasurements
  }

  const record = {
    $type: DWC_MEASUREMENT_COLLECTION,
    occurrenceRef,
    result: floraMeasurement,
    createdAt: metadata.createdAt || new Date().toISOString(),
  }

  if (occurrenceIDResult.status === 'value') {
    record.occurrenceID = occurrenceIDResult.value
  }

  for (const key of ['measuredBy', 'measurementDate', 'measurementMethod', 'measurementRemarks']) {
    if (metadata[key]) {
      record[key] = metadata[key]
    }
  }

  // Generate a fresh TID rkey
  const rkey = TID.nextStr()

  return { ok: true, record, rkey }
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

  // Load audit
  const auditEntries = loadAudit()
  console.log(`[bundle-measurements] Loaded ${auditEntries.length} existing audit entries`)

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

    let repoDid
    try {
      repoDid = await resolveDid(agent, handle)
      console.log(`[bundle-measurements] Resolved ${handle} -> ${repoDid}`)
    } catch (err) {
      console.error(`[bundle-measurements] Failed to resolve DID for ${handle}: ${err?.message || String(err)}`)
      recordError(errors, { handle, phase: 'resolve-did', error: err?.message || String(err) }, !args.dryRun)
      totalOrgsErrored++
      continue
    }

    // Login
    try {
      await agent.login({ identifier: handle, password })
      console.log(`[bundle-measurements] Logged in as ${handle}${args.dryRun ? ' [DRY RUN]' : ''}`)
    } catch (err) {
      console.error(`[bundle-measurements] Login failed for ${handle}: ${err?.message || String(err)}`)
      recordError(errors, { handle, phase: 'login', error: err?.message || String(err) }, !args.dryRun)
      totalOrgsErrored++
      continue
    }

    // Fetch all measurement records
    let allRecords = []
    try {
      allRecords = await listMeasurementRecords(agent, repoDid)
      console.log(`[bundle-measurements] Found ${allRecords.length} total measurement records for ${handle}`)
    } catch (err) {
      console.error(`[bundle-measurements] Failed to list measurements for ${handle}: ${err?.message || String(err)}`)
      recordError(errors, { handle, phase: 'list-records', error: err?.message || String(err) }, !args.dryRun)
      totalOrgsErrored++
      continue
    }

    // Separate old-format (has measurementType at top level) from new-format (has result)
    const oldFormatRecords = allRecords.filter(
      (r) => r.value && typeof r.value.measurementType === 'string' && !r.value.result
    )
    const newFormatRecords = allRecords.filter(
      (r) => r.value && r.value.result
    )
    const unknownFormatRecords = allRecords.filter(
      (r) => !oldFormatRecords.includes(r) && !newFormatRecords.includes(r)
    )

    /** @type {Map<string, Array<{ uri: string, cid: string, value: object }>>} */
    const bundlesByOccurrenceRef = new Map()
    for (const record of newFormatRecords) {
      const occurrenceRef = normalizeString(record.value.occurrenceRef)
      if (!occurrenceRef) continue
      if (!bundlesByOccurrenceRef.has(occurrenceRef)) {
        bundlesByOccurrenceRef.set(occurrenceRef, [])
      }
      bundlesByOccurrenceRef.get(occurrenceRef).push(record)
    }

    console.log(
      `[bundle-measurements] ${handle}: old-format=${oldFormatRecords.length} new-format=${newFormatRecords.length} unknown-format=${unknownFormatRecords.length}`
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
    let missingOccurrenceRefCount = 0
    for (const rec of oldFormatRecords) {
      const occurrenceRef = normalizeString(rec.value.occurrenceRef)
      if (!occurrenceRef) {
        console.warn(`[bundle-measurements]   Skipping record with no occurrenceRef: ${rec.uri}`)
        recordError(errors, {
          handle,
          phase: 'missing-occurrence-ref',
          recordUri: rec.uri,
        }, !args.dryRun)
        missingOccurrenceRefCount++
        continue
      }
      if (!groupsByOccurrenceRef.has(occurrenceRef)) {
        groupsByOccurrenceRef.set(occurrenceRef, [])
      }
      groupsByOccurrenceRef.get(occurrenceRef).push(rec)
    }

    console.log(`[bundle-measurements] ${handle}: ${groupsByOccurrenceRef.size} occurrence groups to bundle`)

    // Process each group: write bundle then delete old records
    let orgBundlesWritten = 0
    let orgOldRecordsDeleted = 0
    let orgErrors = 0
    let orgExistingBundlesMatched = 0
    let orgGroupsNeedingRetry = missingOccurrenceRefCount

    if (unknownFormatRecords.length > 0) {
      recordError(errors, {
        handle,
        phase: 'unknown-format-records',
        recordUris: unknownFormatRecords.map((record) => record.uri),
      }, !args.dryRun)
      orgErrors += unknownFormatRecords.length
      orgGroupsNeedingRetry += unknownFormatRecords.length
      console.warn(
        `[bundle-measurements]   Found ${unknownFormatRecords.length} unknown-format records; leaving for manual review`
      )
    }

    for (const [occurrenceRef, group] of groupsByOccurrenceRef) {
      const existingBundles = bundlesByOccurrenceRef.get(occurrenceRef) || []

      if (existingBundles.length > 1) {
        console.warn(
          `[bundle-measurements]   Skipping occurrenceRef=${occurrenceRef}: found ${existingBundles.length} existing bundles`
        )
        recordError(errors, {
          handle,
          phase: 'multiple-existing-bundles',
          occurrenceRef,
          bundleUris: existingBundles.map((bundle) => bundle.uri),
        }, !args.dryRun)
        orgErrors++
        orgGroupsNeedingRetry++
        continue
      }

      if (existingBundles.length === 1) {
        const analysis = analyzeOldGroupAgainstBundle(existingBundles[0].value, group)
        if (!analysis.matches) {
          console.warn(
            `[bundle-measurements]   Skipping occurrenceRef=${occurrenceRef}: existing bundle conflicts with old records`
          )
          recordError(errors, {
            handle,
            phase: 'existing-bundle-conflict',
            occurrenceRef,
            bundleUri: existingBundles[0].uri,
            conflicts: analysis.conflicts,
          }, !args.dryRun)
          orgErrors++
          orgGroupsNeedingRetry++
          continue
        }

        orgExistingBundlesMatched++

        if (args.dryRun) {
          console.log(
            `[bundle-measurements]   [DRY RUN] Would keep existing bundle for occurrenceRef=${occurrenceRef}` +
            ` and delete ${group.length} old records`
          )
          continue
        }

        appendAuditEntries(
          auditEntries,
          createAuditEntries(handle, occurrenceRef, group, {
            bundleUri: existingBundles[0].uri,
            bundleRkey: existingBundles[0].uri.split('/').pop(),
            bundleSource: 'existing',
          }),
          !args.dryRun
        )

        for (const rec of group) {
          const oldRkey = rec.uri.split('/').pop()
          try {
            await agent.com.atproto.repo.deleteRecord({
              repo: repoDid,
              collection: DWC_MEASUREMENT_COLLECTION,
              rkey: oldRkey,
            })
            orgOldRecordsDeleted++
          } catch (err) {
            console.warn(
              `[bundle-measurements]   Failed to delete old record ${oldRkey}: ${err?.message || String(err)}`
            )
            recordError(errors, {
              handle,
              phase: 'delete-old-record',
              occurrenceRef,
              oldRkey,
              existingBundleUri: existingBundles[0].uri,
              error: err?.message || String(err),
            }, !args.dryRun)
            orgErrors++
            orgGroupsNeedingRetry++
          }
        }
        continue
      }

      const bundleResult = buildBundledRecord(occurrenceRef, group)
      if (!bundleResult.ok) {
        console.warn(
          `[bundle-measurements]   Skipping occurrenceRef=${occurrenceRef}: could not build safe bundle`
        )
        recordError(errors, {
          handle,
          phase: 'build-bundle',
          occurrenceRef,
          conflicts: bundleResult.conflicts,
        }, !args.dryRun)
        orgErrors++
        orgGroupsNeedingRetry++
        continue
      }

      const { record, rkey } = bundleResult

      if (args.dryRun) {
        const floraMeasurement = record.result
        const knownFieldNames = Object.keys(floraMeasurement).filter((k) => k !== '$type' && k !== 'additionalMeasurements')
        const additionalCount = Array.isArray(floraMeasurement.additionalMeasurements)
          ? floraMeasurement.additionalMeasurements.length
          : 0
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
        continue
      }

      // Safety: write the new bundle BEFORE deleting old records
      // If write succeeds but deletes fail, org will have duplicates (detectable) rather than data loss
      try {
        const response = await agent.com.atproto.repo.putRecord({
          repo: repoDid,
          collection: DWC_MEASUREMENT_COLLECTION,
          rkey,
          record,
        })
        orgBundlesWritten++

        appendAuditEntries(
          auditEntries,
          createAuditEntries(handle, occurrenceRef, group, {
            bundleUri: response.data.uri,
            bundleRkey: rkey,
            bundleSource: 'created',
          }),
          !args.dryRun
        )

        console.log(
          `[bundle-measurements]   Wrote bundle rkey=${rkey} for occurrenceRef=${occurrenceRef}` +
          ` (bundled ${group.length} old records)`
        )
      } catch (err) {
        console.error(
          `[bundle-measurements]   Failed to write bundle for occurrenceRef=${occurrenceRef}: ${err?.message || String(err)}`
        )
        recordError(errors, {
          handle,
          phase: 'write-bundle',
          occurrenceRef,
          error: err?.message || String(err),
        }, !args.dryRun)
        orgErrors++
        orgGroupsNeedingRetry++
        // Don't delete old records if write failed — skip this group
        continue
      }

      // Delete old individual records
      for (const rec of group) {
        const oldRkey = rec.uri.split('/').pop()
        try {
          await agent.com.atproto.repo.deleteRecord({
            repo: repoDid,
            collection: DWC_MEASUREMENT_COLLECTION,
            rkey: oldRkey,
          })
          orgOldRecordsDeleted++
        } catch (err) {
          console.warn(
            `[bundle-measurements]   Failed to delete old record ${oldRkey}: ${err?.message || String(err)}`
          )
          recordError(errors, {
            handle,
            phase: 'delete-old-record',
            occurrenceRef,
            oldRkey,
            newBundleRkey: rkey,
            error: err?.message || String(err),
          }, !args.dryRun)
          orgErrors++
          orgGroupsNeedingRetry++
          // Continue — the bundle was already written, so this is a detectable duplicate, not data loss
        }
      }
    }

    console.log(
      `[bundle-measurements] ${handle}: bundlesWritten=${orgBundlesWritten}` +
      ` existingBundlesMatched=${orgExistingBundlesMatched}` +
      ` oldRecordsDeleted=${orgOldRecordsDeleted}` +
      ` errors=${orgErrors}` +
      ` groupsNeedingRetry=${orgGroupsNeedingRetry}`
    )

    const completed = orgGroupsNeedingRetry === 0

    if (!args.dryRun) {
      progress[handle] = {
        completed,
        updatedAt: new Date().toISOString(),
        completedAt: completed ? new Date().toISOString() : undefined,
        bundlesWritten: orgBundlesWritten,
        existingBundlesMatched: orgExistingBundlesMatched,
        oldRecordsDeleted: orgOldRecordsDeleted,
        errors: orgErrors,
        groupsNeedingRetry: orgGroupsNeedingRetry,
      }
      saveProgress(progress)
    }

    totalBundlesWritten += orgBundlesWritten
    totalOldRecordsDeleted += orgOldRecordsDeleted
    if (orgErrors > 0 || orgGroupsNeedingRetry > 0) totalOrgsErrored++
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
    console.log(`[bundle-measurements] Audit trail saved to ${AUDIT_FILE}`)
  }
}

main().catch((err) => {
  console.error('[bundle-measurements] Fatal error:', err?.message || String(err))
  console.error(USAGE)
  process.exit(1)
})
