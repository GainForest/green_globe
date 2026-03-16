// MeasurementOrFact TSV writer for Darwin Core Archives
// Pure function — no network calls, no side effects beyond console.warn

import { MEASUREMENT_TSV_COLUMNS, NEWLINE, TAB } from './types'

// ---------------------------------------------------------------------------
// Input type — defined in pds-fetcher to avoid duplication; re-exported here
// for consumers that import from this module.
// ---------------------------------------------------------------------------

import type { PdsMeasurementRecord } from './pds-fetcher'
export type { PdsMeasurementRecord } from './pds-fetcher'

// ---------------------------------------------------------------------------
// Writer
// ---------------------------------------------------------------------------

/**
 * Transforms PDS measurement records into a tab-separated measurementOrFact.txt
 * string for Darwin Core Archives.
 *
 * @param records - Array of PDS measurement records to transform
 * @param occurrenceUriToId - Map from AT-URI → occurrenceID string
 * @returns TSV string with header row + one data row per valid record
 */
export function writeMeasurementTsv(
  records: PdsMeasurementRecord[],
  occurrenceUriToId: Map<string, string>
): string {
  const headerRow = MEASUREMENT_TSV_COLUMNS.join(TAB)
  const lines: string[] = [headerRow]

  for (const record of records) {
    // Resolve coreid: try occurrenceRef lookup first, then fall back to occurrenceID
    let coreid: string | undefined

    if (record.occurrenceRef !== undefined && record.occurrenceRef !== '') {
      coreid = occurrenceUriToId.get(record.occurrenceRef)
    }

    if (coreid === undefined) {
      if (record.occurrenceID !== undefined && record.occurrenceID !== '') {
        coreid = record.occurrenceID
      }
    }

    if (coreid === undefined) {
      console.warn(
        '[writeMeasurementTsv] Skipping record: no resolvable occurrenceRef or occurrenceID',
        record
      )
      continue
    }

    // Build the row in MEASUREMENT_TSV_COLUMNS order
    // First column is 'coreid', remaining columns map to record fields
    const row = MEASUREMENT_TSV_COLUMNS.map((col) => {
      if (col === 'coreid') return coreid ?? ''
      const value = record[col as keyof PdsMeasurementRecord]
      return value ?? ''
    })

    lines.push(row.join(TAB))
  }

  return lines.join(NEWLINE) + NEWLINE
}
