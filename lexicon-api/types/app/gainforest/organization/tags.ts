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
const id = 'app.gainforest.organization.tags'

export interface Record {
  $type: 'app.gainforest.organization.tags'
  /** Primary category label */
  category?: string
  /** UN SDG goal numbers (1-17) */
  sdgGoals?: number[]
  /** List of proponent organization names */
  proponents?: string[]
  /** Reason or label for catalog inclusion */
  catalogueReason?: string
  /** Potential issues or warnings */
  potentialIssues?: string[]
  /** Original objective text from source system */
  objectiveRaw?: string
  [k: string]: unknown
}

const hashRecord = 'main'

export function isRecord<V>(v: V) {
  return is$typed(v, id, hashRecord)
}

export function validateRecord<V>(v: V) {
  return validate<Record & V>(v, id, hashRecord, true)
}
