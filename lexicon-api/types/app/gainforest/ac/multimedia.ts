/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { type ValidationResult, BlobRef } from '@atproto/lexicon'
import { CID } from 'multiformats/cid'
import { validate as _validate } from '../../../../lexicons'
import {
  type $Typed,
  is$typed as _is$typed,
  type OmitKey,
} from '../../../../util'

const is$typed = _is$typed,
  validate = _validate
const id = 'app.gainforest.ac.multimedia'

export interface Record {
  $type: 'app.gainforest.ac.multimedia'
  /** AT-URI of the dwc.occurrence record this media is evidence for. */
  occurrenceRef?: string
  /** AT-URI of the organization site record where this media was captured. */
  siteRef?: string
  /** The part of the organism depicted, using TDWG Audubon Core subjectPart controlled values (http://rs.tdwg.org/acpart/values/). Examples: entireOrganism, leaf, bark, flower, fruit, seed, stem, twig, bud, root. */
  subjectPart:
    | 'entireOrganism'
    | 'leaf'
    | 'bark'
    | 'flower'
    | 'fruit'
    | 'seed'
    | 'stem'
    | 'twig'
    | 'bud'
    | 'root'
    | 'head'
    | 'wing'
    | 'shell'
    | 'unspecifiedPart'
    | (string & {})
  /** Full IRI of the subjectPart term from the TDWG controlled vocabulary. Example: http://rs.tdwg.org/acpart/values/p0002 for bark. */
  subjectPartUri?: string
  /** Viewing orientation relative to the subject, using TDWG Audubon Core subjectOrientation controlled values. Examples: dorsal, ventral, lateral, anterior, posterior. */
  subjectOrientation?: string
  /** The media file blob. Images up to 100MB, audio up to 100MB, video up to 100MB. For PDS-stored compressed versions; original full-res referenced via accessUri. */
  file: BlobRef
  /** MIME type of the media file (e.g. image/webp, audio/flac). Should match the blob's actual content type. */
  format?: string
  /** URI to the original full-resolution media resource (e.g. S3 URL). The PDS blob is a compressed variant; this points to the archival original. */
  accessUri?: string
  /** AC variant describing the quality/size of this service access point. Values: Thumbnail, Lower Quality, Medium Quality, Good Quality, Best Quality, Offline. */
  variantLiteral?:
    | 'Thumbnail'
    | 'Lower Quality'
    | 'Medium Quality'
    | 'Good Quality'
    | 'Best Quality'
    | 'Offline'
    | (string & {})
  /** Human-readable description of the media content. */
  caption?: string
  /** Name of the person or agent who created the media resource. */
  creator?: string
  /** Date and time the media resource was originally created (e.g. when the photo was taken). */
  createDate?: string
  /** Timestamp of record creation in the ATProto PDS. */
  createdAt: string
  [k: string]: unknown
}

const hashRecord = 'main'

export function isRecord<V>(v: V) {
  return is$typed(v, id, hashRecord)
}

export function validateRecord<V>(v: V) {
  return validate<Record & V>(v, id, hashRecord, true)
}
