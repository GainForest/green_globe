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
const id = 'app.gainforest.organization.links'

export interface Record {
  $type: 'app.gainforest.organization.links'
  /** Primary website (may duplicate info.website) */
  website?: string
  /** Project registry or overview URL */
  projectUrl?: string
  /** Discord server or channel identifier */
  discordId?: string
  /** Stripe checkout or dashboard URL */
  stripeUrl?: string
  /** Data download URL */
  dataDownloadUrl?: string
  /** Description of downloadable data */
  dataDownloadInfo?: string
  /** Custom CTA label for project entry */
  customEnterBtnText?: string
  [k: string]: unknown
}

const hashRecord = 'main'

export function isRecord<V>(v: V) {
  return is$typed(v, id, hashRecord)
}

export function validateRecord<V>(v: V) {
  return validate<Record & V>(v, id, hashRecord, true)
}
