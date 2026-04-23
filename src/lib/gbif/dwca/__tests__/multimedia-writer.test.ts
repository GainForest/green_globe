import { describe, it, expect } from 'vitest'
import { writeMultimediaTsv } from '../multimedia-writer'
import type { PdsMultimediaRecord } from '../multimedia-writer'
import { MULTIMEDIA_TSV_COLUMNS } from '../types'

const HEADER = MULTIMEDIA_TSV_COLUMNS.join('\t')

const BASE_OPTIONS = {
  pdsEndpoint: 'https://climateai.org',
  orgDid: 'did:plc:abc123',
}

describe('writeMultimediaTsv', () => {
  it('empty array returns header-only TSV', () => {
    const result = writeMultimediaTsv([], new Map(), BASE_OPTIONS)
    expect(result).toBe(HEADER + '\n')
  })

  it('record with accessUri uses it as identifier', () => {
    const records: PdsMultimediaRecord[] = [
      {
        accessUri: 'https://example.com/photo.jpg',
        format: 'image/jpeg',
      },
    ]
    const result = writeMultimediaTsv(records, new Map(), BASE_OPTIONS)
    const lines = result.split('\n').filter(Boolean)
    expect(lines).toHaveLength(2)
    const dataLine = lines[1]
    const cols = dataLine.split('\t')
    // identifier is column index 1
    const identifierIdx = MULTIMEDIA_TSV_COLUMNS.indexOf('identifier')
    expect(cols[identifierIdx]).toBe('https://example.com/photo.jpg')
  })

  it('record with PDS blob ref builds correct blob URL', () => {
    const records: PdsMultimediaRecord[] = [
      {
        file: {
          ref: { $link: 'bafyreiabc123' },
          mimeType: 'image/jpeg',
        },
      },
    ]
    const result = writeMultimediaTsv(records, new Map(), BASE_OPTIONS)
    const lines = result.split('\n').filter(Boolean)
    expect(lines).toHaveLength(2)
    const cols = lines[1].split('\t')
    const identifierIdx = MULTIMEDIA_TSV_COLUMNS.indexOf('identifier')
    const expectedUrl =
      'https://climateai.org/xrpc/com.atproto.sync.getBlob?did=did%3Aplc%3Aabc123&cid=bafyreiabc123'
    expect(cols[identifierIdx]).toBe(expectedUrl)
  })

  it('record with neither accessUri nor file.ref is skipped', () => {
    const records: PdsMultimediaRecord[] = [
      {
        format: 'image/jpeg',
        caption: 'A photo with no URL',
      },
    ]
    const result = writeMultimediaTsv(records, new Map(), BASE_OPTIONS)
    // Only header line
    expect(result).toBe(HEADER + '\n')
  })

  it('coreid resolution from occurrenceRef works correctly', () => {
    const occurrenceUri = 'at://did:plc:abc123/app.gainforest.dwc.occurrence/rkey1'
    const occurrenceId = 'occ-001'
    const occurrenceUriToId = new Map([[occurrenceUri, occurrenceId]])

    const records: PdsMultimediaRecord[] = [
      {
        occurrenceRef: occurrenceUri,
        accessUri: 'https://example.com/photo.jpg',
      },
    ]
    const result = writeMultimediaTsv(records, occurrenceUriToId, BASE_OPTIONS)
    const lines = result.split('\n').filter(Boolean)
    const cols = lines[1].split('\t')
    const coreidIdx = MULTIMEDIA_TSV_COLUMNS.indexOf('coreid')
    expect(cols[coreidIdx]).toBe(occurrenceId)
  })

  it('subjectPart maps to readable title when caption is missing', () => {
    const records: PdsMultimediaRecord[] = [
      {
        accessUri: 'https://example.com/leaf.jpg',
        subjectPart: 'leaf',
      },
      {
        accessUri: 'https://example.com/bark.jpg',
        subjectPart: 'bark',
      },
      {
        accessUri: 'https://example.com/tree.jpg',
        subjectPart: 'entireOrganism',
      },
    ]
    const result = writeMultimediaTsv(records, new Map(), BASE_OPTIONS)
    const lines = result.split('\n').filter(Boolean)
    const titleIdx = MULTIMEDIA_TSV_COLUMNS.indexOf('title')

    expect(lines[1].split('\t')[titleIdx]).toBe('Leaf photograph')
    expect(lines[2].split('\t')[titleIdx]).toBe('Bark photograph')
    expect(lines[3].split('\t')[titleIdx]).toBe('Tree photograph')
  })

  it('MIME type determines dcterms:type correctly', () => {
    const records: PdsMultimediaRecord[] = [
      {
        accessUri: 'https://example.com/photo.jpg',
        format: 'image/jpeg',
      },
      {
        accessUri: 'https://example.com/clip.mp4',
        format: 'video/mp4',
      },
      {
        accessUri: 'https://example.com/sound.mp3',
        format: 'audio/mpeg',
      },
    ]
    const result = writeMultimediaTsv(records, new Map(), BASE_OPTIONS)
    const lines = result.split('\n').filter(Boolean)
    const typeIdx = MULTIMEDIA_TSV_COLUMNS.indexOf('type')

    expect(lines[1].split('\t')[typeIdx]).toBe('StillImage')
    expect(lines[2].split('\t')[typeIdx]).toBe('MovingImage')
    expect(lines[3].split('\t')[typeIdx]).toBe('Sound')
  })

  it('defaultLicense populates the license column', () => {
    const records: PdsMultimediaRecord[] = [
      {
        accessUri: 'https://example.com/photo.jpg',
      },
    ]
    const options = {
      ...BASE_OPTIONS,
      defaultLicense: 'http://creativecommons.org/licenses/by/4.0/legalcode',
    }
    const result = writeMultimediaTsv(records, new Map(), options)
    const lines = result.split('\n').filter(Boolean)
    const licenseIdx = MULTIMEDIA_TSV_COLUMNS.indexOf('license')
    expect(lines[1].split('\t')[licenseIdx]).toBe(
      'http://creativecommons.org/licenses/by/4.0/legalcode',
    )
  })
})
