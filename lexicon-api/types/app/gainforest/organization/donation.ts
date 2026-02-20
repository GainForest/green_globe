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
const id = 'app.gainforest.organization.donation'

export interface Record {
  $type: 'app.gainforest.organization.donation'
  /** Unique identifier for the donor (DID, email hash, or anonymous token) */
  donorIdentifier: string
  /** Donation amount in the smallest unit of the currency (e.g., cents for USD) */
  amount: number
  /** Currency code (e.g., 'USD', 'EUR', 'CELO', 'SOL') */
  currency: string
  /** When the donation was made */
  donatedAt: string
  /** Record creation timestamp */
  createdAt: string
  /** Donor name (may be anonymous) */
  donorName?: string
  /** Donor's ATProto DID if they have an account */
  donorDid?: string
  /** AT-URI to the member record who received funds */
  recipientMemberRef?: string
  /** Type of transaction */
  transactionType?:
    | 'fiat'
    | 'crypto'
    | 'grant'
    | 'in-kind'
    | 'other'
    | (string & {})
  /** Payment method used for the donation */
  paymentMethod?:
    | 'stripe'
    | 'bank-transfer'
    | 'celo'
    | 'solana'
    | 'ethereum'
    | 'polygon'
    | 'paypal'
    | 'other'
    | (string & {})
  /** Blockchain transaction hash if crypto */
  transactionHash?: string
  /** Blockchain network the transaction was made on */
  blockchainNetwork?:
    | 'celo'
    | 'solana'
    | 'ethereum'
    | 'polygon'
    | 'other'
    | (string & {})
  /** What the donation is for (e.g., 'tree planting', 'equipment', 'salaries') */
  purpose?: string
  /** Whether the donor wishes to remain anonymous */
  isAnonymous?: boolean
  /** URL to donation receipt */
  receiptUrl?: string
  /** Additional notes */
  notes?: string
  /** Equivalent amount in USD at time of donation */
  amountUsd?: string
  [k: string]: unknown
}

const hashRecord = 'main'

export function isRecord<V>(v: V) {
  return is$typed(v, id, hashRecord)
}

export function validateRecord<V>(v: V) {
  return validate<Record & V>(v, id, hashRecord, true)
}
