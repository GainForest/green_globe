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

const is$typed = _is$typed,
  validate = _validate
const id = 'app.gainforest.organization.layer'

export interface Main {
  $type: 'app.gainforest.organization.layer'
  /** The name of the site */
  name: string
  /** The type of the layer */
  type:
    | 'geojson_points'
    | 'geojson_points_trees'
    | 'geojson_line'
    | 'choropleth'
    | 'choropleth_shannon'
    | 'raster_tif'
    | 'tms_tile'
    | 'heatmap'
    | 'contour'
    | 'satellite_overlay'
  /** The URI of the layer */
  uri: string
  /** The description of the layer */
  description?: string
  /** The date and time of the creation of the record */
  createdAt: string
  /** Layer category for grouping in UI (e.g., 'Biodiversity', 'Land Cover', 'Climate', 'Infrastructure') */
  category?: string
  /** Ordering priority for display */
  displayOrder?: number
  /** Whether this layer should be shown by default */
  isDefault?: boolean
  /** Default opacity (0-1 as string, e.g., '0.7') */
  opacity?: string
  thumbnail?: AppGainforestCommonDefs.ImageThumbnail
  /** Legend entries for the layer */
  legend?: LegendEntry[]
  /** Named color scale for continuous data */
  colorScale?:
    | 'viridis'
    | 'plasma'
    | 'inferno'
    | 'magma'
    | 'cividis'
    | 'turbo'
    | 'spectral'
    | 'rdylgn'
    | 'rdylbu'
    | 'custom'
    | (string & {})
  /** Unit of measurement for the layer data (e.g., 'species/ha', 'kg C/m²', 'mm/year') */
  unit?: string
  /** Minimum value in the data range */
  minValue?: string
  /** Maximum value in the data range */
  maxValue?: string
  /** URL pattern for TMS tiles (e.g., 'https://tiles.example.com/{z}/{x}/{y}.png') */
  tilePattern?: string
  /** Minimum zoom level */
  tileMinZoom?: number
  /** Maximum zoom level */
  tileMaxZoom?: number
  /** Bounding box as 'west,south,east,north' */
  bounds?: string
  /** Attribution/source of the layer data */
  dataSource?: string
  /** Date of the data (ISO 8601) */
  dataDate?: string
  /** GeoJSON property key to use for choropleth coloring (e.g., 'species_richness') */
  propertyKey?: string
  /** AT-URI reference to the site this layer belongs to */
  siteRef?: string
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

/** A single entry in a layer legend */
export interface LegendEntry {
  $type?: 'app.gainforest.organization.layer#legendEntry'
  /** Display label for this legend entry */
  label: string
  /** Color for this legend entry (e.g., '#FF5733') */
  color: string
  /** Optional value associated with this legend entry */
  value?: string
}

const hashLegendEntry = 'legendEntry'

export function isLegendEntry<V>(v: V) {
  return is$typed(v, id, hashLegendEntry)
}

export function validateLegendEntry<V>(v: V) {
  return validate<LegendEntry & V>(v, id, hashLegendEntry)
}
