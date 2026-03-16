/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { type ValidationResult, BlobRef } from '@atproto/lexicon'
import { CID } from 'multiformats/cid'
import { validate as _validate } from '../../../../../lexicons'
import {
  type $Typed,
  is$typed as _is$typed,
  type OmitKey,
} from '../../../../../util'
import type * as OrgHypercertsDefs from '../../../../org/hypercerts/defs.js'
import type * as AppGainforestCommonDefs from '../../common/defs.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'app.gainforest.organization.observations.measuredTreesCluster'

export interface Main {
  $type: 'app.gainforest.organization.observations.measuredTreesCluster'
  shapefile: OrgHypercertsDefs.SmallBlob
  /** The date and time of the creation of the record */
  createdAt: string
  /** Name of the tree cluster/plot (e.g., 'Plot A - Riparian Zone') */
  name?: string
  description?: AppGainforestCommonDefs.Richtext
  /** AT-URI reference to the site this cluster belongs to */
  siteRef?: string
  /** Centroid latitude of the cluster */
  decimalLatitude?: string
  /** Centroid longitude of the cluster */
  decimalLongitude?: string
  /** Area of the cluster in square meters */
  areaSqMeters?: string
  /** Total number of measured trees in the cluster */
  totalTreeCount?: number
  /** Number of distinct species in the cluster */
  speciesCount?: number
  /** Average tree height in meters */
  averageHeightMeters?: string
  /** Average diameter at breast height in cm */
  averageDbhCm?: string
  /** Most common species scientific name */
  dominantSpecies?: string
  /** Date range of measurements (ISO 8601 interval) */
  measurementDateRange?: string
  /** Person(s) who measured the trees (pipe-delimited) */
  measuredBy?: string
  /** Description of the measurement protocol used */
  measurementProtocol?: string
  /** Source of the data (e.g., 'KoBoToolbox', 'field survey') */
  dataSource?: string
  /** Data license */
  license?: string
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
