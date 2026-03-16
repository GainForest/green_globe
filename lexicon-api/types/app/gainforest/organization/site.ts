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
import type * as OrgHypercertsDefs from '../../../org/hypercerts/defs.js'
import type * as AppGainforestCommonDefs from '../common/defs.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'app.gainforest.organization.site'

export interface Main {
  $type: 'app.gainforest.organization.site'
  /** The name of the site */
  name: string
  /** The latitude of the centerpoint of the site */
  lat: string
  /** The longitude of the centerpoint of the site */
  lon: string
  /** The area of the site in hectares */
  area: string
  shapefile: OrgHypercertsDefs.SmallBlob
  /** The date and time of the creation of the record */
  createdAt: string
  /** The country where the site is located */
  country?: string
  /** ISO 3166-1 alpha-2 country code */
  countryCode?: string
  /** The first-level administrative division (state, province, region) where the site is located */
  stateProvince?: string
  /** Specific locality description for the site */
  locality?: string
  /** The lower elevation bound of the site in meters */
  minimumElevationInMeters?: number
  /** The upper elevation bound of the site in meters */
  maximumElevationInMeters?: number
  /** The biome classification of the site */
  biome?:
    | 'tropical-moist-forest'
    | 'tropical-dry-forest'
    | 'temperate-broadleaf-forest'
    | 'temperate-conifer-forest'
    | 'boreal-forest'
    | 'tropical-grassland-savanna'
    | 'temperate-grassland'
    | 'flooded-grassland'
    | 'montane-grassland'
    | 'tundra'
    | 'mediterranean-forest'
    | 'desert-xeric-shrubland'
    | 'mangrove'
    | 'coral-reef'
    | 'freshwater'
    | 'marine'
    | 'other'
    | (string & {})
  /** Freeform description of the ecosystem type at the site */
  ecosystemType?: string
  /** The protection status of the site */
  protectionStatus?:
    | 'national-park'
    | 'nature-reserve'
    | 'wildlife-sanctuary'
    | 'biosphere-reserve'
    | 'world-heritage'
    | 'ramsar-site'
    | 'community-conserved'
    | 'indigenous-territory'
    | 'private-reserve'
    | 'buffer-zone'
    | 'unprotected'
    | 'other'
    | (string & {})
  /** The IUCN protected area management category */
  iucnProtectedAreaCategory?:
    | 'Ia'
    | 'Ib'
    | 'II'
    | 'III'
    | 'IV'
    | 'V'
    | 'VI'
    | (string & {})
  /** The World Database on Protected Areas (WDPA) identifier for the site */
  wdpaId?: string
  /** The average annual rainfall at the site in millimeters */
  averageAnnualRainfallMm?: number
  /** The average annual temperature at the site in degrees Celsius */
  averageTemperatureCelsius?: string
  /** The Koppen climate classification for the site */
  climatezone?: string
  /** The date and time when monitoring of the site began */
  monitoringStartDate?: string
  description?: AppGainforestCommonDefs.Richtext
  /** URL to a boundary GeoJSON file (alternative to the shapefile blob) */
  boundary?: string
  /** Additional notes or remarks about the site */
  siteRemarks?: string
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
