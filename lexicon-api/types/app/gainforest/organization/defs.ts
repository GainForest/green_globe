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
const id = 'app.gainforest.organization.defs'

export interface IndexedOrganization {
  $type?: 'app.gainforest.organization.defs#indexedOrganization'
  /** The name of the organization */
  name: string
  /** The country of the organization */
  country: 'US' | 'GB' | 'CA' | 'AU' | 'NZ' | 'Other'
  /** The DID of the organization */
  did: string
  /** The centerpoint coordinates of the organization, calculated from the default site and seperated by a comma */
  mapPoint: string
}

const hashIndexedOrganization = 'indexedOrganization'

export function isIndexedOrganization<V>(v: V) {
  return is$typed(v, id, hashIndexedOrganization)
}

export function validateIndexedOrganization<V>(v: V) {
  return validate<IndexedOrganization & V>(v, id, hashIndexedOrganization)
}
