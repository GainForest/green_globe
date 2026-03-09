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
 * Uses the GBIF-validated license pattern (ulink + citetitle structure).
 */
export function writeEmlXml(input: DwcaEmlInput): string {
  const packageId = input.datasetId ?? crypto.randomUUID()
  const pubDate =
    input.pubDate ?? new Date().toISOString().slice(0, 10)
  const language = input.language ?? 'eng'

  const licenseUrl = GBIF_LICENSES[input.license]
  const licenseTitle = GBIF_LICENSE_TITLES[input.license]

  // Keywords section — always include 'Occurrence' as default
  const allKeywords = ['Occurrence', ...(input.keywords ?? [])]
  const keywordsXml = allKeywords
    .map((kw) => `      <keyword>${escapeXml(kw)}</keyword>`)
    .join('\n')

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
<eml:eml xmlns:eml='https://eml.ecoinformatics.org/eml-2.1.1'
         xmlns:dc='http://purl.org/dc/terms/'
         xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance'
         xsi:schemaLocation='https://eml.ecoinformatics.org/eml-2.1.1 https://eml.ecoinformatics.org/eml.xsd'
         packageId='${escapeXml(packageId)}' system='http://gbif.org' scope='system'>
  <dataset>
    <title xml:lang='eng'>${escapeXml(input.datasetTitle)}</title>
    <creator>
      <organizationName>${escapeXml(input.organizationName)}</organizationName>
    </creator>
    <metadataProvider>
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
      <organizationName>${escapeXml(input.organizationName)}</organizationName>
      <electronicMailAddress>${escapeXml(input.contactEmail)}</electronicMailAddress>
    </contact>
  </dataset>
</eml:eml>`
}
