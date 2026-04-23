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
const id = 'app.gainforest.gbif.dataset'

export interface Main {
  $type: 'app.gainforest.gbif.dataset'
  /** AT-URI of the organization info record this dataset belongs to */
  organizationRef: string
  /** GBIF dataset UUID returned by POST /dataset */
  gbifDatasetKey: string
  /** GBIF installation UUID used when creating the dataset */
  gbifInstallationKey: string
  /** GBIF endpoint integer key returned by POST /dataset/{key}/endpoint */
  gbifEndpointKey?: number
  /** Human-readable dataset title */
  datasetTitle?: string
  /** CID of the most recently uploaded DwC-A blob */
  archiveBlobCid?: string
  /** Blob reference to the DwC-A archive ZIP. Storing as a proper blob ref prevents PDS garbage collection. */
  archiveBlob?: BlobRef
  /** When the archive was last published to GBIF */
  lastPublishedAt?: string
  /** Result of last GBIF crawl (NORMAL, ABORT, etc.) */
  lastCrawlFinishReason?: string
  /** Timestamp of record creation in the ATProto PDS */
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
