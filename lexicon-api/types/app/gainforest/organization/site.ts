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
const id = 'app.gainforest.organization.site'

export interface Record {
  $type: 'app.gainforest.organization.site'
  /** The name of the site */
  name: string
  /** Latitude of the site centerpoint as a decimal string */
  lat?: string
  /** Longitude of the site centerpoint as a decimal string */
  lon?: string
  /** Area of the site in hectares as a decimal string */
  area?: string
  /** The URI pointing to the GeoJSON boundary of the site */
  boundary?: string
  /** GeoJSON blob containing tree planting data for this site (max 10MB) */
  trees?: BlobRef
  [k: string]: unknown
}

const hashRecord = 'main'

export function isRecord<V>(v: V) {
  return is$typed(v, id, hashRecord)
}

export function validateRecord<V>(v: V) {
  return validate<Record & V>(v, id, hashRecord, true)
}
