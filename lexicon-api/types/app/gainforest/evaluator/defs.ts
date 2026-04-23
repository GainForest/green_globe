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
const id = 'app.gainforest.evaluator.defs'

/** Reference to a target record that is being evaluated. */
export interface SubjectRef {
  $type?: 'app.gainforest.evaluator.defs#subjectRef'
  /** AT-URI of the target record. */
  uri: string
  /** CID pinning the exact version of the target record. */
  cid?: string
}

const hashSubjectRef = 'subjectRef'

export function isSubjectRef<V>(v: V) {
  return is$typed(v, id, hashSubjectRef)
}

export function validateSubjectRef<V>(v: V) {
  return validate<SubjectRef & V>(v, id, hashSubjectRef)
}

/** Provenance metadata describing the method used to produce an evaluation. */
export interface MethodInfo {
  $type?: 'app.gainforest.evaluator.defs#methodInfo'
  /** Human-readable name of the method or model (e.g., 'GainForest BioClassifier'). */
  name: string
  /** Version string of the method or model (e.g., '2.1.0'). */
  version?: string
  /** Identifier for the specific model checkpoint used (e.g., date or hash). */
  modelCheckpoint?: string
  /** URIs to papers, documentation, or repositories describing this method. */
  references?: string[]
}

const hashMethodInfo = 'methodInfo'

export function isMethodInfo<V>(v: V) {
  return is$typed(v, id, hashMethodInfo)
}

export function validateMethodInfo<V>(v: V) {
  return validate<MethodInfo & V>(v, id, hashMethodInfo)
}

/** A candidate taxon identification with confidence score and rank. */
export interface CandidateTaxon {
  $type?: 'app.gainforest.evaluator.defs#candidateTaxon'
  /** Full scientific name of the candidate taxon. */
  scientificName: string
  /** GBIF backbone taxonomy key for the candidate. */
  gbifTaxonKey?: string
  /** Confidence score (0-1000, where 1000 = 100.0%). */
  confidence: number
  /** Rank position among candidates (1 = best match). */
  rank: number
  /** Kingdom of the candidate taxon. */
  kingdom?: string
  /** Family of the candidate taxon. */
  family?: string
  /** Genus of the candidate taxon. */
  genus?: string
}

const hashCandidateTaxon = 'candidateTaxon'

export function isCandidateTaxon<V>(v: V) {
  return is$typed(v, id, hashCandidateTaxon)
}

export function validateCandidateTaxon<V>(v: V) {
  return validate<CandidateTaxon & V>(v, id, hashCandidateTaxon)
}

/** A single data quality flag indicating an issue with a specific field. */
export interface QualityFlag {
  $type?: 'app.gainforest.evaluator.defs#qualityFlag'
  /** The field name that has the quality issue. */
  field: string
  /** Description of the quality issue. */
  issue: string
  /** Severity level of the quality issue. */
  severity?: 'error' | 'warning' | 'info' | (string & {})
}

const hashQualityFlag = 'qualityFlag'

export function isQualityFlag<V>(v: V) {
  return is$typed(v, id, hashQualityFlag)
}

export function validateQualityFlag<V>(v: V) {
  return validate<QualityFlag & V>(v, id, hashQualityFlag)
}

/** A single measurement derived by an evaluator from source data. */
export interface DerivedMeasurement {
  $type?: 'app.gainforest.evaluator.defs#derivedMeasurement'
  /** The nature of the measurement (e.g., 'canopy cover', 'NDVI', 'tree height'). */
  measurementType: string
  /** The value of the measurement. */
  measurementValue: string
  /** The units for the measurement value (e.g., '%', 'm', 'kg'). */
  measurementUnit?: string
  /** Description of the method used to obtain the measurement. */
  measurementMethod?: string
}

const hashDerivedMeasurement = 'derivedMeasurement'

export function isDerivedMeasurement<V>(v: V) {
  return is$typed(v, id, hashDerivedMeasurement)
}

export function validateDerivedMeasurement<V>(v: V) {
  return validate<DerivedMeasurement & V>(v, id, hashDerivedMeasurement)
}

