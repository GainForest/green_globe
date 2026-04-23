import { NEWLINE, OCCURRENCE_TSV_COLUMNS, TAB } from './types'

// ---------------------------------------------------------------------------
// Input type
// ---------------------------------------------------------------------------

export type PdsOccurrenceRecord = {
  occurrenceID?: string
  basisOfRecord?: string
  scientificName?: string
  vernacularName?: string
  kingdom?: string
  phylum?: string
  class?: string
  order?: string
  family?: string
  genus?: string
  specificEpithet?: string
  taxonRank?: string
  eventDate?: string
  decimalLatitude?: string
  decimalLongitude?: string
  geodeticDatum?: string
  coordinateUncertaintyInMeters?: number
  country?: string
  countryCode?: string
  stateProvince?: string
  locality?: string
  recordedBy?: string
  datasetName?: string
  institutionCode?: string
  associatedMedia?: string
  occurrenceRemarks?: string
  dynamicProperties?: string
  occurrenceStatus?: string
  individualCount?: number
  sex?: string
  lifeStage?: string
  habitat?: string
  samplingProtocol?: string
}

// ---------------------------------------------------------------------------
// Writer
// ---------------------------------------------------------------------------

/**
 * Transforms an array of PDS occurrence records into a tab-separated
 * occurrence.txt string for Darwin Core Archives.
 *
 * - First line is the header row (OCCURRENCE_TSV_COLUMNS joined by TAB)
 * - Each subsequent line is one record, values in OCCURRENCE_TSV_COLUMNS order
 * - Missing/undefined fields become empty strings
 * - Numeric fields are converted via String()
 * - geodeticDatum defaults to 'WGS84' when undefined
 * - Lines terminated with \n (including the last line)
 * - No quoting or escaping (DwC-A TSV is unquoted per GBIF spec)
 */
export function writeOccurrenceTsv(records: PdsOccurrenceRecord[]): string {
  const header = OCCURRENCE_TSV_COLUMNS.join(TAB) + NEWLINE

  if (records.length === 0) {
    return header
  }

  const rows = records.map((record) => {
    return OCCURRENCE_TSV_COLUMNS.map((col) => {
      // geodeticDatum defaults to 'WGS84' when undefined
      if (col === 'geodeticDatum') {
        return record.geodeticDatum ?? 'WGS84'
      }

      // Numeric fields: convert via String()
      if (col === 'coordinateUncertaintyInMeters') {
        return record.coordinateUncertaintyInMeters !== undefined
          ? String(record.coordinateUncertaintyInMeters)
          : ''
      }
      if (col === 'individualCount') {
        return record.individualCount !== undefined
          ? String(record.individualCount)
          : ''
      }

      // All other fields: cast to string or empty
      const value = record[col as keyof PdsOccurrenceRecord]
      if (value === undefined || value === null) {
        return ''
      }
      return String(value)
    }).join(TAB)
  })

  return header + rows.join(NEWLINE) + NEWLINE
}
