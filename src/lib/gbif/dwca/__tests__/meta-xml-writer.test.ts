import { describe, it, expect } from 'vitest'
import { writeMetaXml } from '../meta-xml-writer'
import {
  OCCURRENCE_TSV_COLUMNS,
  MEASUREMENT_TSV_COLUMNS,
  MULTIMEDIA_TSV_COLUMNS,
  DWCA_ROW_TYPES,
  DWCA_TERM_URIS,
} from '../types'

const fullOptions = {
  hasOccurrences: true,
  hasMeasurements: true,
  hasMultimedia: true,
  occurrenceColumns: OCCURRENCE_TSV_COLUMNS,
  measurementColumns: MEASUREMENT_TSV_COLUMNS,
  multimediaColumns: MULTIMEDIA_TSV_COLUMNS,
}

describe('writeMetaXml', () => {
  // Test 1: Full archive with all three sections
  it('generates a full archive with occurrence core + measurement + multimedia extensions', () => {
    const xml = writeMetaXml(fullOptions)

    expect(xml).toContain('<core')
    expect(xml).toContain(DWCA_ROW_TYPES.occurrence)
    expect(xml).toContain('<files><location>occurrence.txt</location></files>')

    expect(xml).toContain('<extension')
    expect(xml).toContain(DWCA_ROW_TYPES.measurement)
    expect(xml).toContain(
      '<files><location>measurementOrFact.txt</location></files>',
    )

    expect(xml).toContain(DWCA_ROW_TYPES.multimedia)
    expect(xml).toContain('<files><location>multimedia.txt</location></files>')
  })

  // Test 2: Archive with only occurrence (no extensions)
  it('generates archive with only occurrence core when both extension flags are false', () => {
    const xml = writeMetaXml({
      ...fullOptions,
      hasMeasurements: false,
      hasMultimedia: false,
    })

    expect(xml).toContain('<core')
    expect(xml).toContain(DWCA_ROW_TYPES.occurrence)
    expect(xml).not.toContain('<extension')
    expect(xml).not.toContain(DWCA_ROW_TYPES.measurement)
    expect(xml).not.toContain(DWCA_ROW_TYPES.multimedia)
  })

  // Test 3: Archive with occurrence + measurement only
  it('generates archive with occurrence core and measurement extension only', () => {
    const xml = writeMetaXml({
      ...fullOptions,
      hasMeasurements: true,
      hasMultimedia: false,
    })

    expect(xml).toContain('<core')
    expect(xml).toContain(DWCA_ROW_TYPES.occurrence)
    expect(xml).toContain(DWCA_ROW_TYPES.measurement)
    expect(xml).not.toContain(DWCA_ROW_TYPES.multimedia)
    expect(xml).not.toContain('<files><location>multimedia.txt</location></files>')
  })

  // Test 4: Correct field indices for each column
  it('assigns correct field indices starting at 1 for non-id columns', () => {
    const xml = writeMetaXml({
      ...fullOptions,
      hasMeasurements: false,
      hasMultimedia: false,
    })

    // occurrenceColumns[0] = 'occurrenceID' → <id index='0'/>
    // occurrenceColumns[1] = 'basisOfRecord' → <field index='1' .../>
    // occurrenceColumns[2] = 'eventDate' → <field index='2' .../>
    expect(xml).toContain("<id index='0'/>")
    expect(xml).toContain(
      `<field index='1' term='${DWCA_TERM_URIS['basisOfRecord']}'/>`,
    )
    expect(xml).toContain(
      `<field index='2' term='${DWCA_TERM_URIS['eventDate']}'/>`,
    )

    // Verify measurement extension indices when enabled
    const xmlWithMeasurement = writeMetaXml({
      ...fullOptions,
      hasMeasurements: true,
      hasMultimedia: false,
    })
    // measurementColumns[0] = 'coreid' → <coreid index='0'/>
    // measurementColumns[1] = 'measurementID' → <field index='1' .../>
    expect(xmlWithMeasurement).toContain("<coreid index='0'/>")
    expect(xmlWithMeasurement).toContain(
      `<field index='1' term='${DWCA_TERM_URIS['measurementID']}'/>`,
    )
  })

  // Test 5: Output contains valid XML declaration
  it("starts with the XML declaration <?xml version='1.0' encoding='utf-8'?>", () => {
    const xml = writeMetaXml(fullOptions)
    expect(xml.startsWith("<?xml version='1.0' encoding='utf-8'?>")).toBe(true)
  })

  // Test 6: Core uses <id> element, extensions use <coreid> element
  it('uses <id> in core and <coreid> in extensions', () => {
    const xml = writeMetaXml(fullOptions)

    // Core section should have <id index='0'/>
    expect(xml).toContain("<id index='0'/>")

    // Extension sections should have <coreid index='0'/>
    // Count occurrences — should appear twice (measurement + multimedia)
    const coreidMatches = xml.match(/<coreid index='0'\/>/g)
    expect(coreidMatches).not.toBeNull()
    expect(coreidMatches!.length).toBe(2)

    // Core should NOT use <coreid>
    const coreSection = xml.split('<extension')[0]
    expect(coreSection).not.toContain('<coreid')
  })

  // Test 7: Extensions omitted when their flag is false
  it('omits measurement extension when hasMeasurements is false', () => {
    const xml = writeMetaXml({
      ...fullOptions,
      hasMeasurements: false,
      hasMultimedia: true,
    })

    expect(xml).not.toContain(DWCA_ROW_TYPES.measurement)
    expect(xml).not.toContain('measurementOrFact.txt')
    expect(xml).toContain(DWCA_ROW_TYPES.multimedia)
  })

  it('omits multimedia extension when hasMultimedia is false', () => {
    const xml = writeMetaXml({
      ...fullOptions,
      hasMeasurements: true,
      hasMultimedia: false,
    })

    expect(xml).not.toContain(DWCA_ROW_TYPES.multimedia)
    expect(xml).not.toContain('multimedia.txt')
    expect(xml).toContain(DWCA_ROW_TYPES.measurement)
  })

  // Additional: graceful handling when hasOccurrences is false
  it('returns an empty archive element when hasOccurrences is false', () => {
    const xml = writeMetaXml({
      ...fullOptions,
      hasOccurrences: false,
    })

    expect(xml).toContain('<archive')
    expect(xml).toContain('</archive>')
    expect(xml).not.toContain('<core')
    expect(xml).not.toContain('<extension')
  })

  // Additional: no \r\n line endings
  it('does not contain \\r\\n line endings', () => {
    const xml = writeMetaXml(fullOptions)
    expect(xml).not.toContain('\r\n')
    expect(xml).not.toContain('\r')
  })

  // Additional: 'coreid' column itself is not emitted as a <field> element
  it('does not emit a <field> element for the coreid column', () => {
    const xml = writeMetaXml(fullOptions)
    // coreid has no entry in DWCA_TERM_URIS, so it should never appear as a field term
    expect(xml).not.toContain("term='coreid'")
    // The only reference to coreid should be the <coreid index='0'/> element
    const fieldCoreidMatches = xml.match(/term='[^']*coreid[^']*'/g)
    expect(fieldCoreidMatches).toBeNull()
  })
})
