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
const id = 'app.gainforest.organization.registry'

export interface Record {
  $type: 'app.gainforest.organization.registry'
  /** Verra registry project ID */
  verraId?: number
  /** Methodology ID (legacy) */
  methodologyId?: number
  /** Verifier ID (legacy) */
  verifierId?: number
  /** Proponent ID (legacy) */
  proponentId?: number
  /** Organization ID (legacy) */
  organizationId?: number
  /** Wallet ID (legacy) */
  walletId?: number
  [k: string]: unknown
}

const hashRecord = 'main'

export function isRecord<V>(v: V) {
  return is$typed(v, id, hashRecord)
}

export function validateRecord<V>(v: V) {
  return validate<Record & V>(v, id, hashRecord, true)
}
