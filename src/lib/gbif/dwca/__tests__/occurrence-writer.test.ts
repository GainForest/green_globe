import { describe, expect, it } from 'vitest'
import { OCCURRENCE_TSV_COLUMNS } from '../types'
import {
  type PdsOccurrenceRecord,
  writeOccurrenceTsv,
} from '../occurrence-writer'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EXPECTED_HEADER = OCCURRENCE_TSV_COLUMNS.join('\t')

function parseLines(tsv: string): string[] {
  // Split on \n, drop trailing empty string from final \n
  const lines = tsv.split('\n')
  if (lines[lines.length - 1] === '') lines.pop()
  return lines
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('writeOccurrenceTsv', () => {
  // 1. Empty array returns header-only TSV
  it('empty array returns header-only TSV', () => {
    const result = writeOccurrenceTsv([])
    expect(result).toBe(EXPECTED_HEADER + '\n')
    const lines = parseLines(result)
    expect(lines).toHaveLength(1)
    expect(lines[0]).toBe(EXPECTED_HEADER)
  })

  // 2. Single record with all fields populated produces correct TSV row
  it('single record with all fields populated produces correct TSV row', () => {
    const record: PdsOccurrenceRecord = {
      occurrenceID: 'occ-001',
      basisOfRecord: 'HumanObservation',
      scientificName: 'Apis mellifera',
      vernacularName: 'Western honey bee',
      kingdom: 'Animalia',
      phylum: 'Arthropoda',
      class: 'Insecta',
      order: 'Hymenoptera',
      family: 'Apidae',
      genus: 'Apis',
      specificEpithet: 'mellifera',
      taxonRank: 'species',
      eventDate: '2024-06-15',
      decimalLatitude: '0.3476',
      decimalLongitude: '32.5825',
      geodeticDatum: 'WGS84',
      coordinateUncertaintyInMeters: 10,
      country: 'Uganda',
      countryCode: 'UG',
      stateProvince: 'Central',
      locality: 'Kampala',
      recordedBy: 'Jane Doe',
      datasetName: 'Bees and Trees Uganda',
      institutionCode: 'GainForest',
      associatedMedia: 'https://example.com/photo.jpg',
      occurrenceRemarks: 'Observed foraging',
      dynamicProperties: '{"count":3}',
      occurrenceStatus: 'present',
      individualCount: 3,
      sex: 'female',
      lifeStage: 'adult',
      habitat: 'forest',
      samplingProtocol: 'visual encounter',
    }

    const result = writeOccurrenceTsv([record])
    const lines = parseLines(result)

    expect(lines).toHaveLength(2)
    expect(lines[0]).toBe(EXPECTED_HEADER)

    const cells = lines[1].split('\t')
    expect(cells).toHaveLength(OCCURRENCE_TSV_COLUMNS.length)

    // Spot-check a few values
    const idx = (col: string) => OCCURRENCE_TSV_COLUMNS.indexOf(col)
    expect(cells[idx('occurrenceID')]).toBe('occ-001')
    expect(cells[idx('scientificName')]).toBe('Apis mellifera')
    expect(cells[idx('coordinateUncertaintyInMeters')]).toBe('10')
    expect(cells[idx('individualCount')]).toBe('3')
    expect(cells[idx('geodeticDatum')]).toBe('WGS84')
    expect(cells[idx('country')]).toBe('Uganda')
  })

  // 3. Record with missing optional fields produces correct empty cells
  it('record with missing optional fields produces empty cells', () => {
    const record: PdsOccurrenceRecord = {
      occurrenceID: 'occ-002',
      basisOfRecord: 'HumanObservation',
    }

    const result = writeOccurrenceTsv([record])
    const lines = parseLines(result)

    expect(lines).toHaveLength(2)
    const cells = lines[1].split('\t')
    expect(cells).toHaveLength(OCCURRENCE_TSV_COLUMNS.length)

    const idx = (col: string) => OCCURRENCE_TSV_COLUMNS.indexOf(col)
    expect(cells[idx('occurrenceID')]).toBe('occ-002')
    expect(cells[idx('basisOfRecord')]).toBe('HumanObservation')
    // Missing fields should be empty strings
    expect(cells[idx('scientificName')]).toBe('')
    expect(cells[idx('kingdom')]).toBe('')
    expect(cells[idx('decimalLatitude')]).toBe('')
    expect(cells[idx('individualCount')]).toBe('')
  })

  // 4. Numeric fields are stringified correctly
  it('numeric fields are stringified correctly', () => {
    const record: PdsOccurrenceRecord = {
      occurrenceID: 'occ-003',
      coordinateUncertaintyInMeters: 50,
      individualCount: 12,
    }

    const result = writeOccurrenceTsv([record])
    const lines = parseLines(result)
    const cells = lines[1].split('\t')

    const idx = (col: string) => OCCURRENCE_TSV_COLUMNS.indexOf(col)
    expect(cells[idx('coordinateUncertaintyInMeters')]).toBe('50')
    expect(cells[idx('individualCount')]).toBe('12')
  })

  // 5. geodeticDatum defaults to 'WGS84' when undefined
  it("geodeticDatum defaults to 'WGS84' when undefined", () => {
    const record: PdsOccurrenceRecord = {
      occurrenceID: 'occ-004',
      decimalLatitude: '1.0',
      decimalLongitude: '30.0',
      // geodeticDatum intentionally omitted
    }

    const result = writeOccurrenceTsv([record])
    const lines = parseLines(result)
    const cells = lines[1].split('\t')

    const idx = (col: string) => OCCURRENCE_TSV_COLUMNS.indexOf(col)
    expect(cells[idx('geodeticDatum')]).toBe('WGS84')
  })

  // 6. Multiple records produce multiple data rows
  it('multiple records produce multiple data rows', () => {
    const records: PdsOccurrenceRecord[] = [
      { occurrenceID: 'occ-010', scientificName: 'Species A' },
      { occurrenceID: 'occ-011', scientificName: 'Species B' },
      { occurrenceID: 'occ-012', scientificName: 'Species C' },
    ]

    const result = writeOccurrenceTsv(records)
    const lines = parseLines(result)

    // 1 header + 3 data rows
    expect(lines).toHaveLength(4)
    expect(lines[0]).toBe(EXPECTED_HEADER)

    const idx = (col: string) => OCCURRENCE_TSV_COLUMNS.indexOf(col)
    expect(lines[1].split('\t')[idx('occurrenceID')]).toBe('occ-010')
    expect(lines[2].split('\t')[idx('occurrenceID')]).toBe('occ-011')
    expect(lines[3].split('\t')[idx('occurrenceID')]).toBe('occ-012')
  })

  // 7. No 'undefined' or 'null' strings appear in output
  it("no 'undefined' or 'null' strings appear in output", () => {
    const records: PdsOccurrenceRecord[] = [
      { occurrenceID: 'occ-020' },
      { basisOfRecord: 'HumanObservation' },
      {},
    ]

    const result = writeOccurrenceTsv(records)
    expect(result).not.toContain('undefined')
    expect(result).not.toContain('null')
  })

  // 8. Output ends with a newline (including last line)
  it('output always ends with a newline', () => {
    expect(writeOccurrenceTsv([])).toMatch(/\n$/)
    expect(writeOccurrenceTsv([{ occurrenceID: 'x' }])).toMatch(/\n$/)
  })

  // 9. Output uses \n not \r\n
  it('output uses \\n line endings, not \\r\\n', () => {
    const result = writeOccurrenceTsv([{ occurrenceID: 'occ-030' }])
    expect(result).not.toContain('\r\n')
  })
})