/** AI or human species recognition result with ranked candidate identifications. */
export interface SpeciesIdResult {
  $type?: 'app.gainforest.evaluator.defs#speciesIdResult'
  /** Ranked list of candidate species identifications. */
  candidates: CandidateTaxon[]
  /** Which feature of the subject record was used as input (e.g., 'mediaEvidence'). */
  inputFeature?: string
  /** Additional notes about the species identification. */
  remarks?: string
}

const hashSpeciesIdResult = 'speciesIdResult'

export function isSpeciesIdResult<V>(v: V) {
  return is$typed(v, id, hashSpeciesIdResult)
}

export function validateSpeciesIdResult<V>(v: V) {
  return validate<SpeciesIdResult & V>(v, id, hashSpeciesIdResult)
}

/** Data quality assessment result with per-field quality flags. */
export interface DataQualityResult {
  $type?: 'app.gainforest.evaluator.defs#dataQualityResult'
  /** List of quality issues found in the record. */
  flags: QualityFlag[]
  /** Overall completeness score (0-1000, where 1000 = 100.0%). */
  completenessScore?: number
  /** Additional notes about the quality assessment. */
  remarks?: string
}

const hashDataQualityResult = 'dataQualityResult'

export function isDataQualityResult<V>(v: V) {
  return is$typed(v, id, hashDataQualityResult)
}

export function validateDataQualityResult<V>(v: V) {
  return validate<DataQualityResult & V>(v, id, hashDataQualityResult)
}

/** Expert verification result for a previous identification or evaluation. */
export interface VerificationResult {
  $type?: 'app.gainforest.evaluator.defs#verificationResult'
  /** Verification status: confirmed, rejected, or uncertain. */
  status: 'confirmed' | 'rejected' | 'uncertain' | (string & {})
  /** Name of the person who performed the verification. */
  verifiedBy?: string
  /** Persistent identifier (e.g., ORCID) of the verifier. */
  verifiedByID?: string
  /** Notes about the verification decision. */
  remarks?: string
  /** Suggested corrections if the original identification was rejected or uncertain. */
  suggestedCorrections?: string
}

const hashVerificationResult = 'verificationResult'

export function isVerificationResult<V>(v: V) {
  return is$typed(v, id, hashVerificationResult)
}

export function validateVerificationResult<V>(v: V) {
  return validate<VerificationResult & V>(v, id, hashVerificationResult)
}

/** Generic categorical classification result (e.g., conservation priority, habitat type). */
export interface ClassificationResult {
  $type?: 'app.gainforest.evaluator.defs#classificationResult'
  /** The classification category (e.g., 'conservation-priority', 'habitat-type'). */
  category: string
  /** The assigned classification value (e.g., 'critical', 'tropical-rainforest'). */
  value: string
  /** Additional notes about the classification. */
  remarks?: string
}

const hashClassificationResult = 'classificationResult'

export function isClassificationResult<V>(v: V) {
  return is$typed(v, id, hashClassificationResult)
}

export function validateClassificationResult<V>(v: V) {
  return validate<ClassificationResult & V>(v, id, hashClassificationResult)
}

/** Derived measurements produced by an evaluator from source data (e.g., remote sensing metrics). */
export interface MeasurementResult {
  $type?: 'app.gainforest.evaluator.defs#measurementResult'
  /** List of derived measurements. */
  measurements: DerivedMeasurement[]
  /** Additional notes about the measurements. */
  remarks?: string
}

const hashMeasurementResult = 'measurementResult'

export function isMeasurementResult<V>(v: V) {
  return is$typed(v, id, hashMeasurementResult)
}

export function validateMeasurementResult<V>(v: V) {
  return validate<MeasurementResult & V>(v, id, hashMeasurementResult)
}

