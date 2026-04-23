import { describe, expect, it, vi } from 'vitest'

import { MEASUREMENT_TSV_COLUMNS } from '../types'
import {
  type PdsMeasurementRecord,
  writeMeasurementTsv,
} from '../measurement-writer'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseRows(tsv: string): string[][] {
  return tsv
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => line.split('\t'))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('writeMeasurementTsv', () => {
  it('1. empty array returns header-only TSV', () => {
    const result = writeMeasurementTsv([], new Map())
    const rows = parseRows(result)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toEqual(MEASUREMENT_TSV_COLUMNS)
  })

  it('2. single measurement with occurrenceRef resolution produces correct coreid', () => {
    const uri = 'at://did:plc:abc123/app.gainforest.dwc.occurrence/mt001'
    const occurrenceUriToId = new Map([[uri, 'OCC-001']])
    const records: PdsMeasurementRecord[] = [
      {
        occurrenceRef: uri,
        measurementType: 'DBH',
        measurementValue: '42',
        measurementUnit: 'cm',
      },
    ]

    const result = writeMeasurementTsv(records, occurrenceUriToId)
    const rows = parseRows(result)

    expect(rows).toHaveLength(2)
    const dataRow = rows[1]
    const coreidIndex = MEASUREMENT_TSV_COLUMNS.indexOf('coreid')
    expect(dataRow[coreidIndex]).toBe('OCC-001')
  })

  it('3. fallback to occurrenceID when occurrenceRef not in map', () => {
    const uri = 'at://did:plc:abc123/app.gainforest.dwc.occurrence/mt002'
    // Map does NOT contain the uri
    const occurrenceUriToId = new Map<string, string>()
    const records: PdsMeasurementRecord[] = [
      {
        occurrenceRef: uri,
        occurrenceID: 'FALLBACK-ID',
        measurementType: 'Height',
        measurementValue: '10',
        measurementUnit: 'm',
      },
    ]

    const result = writeMeasurementTsv(records, occurrenceUriToId)
    const rows = parseRows(result)

    expect(rows).toHaveLength(2)
    const coreidIndex = MEASUREMENT_TSV_COLUMNS.indexOf('coreid')
    expect(rows[1][coreidIndex]).toBe('FALLBACK-ID')
  })

  it('4. record with neither occurrenceRef nor occurrenceID is skipped', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const records: PdsMeasurementRecord[] = [
      {
        measurementType: 'DBH',
        measurementValue: '30',
      },
    ]

    const result = writeMeasurementTsv(records, new Map())
    const rows = parseRows(result)

    // Only header row — the record was skipped
    expect(rows).toHaveLength(1)
    expect(warnSpy).toHaveBeenCalledOnce()

    warnSpy.mockRestore()
  })

  it('5. multiple measurements for same occurrence produce multiple rows with same coreid', () => {
    const uri = 'at://did:plc:abc123/app.gainforest.dwc.occurrence/mt003'
    const occurrenceUriToId = new Map([[uri, 'OCC-003']])
    const records: PdsMeasurementRecord[] = [
      { occurrenceRef: uri, measurementType: 'DBH', measurementValue: '25' },
      { occurrenceRef: uri, measurementType: 'Height', measurementValue: '8' },
      { occurrenceRef: uri, measurementType: 'Crown', measurementValue: '3' },
    ]

    const result = writeMeasurementTsv(records, occurrenceUriToId)
    const rows = parseRows(result)

    expect(rows).toHaveLength(4) // header + 3 data rows
    const coreidIndex = MEASUREMENT_TSV_COLUMNS.indexOf('coreid')
    expect(rows[1][coreidIndex]).toBe('OCC-003')
    expect(rows[2][coreidIndex]).toBe('OCC-003')
    expect(rows[3][coreidIndex]).toBe('OCC-003')
  })

  it('6. all measurement fields populate correctly', () => {
    const uri = 'at://did:plc:abc123/app.gainforest.dwc.occurrence/mt004'
    const occurrenceUriToId = new Map([[uri, 'OCC-004']])
    const record: PdsMeasurementRecord = {
      occurrenceRef: uri,
      measurementID: 'MEAS-001',
      measurementType: 'DBH',
      measurementValue: '55.3',
      measurementUnit: 'cm',
      measurementAccuracy: '0.1',
      measurementDeterminedBy: 'Jane Doe',
      measurementDeterminedDate: '2024-06-15',
      measurementMethod: 'Tape measure',
      measurementRemarks: 'Measured at breast height',
    }

    const result = writeMeasurementTsv([record], occurrenceUriToId)
    const rows = parseRows(result)

    expect(rows).toHaveLength(2)
    const dataRow = rows[1]

    const idx = (col: string) => MEASUREMENT_TSV_COLUMNS.indexOf(col)
    expect(dataRow[idx('coreid')]).toBe('OCC-004')
    expect(dataRow[idx('measurementID')]).toBe('MEAS-001')
    expect(dataRow[idx('measurementType')]).toBe('DBH')
    expect(dataRow[idx('measurementValue')]).toBe('55.3')
    expect(dataRow[idx('measurementUnit')]).toBe('cm')
    expect(dataRow[idx('measurementAccuracy')]).toBe('0.1')
    expect(dataRow[idx('measurementDeterminedBy')]).toBe('Jane Doe')
    expect(dataRow[idx('measurementDeterminedDate')]).toBe('2024-06-15')
    expect(dataRow[idx('measurementMethod')]).toBe('Tape measure')
    expect(dataRow[idx('measurementRemarks')]).toBe('Measured at breast height')
  })

  it('8. handles new-format bundled measurement records (flattened by fetcher)', () => {
    // The fetcher flattens bundles into PdsMeasurementRecord[] before they reach the writer,
    // so this test verifies the flattened output is correctly written to TSV.
    const uri = 'at://did:plc:abc123/app.gainforest.dwc.occurrence/mt006'
    const occurrenceUriToId = new Map([[uri, 'OCC-006']])
    const records: PdsMeasurementRecord[] = [
      {
        occurrenceRef: uri,
        measurementType: 'DBH',
        measurementValue: '45.2',
        measurementUnit: 'cm',
        measurementDeterminedBy: 'Jane Doe',
        measurementDeterminedDate: '2024-06-15',
        measurementMethod: 'Tape measure',
      },
      {
        occurrenceRef: uri,
        measurementType: 'tree height',
        measurementValue: '18.5',
        measurementUnit: 'm',
        measurementDeterminedBy: 'Jane Doe',
        measurementDeterminedDate: '2024-06-15',
        measurementMethod: 'Tape measure',
      },
    ]

    const result = writeMeasurementTsv(records, occurrenceUriToId)
    const rows = parseRows(result)

    // header + 2 data rows
    expect(rows).toHaveLength(3)

    const idx = (col: string) => MEASUREMENT_TSV_COLUMNS.indexOf(col)
    const coreidIndex = idx('coreid')

    // Both rows resolve to the same occurrence
    expect(rows[1][coreidIndex]).toBe('OCC-006')
    expect(rows[2][coreidIndex]).toBe('OCC-006')

    // First row: DBH
    expect(rows[1][idx('measurementType')]).toBe('DBH')
    expect(rows[1][idx('measurementValue')]).toBe('45.2')
    expect(rows[1][idx('measurementUnit')]).toBe('cm')
    expect(rows[1][idx('measurementDeterminedBy')]).toBe('Jane Doe')
    expect(rows[1][idx('measurementDeterminedDate')]).toBe('2024-06-15')
    expect(rows[1][idx('measurementMethod')]).toBe('Tape measure')

    // Second row: tree height
    expect(rows[2][idx('measurementType')]).toBe('tree height')
    expect(rows[2][idx('measurementValue')]).toBe('18.5')
    expect(rows[2][idx('measurementUnit')]).toBe('m')
  })

  it('7. no "undefined" or "null" strings appear in output', () => {
    const uri = 'at://did:plc:abc123/app.gainforest.dwc.occurrence/mt005'
    const occurrenceUriToId = new Map([[uri, 'OCC-005']])
    // Only provide a few fields — rest are undefined
    const records: PdsMeasurementRecord[] = [
      {
        occurrenceRef: uri,
        measurementType: 'DBH',
        // measurementValue, measurementUnit, etc. are all undefined
      },
    ]

    const result = writeMeasurementTsv(records, occurrenceUriToId)

    expect(result).not.toContain('undefined')
    expect(result).not.toContain('null')
  })
})
