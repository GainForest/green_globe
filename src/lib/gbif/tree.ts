/**
 * GBIF / Darwin Core aligned type definitions for tree observations.
 *
 * These interfaces mirror Darwin Core classes so that tree data exported
 * can be transformed into GBIF-ready Darwin Core Archives.
 *
 * Reference: https://dwc.tdwg.org/terms/
 */

/**
 * Darwin Core recommended vocabulary for dwc:basisOfRecord.
 * @see https://dwc.tdwg.org/terms/#dwc:basisOfRecord
 */
export type DarwinCoreBasisOfRecord =
  | 'HumanObservation'
  | 'MachineObservation'
  | 'MaterialSample'
  | 'LivingSpecimen'
  | 'PreservedSpecimen'
  | 'FossilSpecimen'
  | 'Observation'
  | string

/**
 * Darwin Core recommended vocabulary for dwc:occurrenceStatus.
 * @see https://dwc.tdwg.org/terms/#dwc:occurrenceStatus
 */
export type DarwinCoreOccurrenceStatus = 'present' | 'absent' | string

export type DynamicPropertyValue =
  | string
  | number
  | boolean
  | null
  | DynamicPropertyValue[]
  | { [key: string]: DynamicPropertyValue }

/**
 * Core occurrence record describing the individual tree observation.
 * Properties correspond to Darwin Core terms.
 */
export interface DarwinCoreOccurrence {
  /** dwc:occurrenceID — stable identifier for the occurrence (maps from tree id). */
  occurrenceID: string
  /** dwc:organismID — identifier for the tree organism. */
  organismID?: string
  /** dwc:eventID — identifier of the measurement or observation event. */
  eventID?: string
  /** dwc:basisOfRecord — type of record (HumanObservation recommended for tree measurements). */
  basisOfRecord?: DarwinCoreBasisOfRecord
  /** dwc:occurrenceStatus — typically 'present'. */
  occurrenceStatus?: DarwinCoreOccurrenceStatus
  /** dwc:recordedBy — person(s) responsible for the observation (collection_info.measured_by). */
  recordedBy?: string
  /** dwc:recordedByID — identifier for the observer (email or DID). */
  recordedByID?: string
  /** dwc:recordNumber — field number or survey code. */
  recordNumber?: string
  /** dwc:institutionCode — code representing the owning organization. */
  institutionCode?: string
  /** dwc:collectionCode — collection subset identifier when applicable. */
  collectionCode?: string
  /** dwc:datasetID — identifier for the source dataset (e.g., site record DID). */
  datasetID?: string
  /** dwc:datasetName — human readable dataset name or site name. */
  datasetName?: string
  /** dwc:occurrenceRemarks — free-text notes about the tree occurrence. */
  occurrenceRemarks?: string
  /**
   * dwc:dynamicProperties — structured metadata encoded as JSON.
   * Use to persist Gainforest-specific fields (e.g., planting info).
   */
  dynamicProperties?: Record<string, DynamicPropertyValue>
  /**
   * dwc:associatedMedia — list of media URIs linked to the occurrence.
   * Use alongside {@link TreeMedia.reference}.
   */
  associatedMedia?: string[]
}

/**
 * Darwin Core Event capturing planting or monitoring context.
 */
export interface DarwinCoreEvent {
  /** dwc:eventID — identifier for the event (e.g., planting or monitoring session). */
  eventID?: string
  /** dwc:parentEventID — identifier of a broader campaign or site visit. */
  parentEventID?: string
  /** dwc:eventDate — ISO 8601 timestamp of the event (date_planted or date_measured). */
  eventDate?: string
  /** dwc:eventTime — time portion of the event when separate capture is required. */
  eventTime?: string
  /** dwc:startDayOfYear — 1-366 day number. */
  startDayOfYear?: number
  /** dwc:endDayOfYear — 1-366 day number. */
  endDayOfYear?: number
  /** dwc:samplingProtocol — e.g., "Gainforest Tree Measurement v1". */
  samplingProtocol?: string
  /** dwc:samplingEffort — descriptive effort statement. */
  samplingEffort?: string
  /** dwc:habitat — description of the site habitat. */
  habitat?: string
  /** dwc:eventRemarks — additional comments about the event. */
  eventRemarks?: string
}

/**
 * Darwin Core Location information for a tree occurrence.
 */