/** A single detection within an audio recording. */
export interface BioacousticsDetection {
  $type?: 'app.gainforest.evaluator.defs#bioacousticsDetection'
  /** Start time in seconds from recording start. */
  startTimeSeconds: string
  /** End time in seconds from recording start. */
  endTimeSeconds: string
  /** Lower frequency bound of detection in Hz. */
  minFrequencyHz?: number
  /** Upper frequency bound of detection in Hz. */
  maxFrequencyHz?: number
  /** Identified species scientific name. */
  scientificName?: string
  /** Common name of the identified species. */
  commonName?: string
  /** Confidence score (0-1000, where 1000 = 100.0%). */
  confidence?: number
  /** Type of sound detected. */
  soundType?:
    | 'call'
    | 'song'
    | 'alarm'
    | 'drumming'
    | 'echolocation'
    | 'stridulation'
    | 'anthropogenic'
    | 'geophony'
    | 'unknown'
    | (string & {})
}

const hashBioacousticsDetection = 'bioacousticsDetection'

export function isBioacousticsDetection<V>(v: V) {
  return is$typed(v, id, hashBioacousticsDetection)
}

export function validateBioacousticsDetection<V>(v: V) {
  return validate<BioacousticsDetection & V>(v, id, hashBioacousticsDetection)
}

/** Result of audio-based species detection. */
export interface BioacousticsResult {
  $type?: 'app.gainforest.evaluator.defs#bioacousticsResult'
  /** Detected species/sounds within the audio recording. */
  detections: BioacousticsDetection[]
  /** Total audio duration analyzed in seconds. */
  totalDurationAnalyzedSeconds?: string
  /** Acoustic diversity index value. */
  soundscapeIndex?: string
  /** Additional notes about the bioacoustics analysis. */
  remarks?: string
}

const hashBioacousticsResult = 'bioacousticsResult'

export function isBioacousticsResult<V>(v: V) {
  return is$typed(v, id, hashBioacousticsResult)
}

export function validateBioacousticsResult<V>(v: V) {
  return validate<BioacousticsResult & V>(v, id, hashBioacousticsResult)
}

/** Deforestation/land-use change detection result. */
export interface DeforestationResult {
  $type?: 'app.gainforest.evaluator.defs#deforestationResult'
  /** Type of land-use change detected. */
  changeType:
    | 'deforestation'
    | 'degradation'
    | 'reforestation'
    | 'afforestation'
    | 'no-change'
    | 'fire'
    | 'flooding'
    | 'urbanization'
    | (string & {})
  /** Area affected by the change in hectares. */
  areaAffectedHectares?: string
  /** Percentage of monitored area affected. */
  changePercentage?: string
  /** ISO 8601 date of detection. */
  detectionDate?: string
  /** ISO 8601 date of baseline comparison. */
  baselineDate?: string
  /** Satellite data source (e.g., 'Sentinel-2', 'Landsat-8', 'Planet'). */
  satelliteSource?: string
  /** Additional notes about the deforestation detection. */
  remarks?: string
}

const hashDeforestationResult = 'deforestationResult'

export function isDeforestationResult<V>(v: V) {
  return is$typed(v, id, hashDeforestationResult)
}

export function validateDeforestationResult<V>(v: V) {
  return validate<DeforestationResult & V>(v, id, hashDeforestationResult)
}

/** Carbon stock or sequestration estimation. */
export interface CarbonEstimationResult {
  $type?: 'app.gainforest.evaluator.defs#carbonEstimationResult'
  /** Type of carbon estimation. */
  estimationType:
    | 'above-ground-biomass'
    | 'below-ground-biomass'
    | 'soil-carbon'
    | 'total-carbon-stock'
    | 'annual-sequestration'
    | 'avoided-emissions'
    | (string & {})
  /** Estimated carbon value. */
  value: string
  /** Unit of the estimated value (e.g., 'tCO2e', 'tC/ha', 'tCO2e/year'). */
  unit: string
  /** Uncertainty range (e.g., '±15%'). */
  uncertainty?: string
  /** Estimation methodology used. */
  methodology?: string
  /** Additional notes about the carbon estimation. */
  remarks?: string
}

const hashCarbonEstimationResult = 'carbonEstimationResult'

export function isCarbonEstimationResult<V>(v: V) {
  return is$typed(v, id, hashCarbonEstimationResult)
}

export function validateCarbonEstimationResult<V>(v: V) {
  return validate<CarbonEstimationResult & V>(v, id, hashCarbonEstimationResult)
}
