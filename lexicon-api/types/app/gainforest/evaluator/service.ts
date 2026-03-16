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
const id = 'app.gainforest.evaluator.service'

export interface Main {
  $type: 'app.gainforest.evaluator.service'
  policies: EvaluatorPolicies
  /** Timestamp of when this evaluator service was declared. */
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

/** Policies declaring what this evaluator does and how it operates. */
export interface EvaluatorPolicies {
  $type?: 'app.gainforest.evaluator.service#evaluatorPolicies'
  /** Whether this evaluator requires user subscription ('subscription') or processes all matching records ('open'). */
  accessModel?: 'open' | 'subscription' | (string & {})
  /** List of evaluation type identifiers this evaluator produces (e.g., 'species-id', 'data-quality'). */
  evaluationTypes: string[]
  /** Detailed definitions for each evaluation type, including human-readable descriptions. */
  evaluationTypeDefinitions?: EvaluationTypeDefinition[]
  /** NSIDs of record collections this evaluator can evaluate (e.g., 'app.gainforest.dwc.occurrence'). */
  subjectCollections?: string[]
}

const hashEvaluatorPolicies = 'evaluatorPolicies'

export function isEvaluatorPolicies<V>(v: V) {
  return is$typed(v, id, hashEvaluatorPolicies)
}

export function validateEvaluatorPolicies<V>(v: V) {
  return validate<EvaluatorPolicies & V>(v, id, hashEvaluatorPolicies)
}

/** Definition of a single evaluation type produced by this evaluator. */
export interface EvaluationTypeDefinition {
  $type?: 'app.gainforest.evaluator.service#evaluationTypeDefinition'
  /** The evaluation type identifier (must match an entry in evaluationTypes). */
  identifier: string
  /** The lexicon reference for the result type (e.g., 'app.gainforest.evaluator.defs#speciesIdResult'). */
  resultType: string
  method?: AppGainforestEvaluatorDefs.MethodInfo
  /** Human-readable names and descriptions in various languages. */
  locales?: EvaluationTypeLocale[]
}

const hashEvaluationTypeDefinition = 'evaluationTypeDefinition'

export function isEvaluationTypeDefinition<V>(v: V) {
  return is$typed(v, id, hashEvaluationTypeDefinition)
}

export function validateEvaluationTypeDefinition<V>(v: V) {
  return validate<EvaluationTypeDefinition & V>(
    v,
    id,
    hashEvaluationTypeDefinition,
  )
}

/** Localized name and description for an evaluation type. */
export interface EvaluationTypeLocale {
  $type?: 'app.gainforest.evaluator.service#evaluationTypeLocale'
  /** Language code (BCP-47, e.g., 'en', 'pt-BR'). */
  lang: string
  /** Short human-readable name for this evaluation type. */
  name: string
  /** Longer description of what this evaluation type does. */
  description: string
}

const hashEvaluationTypeLocale = 'evaluationTypeLocale'

export function isEvaluationTypeLocale<V>(v: V) {
  return is$typed(v, id, hashEvaluationTypeLocale)
}

export function validateEvaluationTypeLocale<V>(v: V) {
  return validate<EvaluationTypeLocale & V>(v, id, hashEvaluationTypeLocale)
}
