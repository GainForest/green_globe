// meta.xml generator for Darwin Core Archive
// Generates the meta.xml descriptor file per the Darwin Core Text Guide:
// https://dwc.tdwg.org/text/

import { DWCA_ROW_TYPES, DWCA_TERM_URIS } from './types'

export type WriteMetaXmlOptions = {
  hasOccurrences: boolean
  hasMeasurements: boolean
  hasMultimedia: boolean
  occurrenceColumns: string[]
  measurementColumns: string[]
  multimediaColumns: string[]
}

/**
 * Generate the meta.xml descriptor for a Darwin Core Archive.
 * Returns a string with 2-space indentation, no trailing whitespace,
 * and no \r\n line endings.
 */
export function writeMetaXml(options: WriteMetaXmlOptions): string {
  const {
    hasOccurrences,
    hasMeasurements,
    hasMultimedia,
    occurrenceColumns,
    measurementColumns,
    multimediaColumns,
  } = options

  const lines: string[] = []

  lines.push("<?xml version='1.0' encoding='utf-8'?>")
  lines.push(
    "<archive xmlns='http://rs.tdwg.org/dwc/text/' metadata='eml.xml'>",
  )

  if (hasOccurrences) {
    lines.push(
      `  <core encoding='utf-8' fieldsTerminatedBy='\\t' linesTerminatedBy='\\n' fieldsEnclosedBy='' ignoreHeaderLines='1' rowType='${DWCA_ROW_TYPES.occurrence}'>`,
    )
    lines.push('    <files><location>occurrence.txt</location></files>')
    lines.push("    <id index='0'/>")

    // Declare all columns as fields (including index 0 = occurrenceID).
    // GBIF requires occurrenceID both as <id> AND as <field> for unique identification.
    for (let i = 0; i < occurrenceColumns.length; i++) {
      const col = occurrenceColumns[i]
      const termUri = DWCA_TERM_URIS[col]
      if (termUri !== undefined) {
        lines.push(`    <field index='${i}' term='${termUri}'/>`)
      }
    }

    lines.push('  </core>')
  } else {
    // Graceful fallback: empty archive element
    lines.push('</archive>')
    return lines.join('\n')
  }

  if (hasMeasurements) {
    lines.push(
      `  <extension encoding='utf-8' fieldsTerminatedBy='\\t' linesTerminatedBy='\\n' fieldsEnclosedBy='' ignoreHeaderLines='1' rowType='${DWCA_ROW_TYPES.measurement}'>`,
    )
    lines.push(
      '    <files><location>measurementOrFact.txt</location></files>',
    )
    lines.push("    <coreid index='0'/>")

    // measurementColumns[0] is 'coreid' (the linking column), fields start at index 1
    for (let i = 1; i < measurementColumns.length; i++) {
      const col = measurementColumns[i]
      const termUri = DWCA_TERM_URIS[col]
      if (termUri !== undefined) {
        lines.push(`    <field index='${i}' term='${termUri}'/>`)
      }
    }

    lines.push('  </extension>')
  }

  if (hasMultimedia) {
    lines.push(
      `  <extension encoding='utf-8' fieldsTerminatedBy='\\t' linesTerminatedBy='\\n' fieldsEnclosedBy='' ignoreHeaderLines='1' rowType='${DWCA_ROW_TYPES.multimedia}'>`,
    )
    lines.push('    <files><location>multimedia.txt</location></files>')
    lines.push("    <coreid index='0'/>")

    // multimediaColumns[0] is 'coreid' (the linking column), fields start at index 1
    for (let i = 1; i < multimediaColumns.length; i++) {
      const col = multimediaColumns[i]
      const termUri = DWCA_TERM_URIS[col]
      if (termUri !== undefined) {
        lines.push(`    <field index='${i}' term='${termUri}'/>`)
      }
    }

    lines.push('  </extension>')
  }

  lines.push('</archive>')

  return lines.join('\n')
}
