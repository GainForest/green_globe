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
const id = 'app.gainforest.dwc.event'

export interface Main {
  $type: 'app.gainforest.dwc.event'
  /** An identifier for the event. Should be globally unique or unique within the dataset. */
  eventID: string
  /** An identifier for the broader event that this event is part of (e.g., a survey campaign that contains multiple transects). */
  parentEventID?: string
  /** AT-URI reference to the parent app.gainforest.dwc.event record. */
  parentEventRef?: string
  /** The date or date range during which the event occurred. ISO 8601 format (e.g., '2024-03-15', '2024-03-15/2024-03-17'). */
  eventDate: string
  /** The time or time range during which the event occurred. ISO 8601 format (e.g., '06:30:00', '06:30:00/09:00:00'). */
  eventTime?: string
  /** A category or description of the habitat in which the event occurred (e.g., 'primary tropical rainforest', 'degraded pasture', 'riparian zone'). */
  habitat?: string
  /** The names of, references to, or descriptions of the methods used during the event (e.g., 'camera trap array', 'line transect distance sampling', 'audio point count 10-min'). */
  samplingProtocol?: string
  /** A numeric value for a measurement of the size of a sample in the event (e.g., '20', '0.25'). */
  sampleSizeValue?: string
  /** The unit of measurement for the sampleSizeValue (e.g., 'square meters', 'hectares', 'trap-nights'). */
  sampleSizeUnit?: string
  /** The amount of effort expended during the event (e.g., '3 person-hours', '14 trap-nights', '2 km transect walked'). */
  samplingEffort?: string
  /** Notes or a reference to notes taken in the field about the event. */
  fieldNotes?: string
  /** Comments or notes about the event. */
  eventRemarks?: string
  /** Identifier for the location where the event occurred. */
  locationID?: string
  /** Geographic latitude in decimal degrees (WGS84). Range: -90 to 90. */
  decimalLatitude?: string
  /** Geographic longitude in decimal degrees (WGS84). Range: -180 to 180. */
  decimalLongitude?: string
  /** The spatial reference system. Recommended: 'EPSG:4326'. */
  geodeticDatum?: string
  /** Uncertainty radius in meters around the coordinates. */
  coordinateUncertaintyInMeters?: number
  /** The name of the country. */
  country?: string
  /** ISO 3166-1 alpha-2 country code. */
  countryCode?: string
  /** First-level administrative division. */
  stateProvince?: string
  /** Second-level administrative division. */
  county?: string
  /** Third-level administrative division. */
  municipality?: string
  /** Specific locality description. */
  locality?: string
  /** Lower limit of elevation range in meters above sea level. */
  minimumElevationInMeters?: number
  /** Upper limit of elevation range in meters above sea level. */
  maximumElevationInMeters?: number
  /** Comments about the location. */
  locationRemarks?: string
  /** Timestamp of record creation in the ATProto PDS. */
  createdAt: string
  /** AT-URI reference to the organization info record. */
  projectRef?: string
  /** AT-URI reference to the organization site record. */
  siteRef?: string
  /** Name of the monitoring programme (e.g., 'Annual Biodiversity Survey 2025'). */
  monitoringProgramme?: string
  /** How often this type of event recurs (e.g., 'monthly', 'quarterly', 'annual', 'one-time'). */
  monitoringFrequency?: string
  /** Temperature in Celsius during event. */
  temperature?: string
  /** Relative humidity percentage. */
  humidity?: string
  /** Wind speed during event. */
  windSpeed?: string
  /** Cloud cover percentage. */
  cloudCover?: string
  /** Precipitation description (e.g., 'none', 'light rain', '5mm'). */
  precipitation?: string
  /** General weather description. */
  weatherRemarks?: string
  /** Moon phase (relevant for nocturnal surveys). */
  moonPhase?: string
  /** Water level if aquatic survey (e.g., 'low', '2.3m'). */
  waterLevel?: string
  /** Water temperature in Celsius. */
  waterTemperature?: string
  /** Visibility conditions (e.g., 'clear', 'foggy', '10m underwater'). */
  visibility?: string
  /** Number of people involved in the event. */
  teamSize?: number
  /** Person(s) who conducted the event. Pipe-delimited for multiple people (e.g., 'Jane Smith | John Doe'). */
  recordedBy?: string
  /** ORCID or other persistent identifiers for the recorder(s). Pipe-delimited for multiple IDs. */
  recordedByID?: string
  /** Description of equipment used during the event. */
  equipmentUsed?: string
  /** Notes on data quality issues encountered during or after the event. */
  qualityControlNotes?: string
  /** Assessment of survey completeness (e.g., 'complete', 'partial - rain stopped survey', 'incomplete'). */
  completeness?: string
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
