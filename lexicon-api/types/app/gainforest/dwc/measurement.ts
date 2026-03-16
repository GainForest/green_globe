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

export interface Main {
  $type: 'app.gainforest.dwc.measurement'
  /** AT-URI reference to the app.gainforest.dwc.occurrence record these measurements belong to. */
  occurrenceRef: string
  /** The occurrenceID of the linked occurrence record (for cross-system interoperability with GBIF/DwC-A exports). */
  occurrenceID?: string
  result:
    | $Typed<FloraMeasurement>
    | $Typed<FaunaMeasurement>
    | $Typed<GenericMeasurement>
    | { $type: string }
  /** Person(s) who performed the measurements. Pipe-delimited for multiple. */
  measuredBy?: string
  /** ORCID or other persistent identifier(s) for the measurer(s). Pipe-delimited for multiple. */
  measuredByID?: string
  /** Date the measurements were taken. ISO 8601 format. */
  measurementDate?: string
  /** General protocol or method used (e.g., 'ForestGEO standard protocol', 'mist-net examination'). */
  measurementMethod?: string
  /** Comments or notes about the measurement session. */
  measurementRemarks?: string
  /** Timestamp of record creation in the ATProto PDS. */
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

/** Typed measurements for sessile organisms: trees, woody plants, herbs, grasses, corals, sponges, lichens, and other non-mobile life forms. All numeric values stored as strings. Field descriptions include expected units for DwC-A export mapping. */
export interface FloraMeasurement {
  $type?: 'app.gainforest.dwc.measurement#floraMeasurement'
  /** Diameter at breast height in centimeters. The core measurement in all tree inventories (ForestGEO, NFI, RAINFOR). */
  dbh?: string
  /** Height above ground where DBH was measured, in meters. Important when measured above buttress or irregularity. Default is 1.3m. */
  dbhMeasurementHeight?: string
  /** Circumference of trunk at breast height in centimeters. Alternative to DBH (convertible via pi). */
  girth?: string
  /** Diameter at ground level or just above root flare in centimeters. Standard for shrubs and multi-stemmed plants. */
  basalDiameter?: string
  /** Cross-sectional area of trunk at breast height in square centimeters. */
  basalArea?: string
  /** Number of stems for multi-stemmed individuals. */
  stemCount?: number
  /** Total height from ground to highest living point in meters. */
  totalHeight?: string
  /** Height from ground to first major living branch (bole length) in meters. */
  heightToFirstBranch?: string
  /** Height of buttress roots above ground in meters. Common in tropical trees. */
  buttressHeight?: string
  /** Method used for height measurement. */
  heightMeasurementMethod?:
    | 'clinometer'
    | 'laser-rangefinder'
    | 'hypsometer'
    | 'direct-pole'
    | 'estimated'
    | 'drone-photogrammetry'
    | 'lidar'
    | 'other'
    | (string & {})
  /** Average crown diameter in meters (typically mean of multiple radial measurements). */
  crownDiameter?: string
  /** Vertical extent of crown in meters (total height minus height to crown base). */
  crownDepth?: string
  /** Percentage of ground covered by the canopy of this individual. */
  canopyCoverPercent?: string
  /** Canopy position relative to neighbors. */
  crownPosition?:
    | 'dominant'
    | 'codominant'
    | 'intermediate'
    | 'suppressed'
    | 'emergent'
    | (string & {})
  /** Percentage of crown showing dieback. */
  crownDieback?: string
  /** Estimated aboveground biomass in kilograms, derived from allometric equations. */
  abovegroundBiomass?: string
  /** Estimated belowground (root) biomass in kilograms. */
  belowgroundBiomass?: string
  /** Estimated carbon stored in kilograms of carbon (typically 47-50% of dry biomass). */
  carbonContent?: string
  /** Specific gravity of wood (dry mass / green volume) in grams per cubic centimeter. */
  woodDensity?: string
  /** Reference to the allometric equation used for biomass estimation (e.g., 'Chave et al. 2014'). */
  biomassAllometricEquation?: string
  /** Annual radial growth measured via dendrometer bands or core samples in millimeters per year. */
  annualDiameterIncrement?: string
  /** Estimated age of the organism in years (from rings, radiocarbon, or allometry). */
  estimatedAge?: string
  /** Growth form classification of the organism. */
  growthForm?:
    | 'tree'
    | 'shrub'
    | 'liana'
    | 'palm'
    | 'tree-fern'
    | 'herb'
    | 'grass'
    | 'bamboo'
    | 'epiphyte'
    | 'succulent'
    | 'mangrove'
    | 'other'
    | (string & {})
  /** Overall vitality status of the organism. */
  vitalityStatus?:
    | 'alive'
    | 'dead-standing'
    | 'dead-fallen'
    | 'moribund'
    | 'missing'
    | 'unknown'
    | (string & {})
  /** Numeric health or vigor score (protocol-dependent scale). */
  healthScore?: string
  /** Type of damage observed (e.g., 'broken crown', 'leaning', 'uprooted', 'hollow', 'scarred', 'stripped bark'). */
  damageType?: string
  /** Cause of damage. */
  damageCause?:
    | 'wind'
    | 'lightning'
    | 'fire'
    | 'drought'
    | 'flood'
    | 'animal'
    | 'human'
    | 'disease'
    | 'pest'
    | 'unknown'
    | 'other'
    | (string & {})
  /** Decay classification for dead trees (1-5 scale per ForestGEO/FIA protocols). */
  decayClass?: string
  /** Current flowering/reproductive state. */
  floweringStatus?:
    | 'none'
    | 'budding'
    | 'flowering'
    | 'fruiting'
    | 'senescing'
    | (string & {})
  /** Current phenological state. */
  phenology?:
    | 'leafless'
    | 'flush'
    | 'full-leaf'
    | 'senescing'
    | 'dormant'
    | (string & {})
  /** Leaf area index: total one-sided leaf area per unit ground area (m²/m²). */
  leafAreaIndex?: string
  /** Maximum colony diameter in centimeters (corals, sponges). */
  colonyDiameter?: string
  /** Height of colony from base to apex in centimeters. */
  colonyHeight?: string
  /** Colony growth form. */
  colonyMorphology?:
    | 'massive'
    | 'branching'
    | 'encrusting'
    | 'foliose'
    | 'tabular'
    | 'columnar'
    | 'free-living'
    | 'other'
    | (string & {})
  /** Coral bleaching status. */
  bleachingStatus?:
    | 'none'
    | 'pale'
    | 'partially-bleached'
    | 'fully-bleached'
    | 'recently-dead'
    | (string & {})
  /** Percentage of colony surface with live tissue. */
  liveTissueCoverPercent?: string
  /** Depth of the organism below water surface in meters. */
  depthBelowSurface?: string
  /** Additional measurements not covered by the typed fields above. */
  additionalMeasurements?: MeasurementEntry[]
}

const hashFloraMeasurement = 'floraMeasurement'

export function isFloraMeasurement<V>(v: V) {
  return is$typed(v, id, hashFloraMeasurement)
}

export function validateFloraMeasurement<V>(v: V) {
  return validate<FloraMeasurement & V>(v, id, hashFloraMeasurement)
}

/** Typed measurements for mobile organisms: mammals, birds, reptiles, amphibians, fish, insects, and other animals. Covers morphometrics, health assessments, reproductive measurements, and individual marking data. All numeric values stored as strings. Field descriptions include expected units for DwC-A export mapping. */
export interface FaunaMeasurement {
  $type?: 'app.gainforest.dwc.measurement#faunaMeasurement'
  /** Body mass in grams. */
  bodyMass?: string
  /** Total body length in millimeters (tip of snout/bill to tail tip). */
  totalLength?: string
  /** Head-body length excluding tail in millimeters. */
  headBodyLength?: string
  /** Tail length in millimeters. */
  tailLength?: string
  /** Flattened wing chord length in millimeters (birds). */
  wingLength?: string
  /** Full wingspan tip-to-tip in millimeters (birds, bats). */
  wingspan?: string
  /** Culmen length in millimeters (birds). */
  billLength?: string
  /** Depth of bill at base or gonys in millimeters (birds). */
  billDepth?: string
  /** Tarsometatarsus length in millimeters (birds). */
  tarsusLength?: string
  /** Subcutaneous fat deposit score (0-8 scale, birds). */
  fatScore?: string
  /** Pectoral muscle score (0-3 scale, birds). */
  pectoralMuscleScore?: string
  /** Hind foot length in millimeters (mammals). */
  hindFootLength?: string
  /** Ear length from notch to tip in millimeters (mammals). */
  earLength?: string
  /** Forearm length in millimeters. Standard measurement for bats. */
  forearmLength?: string
  /** Height at shoulder in millimeters (large mammals). */
  shoulderHeight?: string
  /** Snout-vent length (SVL) in millimeters. Standard body measurement for reptiles and amphibians. */
  snoutVentLength?: string
  /** Straight carapace length in millimeters (turtles/tortoises). */
  carapaceLength?: string
  /** Straight carapace width in millimeters (turtles/tortoises). */
  carapaceWidth?: string
  /** Standard length (snout to caudal fin base) in millimeters (fish). */
  standardLength?: string
  /** Fork length (snout to fork of caudal fin) in millimeters (fish). */
  forkLength?: string
  /** Total size of social group observed (herd, flock, pod, colony). */
  groupSize?: number
  /** Number of eggs in nest (birds, reptiles). */
  clutchSize?: number
  /** Number of offspring in litter (mammals). */
  litterSize?: number
  /** Number of surviving young. */
  broodSize?: number
  /** Height of nest above ground in meters. */
  nestHeight?: string
  /** Standardized body condition score (scale varies by taxon: 1-5 or 1-9). */
  bodyConditionScore?: string
  /** Calculated condition index (mass/length ratio or regression residual). */
  bodyConditionIndex?: string
  /** Whether visible injuries exist. */
  injuryPresent?: boolean
  /** Description of injuries (scars, wounds, missing limbs, broken wing). */
  injuryDescription?: string
  /** Whether signs of disease are visible. */
  diseaseSignsPresent?: boolean
  /** Description of disease signs (mange, lesions, tumors, fungal infection, avian pox, chytrid). */
  diseaseDescription?: string
  /** Ectoparasite assessment. */
  ectoparasiteLoad?: 'none' | 'light' | 'moderate' | 'heavy' | (string & {})
  /** Ear tag, flipper tag, fin tag, or wing tag identifier. */
  tagId?: string
  /** Type of tag or mark applied. */
  tagType?:
    | 'ear-tag'
    | 'flipper-tag'
    | 'wing-tag'
    | 'dorsal-tag'
    | 'pit-tag'
    | 'leg-band'
    | 'neck-collar'
    | 'gps-collar'
    | 'radio-transmitter'
    | 'satellite-transmitter'
    | 'paint-mark'
    | 'tattoo'
    | 'toe-clip'
    | 'other'
    | (string & {})
  /** Metal or color band/ring number (birds). */
  bandNumber?: string
  /** Description of color band arrangement (e.g., 'Red/White left, Blue/Metal right'). */
  colorBandCombination?: string
  /** Passive Integrated Transponder (microchip) number. */
  pitTagId?: string
  /** Whether this is a new capture or recapture. */
  recaptureStatus?: 'new' | 'recapture' | 'unknown' | (string & {})
  /** Description of natural marks, scars, or unique identifying features. */
  markDescription?: string
  /** Identifier of tissue, hair, or feather sample collected for genetic analysis. */
  geneticSampleId?: string
  /** Additional measurements not covered by the typed fields above. */
  additionalMeasurements?: MeasurementEntry[]
}

const hashFaunaMeasurement = 'faunaMeasurement'

export function isFaunaMeasurement<V>(v: V) {
  return is$typed(v, id, hashFaunaMeasurement)
}

export function validateFaunaMeasurement<V>(v: V) {
  return validate<FaunaMeasurement & V>(v, id, hashFaunaMeasurement)
}

/** Flexible measurement container for organisms that do not fit the flora/fauna split, or for legacy compatibility. Contains an array of key-value measurement entries. */
export interface GenericMeasurement {
  $type?: 'app.gainforest.dwc.measurement#genericMeasurement'
  /** Array of individual measurements, each with type, value, and optional unit. */
  measurements: MeasurementEntry[]
}

const hashGenericMeasurement = 'genericMeasurement'

export function isGenericMeasurement<V>(v: V) {
  return is$typed(v, id, hashGenericMeasurement)
}

export function validateGenericMeasurement<V>(v: V) {
  return validate<GenericMeasurement & V>(v, id, hashGenericMeasurement)
}

/** A single measurement fact, aligned with one row of the Darwin Core MeasurementOrFact extension. Used in additionalMeasurements arrays and in genericMeasurement. */
export interface MeasurementEntry {
  $type?: 'app.gainforest.dwc.measurement#measurementEntry'
  /** The nature of the measurement (e.g., 'DBH', 'tree height', 'canopy cover', 'tail length', 'soil pH'). */
  measurementType: string
  /** The value of the measurement (e.g., '45.2', 'present', 'blue'). */
  measurementValue: string
  /** The units for the value (e.g., 'cm', 'm', 'kg', '%', 'degrees Celsius'). */
  measurementUnit?: string
  /** Method or instrument used to determine this specific measurement. */
  measurementMethod?: string
  /** Potential error (e.g., '0.5 cm', '5%'). */
  measurementAccuracy?: string
  /** Notes about this specific measurement. */
  measurementRemarks?: string
}

const hashMeasurementEntry = 'measurementEntry'

export function isMeasurementEntry<V>(v: V) {
  return is$typed(v, id, hashMeasurementEntry)
}

export function validateMeasurementEntry<V>(v: V) {
  return validate<MeasurementEntry & V>(v, id, hashMeasurementEntry)
}