export interface DarwinCoreLocation {
  /** dwc:decimalLatitude — WGS84 latitude in decimal degrees. */
  decimalLatitude: string
  /** dwc:decimalLongitude — WGS84 longitude in decimal degrees. */
  decimalLongitude: string
  /** dwc:geodeticDatum — defaults to "WGS84" for Gainforest datasets. */
  geodeticDatum?: string
  /** dwc:coordinateUncertaintyInMeters — positional accuracy. */
  coordinateUncertaintyInMeters?: number
  /** dwc:coordinatePrecision — precision of coordinates. */
  coordinatePrecision?: number
  /** dwc:locality — local place name (e.g., plot or village). */
  locality?: string
  /** dwc:municipality — municipality or district. */
  municipality?: string
  /** dwc:county — sub-national administrative area. */
  county?: string
  /** dwc:stateProvince — state or province. */
  stateProvince?: string
  /** dwc:country — country name. */
  country?: string
  /** dwc:countryCode — two-letter ISO country code. */
  countryCode?: string
  /** dwc:minimumElevationInMeters — lower elevation bound. */
  minimumElevationInMeters?: number
  /** dwc:maximumElevationInMeters — upper elevation bound. */
  maximumElevationInMeters?: number
  /** dwc:locationRemarks — free-text description of location. */
  locationRemarks?: string
}

/**
 * Darwin Core Taxon description for the tree.
 * @see https://dwc.tdwg.org/terms/#taxon
 */
export interface DarwinCoreTaxon {
  /** dwc:scientificName — binomial or vernacular scientific name. */
  scientificName?: string
  /** dwc:kingdom */
  kingdom?: string
  /** dwc:phylum */
  phylum?: string
  /** dwc:class */
  class?: string
  /** dwc:order */
  order?: string
  /** dwc:family */
  family?: string
  /** dwc:genus */
  genus?: string
  /** dwc:specificEpithet — epithet portion of the scientific name. */
  specificEpithet?: string
  /** dwc:infraspecificEpithet */
  infraspecificEpithet?: string
  /** dwc:taxonRank — e.g., "species", "genus". */
  taxonRank?: string
  /** dwc:vernacularName — common name. */
  vernacularName?: string
  /** dwc:taxonRemarks — additional taxonomic comments. */
  taxonRemarks?: string
}

/**
 * Darwin Core Identification block to describe the determination of the taxon.
 */
export interface DarwinCoreIdentification {
  /** dwc:identificationID — identifier for this identification assertion. */
  identificationID?: string
  /** dwc:identifiedBy — person(s) who determined the species. */
  identifiedBy?: string
  /** dwc:identifiedByID — identifier for the determiner (e.g., email or ORCID). */
  identifiedByID?: string
  /** dwc:dateIdentified — timestamp of the determination. */
  dateIdentified?: string
  /** dwc:identificationReferences — references supporting the ID. */
  identificationReferences?: string[]
  /** dwc:identificationRemarks — notes about the determination. */
  identificationRemarks?: string
  /** dwc:identificationVerificationStatus — e.g., "validated", "unverified". */
  identificationVerificationStatus?: string
  /** dwc:identificationQualifier — qualifier such as "cf." or "aff.". */
  identificationQualifier?: string
}

/**
 * Darwin Core MeasurementOrFact entry.
 * @see https://dwc.tdwg.org/terms/#measurementorfact
 */
export interface DarwinCoreMeasurementOrFact {
  /** dwc:measurementID — identifier for the measurement record. */
  measurementID?: string
  /** dwc:measurementType — description of the measured variable. */
  measurementType: string
  /** dwc:measurementValue — value recorded (as string to preserve precision). */
  measurementValue: string
  /** dwc:measurementUnit — unit of measure, recommended to use UCUM codes. */
  measurementUnit?: string
  /** dwc:measurementAccuracy — measurement accuracy or error. */
  measurementAccuracy?: string
  /** dwc:measurementDeterminedBy — person(s) who captured the measurement. */
  measurementDeterminedBy?: string
  /** dwc:measurementDeterminedDate — ISO timestamp of measurement. */
  measurementDeterminedDate?: string
  /** dwc:measurementMethod — description of how measurement was obtained. */
  measurementMethod?: string
  /** dwc:measurementRemarks — additional measurement notes. */
  measurementRemarks?: string
}

export const TREE_MEASUREMENT_TYPES = {
  HeightCm: 'treeHeight',
  DiameterBreastHeightCm: 'diameterBreastHeight',
} as const

