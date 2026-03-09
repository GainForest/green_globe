// DwC-A assembler — orchestrates all writers into a complete archive
// Pure function: takes pre-fetched data, returns archive file contents as strings

import type { DwcaArchiveFiles, DwcaEmlInput } from './types'
import {
  OCCURRENCE_TSV_COLUMNS,
  MEASUREMENT_TSV_COLUMNS,
  MULTIMEDIA_TSV_COLUMNS,
} from './types'
import type { DwcaFetchResult } from './pds-fetcher'
import { writeOccurrenceTsv } from './occurrence-writer'
import { writeMeasurementTsv } from './measurement-writer'
import { writeMultimediaTsv } from './multimedia-writer'
import { writeMetaXml } from './meta-xml-writer'
import { writeEmlXml } from './eml-writer'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type AssembleOptions = {
  /** Fetched PDS records */
  data: DwcaFetchResult
  /** EML metadata input */
  eml: DwcaEmlInput
  /** PDS endpoint URL for building blob URLs */
  pdsEndpoint: string
  /** Default license URL for multimedia extension rows */
  defaultMultimediaLicense?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute geographic bounding box from occurrence records.
 * Returns undefined if no valid coordinate pairs are found.
 */
function computeGeoBounds(
  occurrences: DwcaFetchResult['occurrences']
): { west: number; east: number; north: number; south: number } | undefined {
  let minLat = Infinity
  let maxLat = -Infinity
  let minLon = Infinity
  let maxLon = -Infinity
  let found = false

  for (const occ of occurrences) {
    const lat = parseFloat(occ.decimalLatitude ?? '')
    const lon = parseFloat(occ.decimalLongitude ?? '')
    if (!isNaN(lat) && !isNaN(lon)) {
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
      if (lon < minLon) minLon = lon
      if (lon > maxLon) maxLon = lon
      found = true
    }
  }

  if (!found) return undefined
  return { west: minLon, east: maxLon, north: maxLat, south: minLat }
}

/**
 * Compute temporal range from occurrence eventDate strings.
 * Returns undefined if no valid dates are found.
 */
function computeTemporalRange(
  occurrences: DwcaFetchResult['occurrences']
): { startDate: string; endDate: string } | undefined {
  let earliest: Date | undefined
  let latest: Date | undefined

  for (const occ of occurrences) {
    if (!occ.eventDate) continue
    const d = new Date(occ.eventDate)
    if (isNaN(d.getTime())) continue
    if (earliest === undefined || d < earliest) earliest = d
    if (latest === undefined || d > latest) latest = d
  }

  if (earliest === undefined || latest === undefined) return undefined
  return {
    startDate: earliest.toISOString().slice(0, 10),
    endDate: latest.toISOString().slice(0, 10),
  }
}

// ---------------------------------------------------------------------------
// Main assembler
// ---------------------------------------------------------------------------

/**
 * Orchestrate all DwC-A writers into a complete archive.
 *
 * Steps:
 * 1. Write occurrence.txt
 * 2. Write measurementOrFact.txt
 * 3. Write multimedia.txt
 * 4. Determine which extensions have data rows (> 1 line = header + at least one data row)
 * 5. Write meta.xml
 * 6. Enrich EML input with auto-computed geographic bounds and temporal range
 * 7. Write eml.xml
 * 8. Return DwcaArchiveFiles (omit extension files that contain only the header)
 */
export function assembleDwca(options: AssembleOptions): DwcaArchiveFiles {
  const { data, eml, pdsEndpoint, defaultMultimediaLicense } = options

  // Step 1: occurrence.txt
  const occurrenceTsv = writeOccurrenceTsv(data.occurrences)

  // Step 2: measurementOrFact.txt
  const measurementTsv = writeMeasurementTsv(
    data.measurements,
    data.occurrenceUriToId
  )

  // Step 3: multimedia.txt
  const multimediaTsv = writeMultimediaTsv(
    data.multimedia,
    data.occurrenceUriToId,
    {
      pdsEndpoint,
      orgDid: data.orgDid,
      defaultLicense: defaultMultimediaLicense,
    }
  )

  // Step 4: determine which extensions have data rows (more than just the header)
  const hasMeasurements = measurementTsv.split('\n').filter(Boolean).length > 1
  const hasMultimedia = multimediaTsv.split('\n').filter(Boolean).length > 1

  // Step 5: meta.xml
  const metaXml = writeMetaXml({
    hasOccurrences: true,
    hasMeasurements,
    hasMultimedia,
    occurrenceColumns: OCCURRENCE_TSV_COLUMNS,
    measurementColumns: MEASUREMENT_TSV_COLUMNS,
    multimediaColumns: MULTIMEDIA_TSV_COLUMNS,
  })

  // Step 6: enrich EML input (shallow copy — do not mutate the caller's object)
  const enrichedEml: DwcaEmlInput = { ...eml }

  // Auto-compute geographic bounds if not already provided by caller
  if (
    enrichedEml.westBound === undefined ||
    enrichedEml.eastBound === undefined ||
    enrichedEml.northBound === undefined ||
    enrichedEml.southBound === undefined
  ) {
    const bounds = computeGeoBounds(data.occurrences)
    if (bounds !== undefined) {
      if (enrichedEml.westBound === undefined) enrichedEml.westBound = bounds.west
      if (enrichedEml.eastBound === undefined) enrichedEml.eastBound = bounds.east
      if (enrichedEml.northBound === undefined) enrichedEml.northBound = bounds.north
      if (enrichedEml.southBound === undefined) enrichedEml.southBound = bounds.south
    }
  }

  // Auto-compute temporal range if not already provided by caller
  if (enrichedEml.startDate === undefined || enrichedEml.endDate === undefined) {
    const range = computeTemporalRange(data.occurrences)
    if (range !== undefined) {
      if (enrichedEml.startDate === undefined) enrichedEml.startDate = range.startDate
      if (enrichedEml.endDate === undefined) enrichedEml.endDate = range.endDate
    }
  }

  // Step 7: eml.xml
  const emlXml = writeEmlXml(enrichedEml)

  // Step 8: assemble the archive files object
  const files: DwcaArchiveFiles = {
    'occurrence.txt': occurrenceTsv,
    'meta.xml': metaXml,
    'eml.xml': emlXml,
  }

  if (hasMeasurements) {
    files['measurementOrFact.txt'] = measurementTsv
  }

  if (hasMultimedia) {
    files['multimedia.txt'] = multimediaTsv
  }

  return files
}
