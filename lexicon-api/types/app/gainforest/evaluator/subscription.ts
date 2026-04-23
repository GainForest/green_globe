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
const id = 'app.gainforest.evaluator.subscription'

export interface Main {
  $type: 'app.gainforest.evaluator.subscription'
  /** DID of the evaluator service to subscribe to. */
  evaluator: string
  /** Which of the user's record collections should be evaluated (NSIDs). Must be a subset of the evaluator's subjectCollections. If omitted, all supported collections are evaluated. */
  collections?: string[]
  /** Which evaluation types the user wants. If omitted, all types the evaluator supports are applied. */
  evaluationTypes?: string[]
  /** Timestamp of when this subscription was created. */
  createdAt: string
  [k: string]: unknown
}

const hashMain = 'main'

export function isMain<V>(v: V) {
  return is$typed(v, id, hashMain)
}

export function validateMain<V>(v: V) {
  return validate<Main & V>(v, id, hashMain, true)
}

export {
  type Main as Record,
  isMain as isRecord,
  validateMain as validateRecord,
}
