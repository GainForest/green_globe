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
const id = 'app.gainforest.organization.metrics'

export interface Record {
  $type: 'app.gainforest.organization.metrics'
  /** Last known credit price */
  lastCreditPrice?: number
  /** Total retired carbon (tCO2e) */
  retirementCarbon?: number
  /** Total supply carbon (tCO2e) */
  supplyCarbon?: number
  /** On-chain retired carbon (tCO2e) */
  onChainRetirementCarbon?: number
  /** On-chain supply carbon (tCO2e) */
  onChainSupplyCarbon?: number
  /** Buffer carbon (tCO2e) */
  bufferCarbon?: number
  /** Claimed carbon offset (tCO2e) */
  claimedCarbonOffset?: number
  /** Community size (people) */
  communitySize?: number
  /** Estimated soil carbon (tCO2e) */
  soilCarbon?: number
  /** Avoided carbon (tCO2e) */
  avoidedCarbon?: number
  /** Whether the project is externally managed */
  isExternalProject?: boolean
  /** Whether a reference area is available */
  hasReferenceArea?: boolean
  /** KYC completed */
  kyc?: boolean
  /** Monitoring strategy summary */
  monitorStrategy?: string
  /** Restoration type */
  restorationType?: string
  /** Highlighted as project of the month */
  isProjectOfTheMonth?: boolean
  /** Project end date (if applicable) */
  endDate?: string
  /** Optional score label */
  score?: string
  [k: string]: unknown
}

const hashRecord = 'main'

export function isRecord<V>(v: V) {
  return is$typed(v, id, hashRecord)
}

export function validateRecord<V>(v: V) {
  return validate<Record & V>(v, id, hashRecord, true)
}
