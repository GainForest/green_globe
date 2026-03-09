// Multimedia TSV writer for Darwin Core Archives
// Pure function — no network calls, no external dependencies

import { MULTIMEDIA_TSV_COLUMNS, TAB, NEWLINE } from './types'

// ---------------------------------------------------------------------------
// Input type
// ---------------------------------------------------------------------------

export type PdsMultimediaRecord = {
  /** AT-URI of the linked dwc.occurrence record */
  occurrenceRef?: string
  /** Audubon Core subjectPart (entireOrganism, leaf, bark, etc.) */
  subjectPart?: string
  /** PDS blob reference */
  file?: { ref?: { $link?: string } | string; mimeType?: string }
  /** External URL to original full-res media */
  accessUri?: string
  /** MIME type */
  format?: string
  /** Human-readable caption */
  caption?: string
  /** Creator name */
  creator?: string
  /** ISO datetime when media was captured */
  createDate?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract CID string from a blob ref (string or { $link } object). */
function extractCid(ref: { $link?: string } | string | undefined): string | undefined {
  if (ref === undefined) return undefined
  if (typeof ref === 'string') return ref
  return ref.$link
}

/** Map a MIME type to a dcterms:type value. */
function mimeToType(mime: string | undefined): 'StillImage' | 'MovingImage' | 'Sound' {
  if (!mime) return 'StillImage'
  if (mime.startsWith('image/')) return 'StillImage'
  if (mime.startsWith('video/')) return 'MovingImage'
  if (mime.startsWith('audio/')) return 'Sound'
  return 'StillImage'
}

/** Map a subjectPart value to a human-readable title. */
function subjectPartToTitle(subjectPart: string | undefined): string {
  if (!subjectPart) return ''
  switch (subjectPart) {
    case 'leaf':
      return 'Leaf photograph'
    case 'bark':
      return 'Bark photograph'
    case 'entireOrganism':
      return 'Tree photograph'
    default:
      // Capitalise first letter and append ' photograph'
      return `${subjectPart.charAt(0).toUpperCase()}${subjectPart.slice(1)} photograph`
  }
}

// ---------------------------------------------------------------------------
// Main writer
// ---------------------------------------------------------------------------

/**
 * Transform PDS AC multimedia records into a tab-separated multimedia.txt
 * string for Darwin Core Archives.
 */
export function writeMultimediaTsv(
  records: PdsMultimediaRecord[],
  occurrenceUriToId: Map<string, string>,
  options: { pdsEndpoint: string; orgDid: string; defaultLicense?: string },
): string {
  const header = MULTIMEDIA_TSV_COLUMNS.join(TAB)
  const lines: string[] = [header]

  for (const record of records) {
    // Resolve coreid from occurrenceRef
    const coreid = record.occurrenceRef
      ? (occurrenceUriToId.get(record.occurrenceRef) ?? '')
      : ''

    // Resolve identifier (media URL)
    let identifier: string | undefined

    if (record.accessUri) {
      identifier = record.accessUri
    } else if (record.file?.ref !== undefined) {
      const cid = extractCid(record.file.ref)
      if (cid) {
        const params = new URLSearchParams({ did: options.orgDid, cid })
        identifier = `${options.pdsEndpoint}/xrpc/com.atproto.sync.getBlob?${params.toString()}`
      }
    }

    // Skip records with no resolvable media identifier
    if (!identifier) continue

    // Determine MIME type and dcterms:type
    const mimeType = record.format ?? record.file?.mimeType
    const dcType = mimeToType(mimeType)

    // Determine title: prefer caption, fall back to subjectPart mapping
    const title = record.caption ?? subjectPartToTitle(record.subjectPart)

    // Build the row in column order
    const row: Record<string, string> = {
      coreid,
      identifier,
      type: dcType,
      format: mimeType ?? '',
      title,
      description: '',
      created: record.createDate ?? '',
      creator: record.creator ?? '',
      license: options.defaultLicense ?? '',
      rightsHolder: '',
      publisher: '',
    }

    lines.push(MULTIMEDIA_TSV_COLUMNS.map((col) => row[col] ?? '').join(TAB))
  }

  return lines.join(NEWLINE) + NEWLINE
}
