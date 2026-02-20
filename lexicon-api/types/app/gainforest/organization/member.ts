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
import type * as AppGainforestCommonDefs from '../common/defs.js'
import type * as OrgHypercertsDefs from '../../../org/hypercerts/defs.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'app.gainforest.organization.member'

export interface Record {
  $type: 'app.gainforest.organization.member'
  /** Full display name of the member */
  displayName: string
  /** Role or title of the member within the organization */
  role: string
  /** The date and time the record was created */
  createdAt: string
  /** First name of the member */
  firstName?: string
  /** Last name of the member */
  lastName?: string
  bio?: AppGainforestCommonDefs.Richtext
  profileImage?: OrgHypercertsDefs.SmallImage
  /** Contact email address of the member */
  email?: string
  /** ORCID identifier of the member */
  orcid?: string
  /** ATProto DID if the member has their own account */
  did: string
  /** Areas of expertise (e.g. 'botany', 'remote sensing', 'community engagement') */
  expertise?: string[]
  /** Languages spoken by the member as BCP-47 codes */
  languages?: string[]
  /** Ordering priority for display (lower values appear first) */
  displayOrder?: number
  /** Whether this member profile is publicly visible */
  isPublic?: boolean
  /** When the member joined the organization */
  joinedAt?: string
  /** Blockchain wallet addresses for receiving funds */
  walletAddresses?: WalletAddress[]
  [k: string]: unknown
}

const hashRecord = 'main'

export function isRecord<V>(v: V) {
  return is$typed(v, id, hashRecord)
}

export function validateRecord<V>(v: V) {
  return validate<Record & V>(v, id, hashRecord, true)
}

/** A blockchain wallet address for receiving funds */
export interface WalletAddress {
  $type?: 'app.gainforest.organization.member#walletAddress'
  /** The blockchain network for this wallet address */
  chain: 'celo' | 'solana' | 'ethereum' | 'polygon' | 'other' | (string & {})
  /** The wallet address on the specified chain */
  address: string
}

const hashWalletAddress = 'walletAddress'

export function isWalletAddress<V>(v: V) {
  return is$typed(v, id, hashWalletAddress)
}

export function validateWalletAddress<V>(v: V) {
  return validate<WalletAddress & V>(v, id, hashWalletAddress)
}
