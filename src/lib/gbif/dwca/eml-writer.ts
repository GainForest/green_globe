import type { DwcaEmlInput } from './types'
import { GBIF_LICENSES, GBIF_LICENSE_TITLES } from './types'

/**
 * Escapes XML special characters in text content.
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&apos;')
    .replace(/"/g, '&quot;')
}

/**
 * Generates the eml.xml metadata file for a Darwin Core Archive.
 * Uses the GBIF EML profile 1.2 schema and validated license pattern
 * (ulink + citetitle structure).
 */
export function writeEmlXml(input: DwcaEmlInput): string {
  const packageId = input.datasetId ?? crypto.randomUUID()
  const pubDate =
    input.pubDate ?? new Date().toISOString().slice(0, 10)
  const language = input.language ?? 'eng'

  const licenseUrl = GBIF_LICENSES[input.license]
  const licenseTitle = GBIF_LICENSE_TITLES[input.license]

  // Parse contact name into given/surname for EML individualName
  const nameParts = input.contactName.trim().split(/\s+/)
  const surName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : input.contactName
  const givenName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : ''

  // Keywords section — always include 'Occurrence' as default
  const allKeywords = ['Occurrence', ...(input.keywords ?? [])]
  const keywordsXml = allKeywords
    .map((kw) => `      <keyword>${escapeXml(kw)}</keyword>`)
    .join('\n') + '\n      <keywordThesaurus>GBIF Dataset Type Vocabulary: http://rs.gbif.org/vocabulary/gbif/dataset_type_2015-07-10.xml</keywordThesaurus>'

  // Geographic coverage — only if all 4 bounds provided
  const hasGeoBounds =
    input.westBound !== undefined &&
    input.eastBound !== undefined &&
    input.northBound !== undefined &&
    input.southBound !== undefined

  const geoCoverageXml = hasGeoBounds
    ? `      <geographicCoverage>
        <geographicDescription>Bounding box of occurrence records</geographicDescription>
        <boundingCoordinates>
          <westBoundingCoordinate>${input.westBound}</westBoundingCoordinate>
          <eastBoundingCoordinate>${input.eastBound}</eastBoundingCoordinate>
          <northBoundingCoordinate>${input.northBound}</northBoundingCoordinate>
          <southBoundingCoordinate>${input.southBound}</southBoundingCoordinate>
        </boundingCoordinates>
      </geographicCoverage>`
    : ''

  // Temporal coverage — only if both dates provided
  const hasTemporalCoverage =
    input.startDate !== undefined && input.endDate !== undefined

  const temporalCoverageXml = hasTemporalCoverage
    ? `      <temporalCoverage>
        <rangeOfDates>
          <beginDate><calendarDate>${escapeXml(input.startDate!)}</calendarDate></beginDate>
          <endDate><calendarDate>${escapeXml(input.endDate!)}</calendarDate></endDate>
        </rangeOfDates>
      </temporalCoverage>`
    : ''

  const hasCoverage = hasGeoBounds || hasTemporalCoverage
  const coverageXml = hasCoverage
    ? `    <coverage>
${[geoCoverageXml, temporalCoverageXml].filter(Boolean).join('\n')}
    </coverage>`
    : ''

  return `<?xml version='1.0' encoding='utf-8'?>
<eml:eml xmlns:eml='eml://ecoinformatics.org/eml-2.1.1'
         xmlns:dc='http://purl.org/dc/terms/'
         xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance'
         xsi:schemaLocation='eml://ecoinformatics.org/eml-2.1.1 http://rs.gbif.org/schema/eml-gbif-profile/1.2/eml.xsd'
         packageId='${escapeXml(packageId)}' system='http://gbif.org' scope='system'>
  <dataset>
    <title xml:lang='eng'>${escapeXml(input.datasetTitle)}</title>
    <creator>
      <individualName>
        <givenName>${escapeXml(givenName)}</givenName>
        <surName>${escapeXml(surName)}</surName>
      </individualName>
      <organizationName>${escapeXml(input.organizationName)}</organizationName>
    </creator>
    <metadataProvider>
      <individualName>
        <givenName>${escapeXml(givenName)}</givenName>
        <surName>${escapeXml(surName)}</surName>
      </individualName>
      <organizationName>${escapeXml(input.organizationName)}</organizationName>
    </metadataProvider>
    <pubDate>${escapeXml(pubDate)}</pubDate>
    <language>${escapeXml(language)}</language>
    <abstract><para>${escapeXml(input.abstract)}</para></abstract>
    <keywordSet>
${keywordsXml}
    </keywordSet>
    <intellectualRights>
      <para>
        This work is licensed under a
        <ulink url='${licenseUrl}'><citetitle>${escapeXml(licenseTitle)}</citetitle></ulink>.
      </para>
    </intellectualRights>
${coverageXml ? coverageXml + '\n' : ''}    <contact>
      <individualName>
        <givenName>${escapeXml(givenName)}</givenName>
        <surName>${escapeXml(surName)}</surName>
      </individualName>
      <organizationName>${escapeXml(input.organizationName)}</organizationName>
      <electronicMailAddress>${escapeXml(input.contactEmail)}</electronicMailAddress>
    </contact>
  </dataset>
</eml:eml>`
}
