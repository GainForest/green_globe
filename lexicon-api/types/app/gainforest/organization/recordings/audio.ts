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
import type * as AppGainforestCommonDefs from '../../common/defs.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'app.gainforest.organization.recordings.audio'

export interface Record {
  $type: 'app.gainforest.organization.recordings.audio'
  /** A short name for the audio recording */
  name: string
  description?: AppGainforestCommonDefs.Richtext
  blob: AppGainforestCommonDefs.Audio
  metadata: Metadata
  /** The date and time of the creation of the record */
  createdAt: string
  spectrogram?: AppGainforestCommonDefs.Spectrogram
  thumbnail?: AppGainforestCommonDefs.ImageThumbnail
  /** License for the recording (e.g., CC-BY-4.0) */
  license?: string
  /** Person(s) who made the recording */
  recordedBy?: string
  /** Freeform tags for the recording (e.g., 'dawn-chorus', 'rain', 'chainsaw') */
  tags?: string[]
  [k: string]: unknown
}

const hashRecord = 'main'

export function isRecord<V>(v: V) {
  return is$typed(v, id, hashRecord)
}

export function validateRecord<V>(v: V) {
  return validate<Record & V>(v, id, hashRecord, true)
}

export interface Metadata {
  $type?: 'app.gainforest.organization.recordings.audio#metadata'
  /** The codec of the audio recording */
  codec: string
  /** The number of channels of the audio recording */
  channels: number
  /** The duration of the audio recording in seconds */
  duration: string
  /** The date and time of the recording */
  recordedAt: string
  /** The sample rate of the audio recording */
  sampleRate: number
  /** Deprecated: prefer decimalLatitude and decimalLongitude fields. The coordinates at which the audio was recorded in the format 'latitude,longitude' OR 'latitude,longitude,altitude' */
  coordinates?: string
  /** Recording device model (e.g., 'AudioMoth 1.2.0', 'Song Meter SM4') */
  deviceModel?: string
  /** Device serial number for tracking */
  deviceSerialNumber?: string
  /** Gain setting (e.g., 'medium', '36dB') */
  gain?: string
  /** Bits per sample (e.g., 16, 24, 32) */
  bitDepth?: number
  /** File format (e.g., 'WAV', 'FLAC', 'MP3') */
  fileFormat?: string
  /** File size in bytes */
  fileSizeBytes?: number
  /** Latitude in decimal degrees (WGS84) */
  decimalLatitude?: string
  /** Longitude in decimal degrees (WGS84) */
  decimalLongitude?: string
  /** Altitude in meters */
  altitude?: string
  /** Habitat description */
  habitat?: string
  /** AT-URI reference to the organization site record */
  siteRef?: string
  /** Minimum frequency in recording (Hz) */
  minFrequencyHz?: number
  /** Maximum frequency in recording (Hz) */
  maxFrequencyHz?: number
  /** Signal-to-noise ratio in dB */
  signalToNoiseRatio?: string
  /** Weather conditions during recording */
  weatherConditions?: string
  /** Temperature in Celsius during recording */
  temperature?: string
  /** Relative humidity percentage during recording */
  humidity?: string
  /** Wind speed during recording */
  windSpeed?: string
}

const hashMetadata = 'metadata'

export function isMetadata<V>(v: V) {
  return is$typed(v, id, hashMetadata)
}

export function validateMetadata<V>(v: V) {
  return validate<Metadata & V>(v, id, hashMetadata)
}
