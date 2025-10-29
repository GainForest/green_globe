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
const id = 'app.gainforest.organization.info'

export interface Record {
  $type: 'app.gainforest.organization.info'
  /** The name of the organization or project */
  displayName: string
  /** The description of the organization or project */
  shortDescription: string
  /** The long description of the organization or project in markdown */
  longDescription: string
  /** The cover image of the organization or project */
  coverImage?: BlobRef
  /** The objectives of the organization or project */
  objectives: (
    | 'Conservation'
    | 'Research'
    | 'Education'
    | 'Community'
    | 'Other'
  )[]
  /** The start date of the organization or project */
  startDate: string
  /** The website of the organization or project */
  website?: string
  /** The country of the organization or project in two letter code (ISO 3166-1 alpha-2) */
  country: string
  /** The visibility of the organization or project */
  visibility: 'Public' | 'Private'
  /** Cover image blob for the organization (max 5MB) */
  coverImage?: BlobRef
  [k: string]: unknown
}

const hashRecord = 'main'

export function isRecord<V>(v: V) {
  return is$typed(v, id, hashRecord)
}

export function validateRecord<V>(v: V) {
  return validate<Record & V>(v, id, hashRecord, true)
}
