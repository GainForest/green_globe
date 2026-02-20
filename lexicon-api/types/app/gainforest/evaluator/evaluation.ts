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
import type * as AppGainforestEvaluatorDefs from './defs.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'app.gainforest.evaluator.evaluation'

export interface Record {
  $type: 'app.gainforest.evaluator.evaluation'
  subject?: AppGainforestEvaluatorDefs.SubjectRef
  /** Batch evaluation: multiple target records sharing the same result. Use this OR subject, not both. */
  subjects?: AppGainforestEvaluatorDefs.SubjectRef[]
  /** Identifier for the type of evaluation (must match one declared in the evaluator's service record). */
  evaluationType: string
  result?:
    | $Typed<AppGainforestEvaluatorDefs.SpeciesIdResult>
    | $Typed<AppGainforestEvaluatorDefs.DataQualityResult>
    | $Typed<AppGainforestEvaluatorDefs.VerificationResult>
    | $Typed<AppGainforestEvaluatorDefs.ClassificationResult>
    | $Typed<AppGainforestEvaluatorDefs.MeasurementResult>
    | $Typed<AppGainforestEvaluatorDefs.BioacousticsResult>
    | $Typed<AppGainforestEvaluatorDefs.DeforestationResult>
    | $Typed<AppGainforestEvaluatorDefs.CarbonEstimationResult>
    | { $type: string }
  /** Overall confidence in this evaluation (0-1000, where 1000 = 100.0%). */
  confidence?: number
  method?: AppGainforestEvaluatorDefs.MethodInfo
  /** If true, this is a negation/withdrawal of a previous evaluation (like label negation). */
  neg?: boolean
  /** AT-URI of a previous evaluation record that this one supersedes (e.g., model re-run with improved version). */
  supersedes?: string
  /** Additional structured data as a JSON string. Escape hatch for experimental result types before they are formalized into the union. */
  dynamicProperties?: string
  /** Timestamp of when this evaluation was produced. */
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
