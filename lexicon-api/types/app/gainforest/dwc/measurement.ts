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
const id = 'app.gainforest.dwc.measurement'

export interface Record {
  $type: 'app.gainforest.dwc.measurement'
  /** An identifier for the measurement. Should be unique within the dataset. */
  measurementID?: string
  /** AT-URI reference to the app.gainforest.dwc.occurrence record this measurement belongs to. */
  occurrenceRef: string
  /** The occurrenceID of the linked occurrence record (for cross-system interoperability). */
  occurrenceID?: string
  /** The nature of the measurement, fact, characteristic, or assertion (e.g., 'DBH', 'tree height', 'canopy cover', 'tail length', 'body mass', 'soil pH', 'water temperature'). */
  measurementType: string
  /** The value of the measurement, fact, characteristic, or assertion (e.g., '45.2', 'present', 'blue'). */
  measurementValue: string
  /** The units for the measurementValue (e.g., 'cm', 'm', 'kg', 'mm', '%', 'degrees Celsius'). */
  measurementUnit?: string
  /** The description of the potential error associated with the measurementValue (e.g., '0.5 cm', '5%'). */
  measurementAccuracy?: string
  /** The description of or reference to the method used to determine the measurement (e.g., 'diameter tape at 1.3m height', 'laser rangefinder', 'Bitterlich method'). */
  measurementMethod?: string
  /** Person(s) who determined the measurement. Pipe-delimited for multiple. */
  measurementDeterminedBy?: string
  /** The date the measurement was made. ISO 8601 format. */
  measurementDeterminedDate?: string
  /** Comments or notes accompanying the measurement. */
  measurementRemarks?: string
  /** Timestamp of record creation in the ATProto PDS. */
  createdAt: string
  [k: string]: unknown
}

const hashRecord = 'main'

export function isRecord<V>(v: V) {
  return is$typed(v, id, hashRecord)
}

export function validateRecord<V>(v: V) {
  return validate<Record & V>(v, id, hashRecord, true)
}
