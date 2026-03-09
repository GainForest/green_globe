import { describe, it, expect } from 'vitest'
import { writeEmlXml, escapeXml } from '../eml-writer'
import type { DwcaEmlInput } from '../types'

const minimalInput: DwcaEmlInput = {
  datasetTitle: 'Test Dataset',
  abstract: 'A test dataset abstract.',
  license: 'CC-BY',
  organizationName: 'Test Org',
  contactEmail: 'contact@test.org',
  contactName: 'Test Contact',
}

describe('writeEmlXml', () => {
  it('1. minimal input produces valid EML structure', () => {
    const result = writeEmlXml(minimalInput)

    expect(result).toContain("xmlns:eml='https://eml.ecoinformatics.org/eml-2.1.1'")
    expect(result).toContain("<title xml:lang='eng'>Test Dataset</title>")
    expect(result).toContain('<organizationName>Test Org</organizationName>')
    expect(result).toContain('<para>A test dataset abstract.</para>')
    expect(result).toContain('<electronicMailAddress>contact@test.org</electronicMailAddress>')
    expect(result).toContain("system='http://gbif.org'")
    expect(result).toContain("scope='system'")
    expect(result).toContain('<language>eng</language>')
    expect(result.startsWith("<?xml version='1.0' encoding='utf-8'?>")).toBe(true)
  })

  it('2. CC0 license produces correct ulink URL and citetitle', () => {
    const input: DwcaEmlInput = { ...minimalInput, license: 'CC0' }
    const result = writeEmlXml(input)

    expect(result).toContain(
      "<ulink url='http://creativecommons.org/publicdomain/zero/1.0/legalcode'><citetitle>Creative Commons Public Domain (CC0 1.0) License</citetitle></ulink>"
    )
  })

  it('3. CC-BY license produces correct ulink URL and citetitle', () => {
    const result = writeEmlXml(minimalInput)

    expect(result).toContain(
      "<ulink url='http://creativecommons.org/licenses/by/4.0/legalcode'><citetitle>Creative Commons Attribution (CC-BY) 4.0 License</citetitle></ulink>"
    )
  })

  it('3b. CC-BY-NC license produces correct ulink URL and citetitle', () => {
    const input: DwcaEmlInput = { ...minimalInput, license: 'CC-BY-NC' }
    const result = writeEmlXml(input)

    expect(result).toContain(
      "<ulink url='http://creativecommons.org/licenses/by-nc/4.0/legalcode'><citetitle>Creative Commons Attribution Non Commercial (CC-BY-NC) 4.0 License</citetitle></ulink>"
    )
  })

  it('4. geographic coverage included when all 4 bounds provided', () => {
    const input: DwcaEmlInput = {
      ...minimalInput,
      westBound: -10,
      eastBound: 10,
      northBound: 5,
      southBound: -5,
    }
    const result = writeEmlXml(input)

    expect(result).toContain('<geographicCoverage>')
    expect(result).toContain('<westBoundingCoordinate>-10</westBoundingCoordinate>')
    expect(result).toContain('<eastBoundingCoordinate>10</eastBoundingCoordinate>')
    expect(result).toContain('<northBoundingCoordinate>5</northBoundingCoordinate>')
    expect(result).toContain('<southBoundingCoordinate>-5</southBoundingCoordinate>')
    expect(result).toContain('<geographicDescription>Bounding box of occurrence records</geographicDescription>')
  })

  it('5. geographic coverage omitted when bounds are missing', () => {
    // Only 3 bounds — should not include geo coverage
    const input: DwcaEmlInput = {
      ...minimalInput,
      westBound: -10,
      eastBound: 10,
      northBound: 5,
      // southBound missing
    }
    const result = writeEmlXml(input)

    expect(result).not.toContain('<geographicCoverage>')
    expect(result).not.toContain('<boundingCoordinates>')
  })

  it('5b. geographic coverage omitted when no bounds provided', () => {
    const result = writeEmlXml(minimalInput)

    expect(result).not.toContain('<geographicCoverage>')
  })

  it('6. temporal coverage included when both dates provided', () => {
    const input: DwcaEmlInput = {
      ...minimalInput,
      startDate: '2020-01-01',
      endDate: '2023-12-31',
    }
    const result = writeEmlXml(input)

    expect(result).toContain('<temporalCoverage>')
    expect(result).toContain('<rangeOfDates>')
    expect(result).toContain('<calendarDate>2020-01-01</calendarDate>')
    expect(result).toContain('<calendarDate>2023-12-31</calendarDate>')
  })

  it('7. temporal coverage omitted when dates missing', () => {
    // Only startDate — should not include temporal coverage
    const input: DwcaEmlInput = {
      ...minimalInput,
      startDate: '2020-01-01',
      // endDate missing
    }
    const result = writeEmlXml(input)

    expect(result).not.toContain('<temporalCoverage>')
    expect(result).not.toContain('<rangeOfDates>')
  })

  it('8. special characters are escaped in text content', () => {
    const input: DwcaEmlInput = {
      ...minimalInput,
      datasetTitle: 'Trees & Bees <Uganda>',
      abstract: 'Data with "quotes" and & ampersands.',
      organizationName: "O'Reilly Org",
    }
    const result = writeEmlXml(input)

    expect(result).toContain('Trees &amp; Bees &lt;Uganda&gt;')
    expect(result).toContain('Data with &quot;quotes&quot; and &amp; ampersands.')
    expect(result).toContain("O&apos;Reilly Org")
  })

  it('9. keywords are included when provided', () => {
    const input: DwcaEmlInput = {
      ...minimalInput,
      keywords: ['biodiversity', 'trees', 'Uganda'],
    }
    const result = writeEmlXml(input)

    expect(result).toContain('<keyword>Occurrence</keyword>')
    expect(result).toContain('<keyword>biodiversity</keyword>')
    expect(result).toContain('<keyword>trees</keyword>')
    expect(result).toContain('<keyword>Uganda</keyword>')
    expect(result).toContain('<keywordSet>')
  })

  it('9b. Occurrence keyword always included even without extra keywords', () => {
    const result = writeEmlXml(minimalInput)

    expect(result).toContain('<keyword>Occurrence</keyword>')
    expect(result).toContain('<keywordSet>')
  })
})

describe('escapeXml', () => {
  it('escapes & to &amp;', () => {
    expect(escapeXml('a & b')).toBe('a &amp; b')
  })

  it('escapes < to &lt;', () => {
    expect(escapeXml('a < b')).toBe('a &lt; b')
  })

  it('escapes > to &gt;', () => {
    expect(escapeXml('a > b')).toBe('a &gt; b')
  })

  it("escapes ' to &apos;", () => {
    expect(escapeXml("it's")).toBe('it&apos;s')
  })

  it('escapes " to &quot;', () => {
    expect(escapeXml('"quoted"')).toBe('&quot;quoted&quot;')
  })

  it('handles strings with no special characters', () => {
    expect(escapeXml('hello world')).toBe('hello world')
  })

  it('handles multiple special characters', () => {
    expect(escapeXml('a & b < c > d')).toBe('a &amp; b &lt; c &gt; d')
  })
})