export type TreeMeasurementType =
  (typeof TREE_MEASUREMENT_TYPES)[keyof typeof TREE_MEASUREMENT_TYPES] | string

/**
 * Gainforest specialisation for tree measurements.
 * measurementUnit defaults to centimeters when not provided.
 */
export interface TreeMeasurement extends DarwinCoreMeasurementOrFact {
  measurementType: TreeMeasurementType
  measurementUnit?: string
}

export const TREE_MEDIA_PRIMARY_ROLES = ['leaf', 'bark', 'trunk', 'tree'] as const

export type TreeMediaRole =
  | (typeof TREE_MEDIA_PRIMARY_ROLES)[number]
  | `leaf_${string}`
  | `trunk_${string}`
  | `bark_${string}`
  | `tree_${string}`
  | string

/**
 * Reference to media stored either externally (URI) or in the Gainforest PDS (CID).
 */
export type TreeMediaReference =
  | {
      kind: 'uri'
      uri: string
    }
  | {
      kind: 'pdsBlob'
      cid: string
      mimeType?: string
    }

/**
 * Simple Multimedia extension entry tailored for tree assets.
 * @see https://dwc.tdwg.org/terms/#simplemultimedia
 */
export interface TreeMedia {
  /** Identifier or URL for the media item (dcterms:identifier). */
  identifier?: string
  /** dcterms:type — e.g., "StillImage", "MovingImage", "Sound". */
  type?: string
  /** dc:format — MIME type such as image/jpeg. */
  format?: string
  /** dc:title — short caption for the asset. */
  title?: string
  /** dc:description — descriptive text. */
  description?: string
  /** dcterms:created — ISO 8601 timestamp when media was captured. */
  created?: string
  /** dcterms:license */
  license?: string
  /** dcterms:rightsHolder */
  rightsHolder?: string
  /** dcterms:creator */
  creator?: string
  /** dcterms:publisher */
  publisher?: string
  /** dcterms:references — related links such as Kobo or S3 originals. */
  references?: string[]
  /** Gainforest media role(s), aligns with field crews capture protocol. */
  roles?: TreeMediaRole[]
  /**
   * Resource reference indicating where the media is stored.
   * Use associatedMedia on the occurrence to list externally resolvable URIs.
   */
  reference: TreeMediaReference
}

/**
 * Structured note that maps to Darwin Core occurrenceRemarks or dynamicProperties.
 */
export interface TreeAnnotation {
  /** Short label for the note (stored in occurrenceRemarks or dynamicProperties). */
  title: string
  /** Detailed note body. */
  description?: string
  /** Structured properties retained in dynamicProperties. */
  data?: Record<string, DynamicPropertyValue>
  /** Optional target section the annotation describes. */
  target?:
    | 'occurrence'
    | 'event'
    | 'plantingEvent'
    | 'location'
    | 'measurement'
    | 'media'
    | string
}

/**
 * Provenance metadata linking the tree record back to source GeoJSON or surveys.
 */
export interface TreeProvenance {
  /** Relative or absolute URI to the source file. */
  sourceFile?: string
  /** Identifier of the feature inside the source file. */
  sourceFeatureId?: string
  /** Identifier of the organization/site within Gainforest. */
  organizationHandle?: string
  /** Additional provenance remarks. */
  remarks?: string
}

/**
 * Aggregate Gainforest tree data structure composed of Darwin Core fragments.
 */
export interface GainforestGbifTreeRecord {
  /** Occurrence core record (required for GBIF exports). */
  occurrence: DarwinCoreOccurrence
  /** Measurement or monitoring event. */
  monitoringEvent?: DarwinCoreEvent
  /** Separate planting event data when available. */
  plantingEvent?: DarwinCoreEvent
  /** Physical location of the tree. */
  location: DarwinCoreLocation
  /** Taxonomic classification details. */
  taxon?: DarwinCoreTaxon
  /** Identification metadata. */
  identification?: DarwinCoreIdentification
  /** Measurements captured for the tree (height, DBH, etc.). */
  measurements?: TreeMeasurement[]
  /** Media assets linked to the tree. */
  media?: TreeMedia[]
  /** Field notes or supplemental annotations. */
  annotations?: TreeAnnotation[]
  /** Provenance connecting back to source data. */
  provenance?: TreeProvenance
}
