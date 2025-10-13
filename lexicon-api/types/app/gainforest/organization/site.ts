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
  /** The latitude of the centerpoint of the site */
  lat: number
  /** The longitude of the centerpoint of the site */
  lon: number
  /** The area of the site in hectares */
  area: number
  /** The uri pointing to the shapefile of the site */
  shapefile?: string
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
