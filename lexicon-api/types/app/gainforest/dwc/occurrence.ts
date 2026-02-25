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
import type * as AppGainforestDwcDefs from './defs.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'app.gainforest.dwc.occurrence'

export interface Record {
  $type: 'app.gainforest.dwc.occurrence'
  /** A globally unique identifier for the occurrence record. Recommended: a persistent URI (e.g., DOI, LSID, or UUID-based URI). */
  occurrenceID?: string
  /** The specific nature of the data record. Must be one of the Darwin Core class names. */
  basisOfRecord:
    | 'HumanObservation'
    | 'MachineObservation'
    | 'PreservedSpecimen'
    | 'LivingSpecimen'
    | 'FossilSpecimen'
    | 'MaterialSample'
    | 'MaterialEntity'
    | 'MaterialCitation'
  /** The Dublin Core type class that best describes the resource (dc:type). */
  dcType?:
    | 'PhysicalObject'
    | 'StillImage'
    | 'MovingImage'
    | 'Sound'
    | 'Text'
    | 'Event'
    | 'Dataset'
  /** A legal document giving official permission to do something with the record. Recommended: a Creative Commons URI (e.g., 'http://creativecommons.org/licenses/by/4.0/'). */
  license?: string
  /** Person or organization owning or managing rights over the resource. */
  rightsHolder?: string
  /** The name or acronym of the institution having custody of the object(s) or information in the record. */
  institutionCode?: string
  /** The name, acronym, or code identifying the collection or dataset from which the record was derived. */
  collectionCode?: string
  /** The name identifying the dataset from which the record was derived. */
  datasetName?: string
  /** A description of what information is withheld from this record and why (e.g., 'coordinates generalized to protect endangered species'). */
  informationWithheld?: string
  /** A description of actions taken to make the data less specific or complete (e.g., 'coordinates rounded to nearest 0.1 degree'). */
  dataGeneralizations?: string
  /** A related resource that is referenced, cited, or otherwise pointed to by the record (URL). */
  references?: string
  /** Person(s) responsible for recording the occurrence in the field. Pipe-delimited for multiple (e.g., 'Jane Smith | John Doe'). */
  recordedBy?: string
  /** Persistent identifier(s) (e.g., ORCID) of the person(s) who recorded. Pipe-delimited for multiple. */
  recordedByID?: string
  /** The number of individuals present at the time of the occurrence. */
  individualCount?: number
  /** A number or enumeration value for the quantity of organisms (e.g., '27', '12.5', 'many'). */
  organismQuantity?: string
  /** The type of quantification system used for organismQuantity (e.g., 'individuals', '% biomass', 'stems/ha'). */
  organismQuantityType?: string
  /** The sex of the biological individual(s). */
  sex?: 'male' | 'female' | 'hermaphrodite'
  /** The age class or life stage at the time of occurrence (e.g., 'adult', 'juvenile', 'larva', 'seedling', 'sapling'). */
  lifeStage?: string
  /** The reproductive condition at the time of occurrence (e.g., 'flowering', 'fruiting', 'budding', 'pregnant'). */
  reproductiveCondition?: string
  /** The behavior shown by the subject at the time of occurrence (e.g., 'foraging', 'nesting', 'roosting'). */
  behavior?: string
  /** Statement about the presence or absence of a taxon at a location. */
  occurrenceStatus?: 'present' | 'absent'
  /** Comments or notes about the occurrence. */
  occurrenceRemarks?: string
  /** Identifiers (URIs) of media associated with the occurrence. Pipe-delimited for multiple. */
  associatedMedia?: string
  /** Identifiers (URIs) of literature associated with the occurrence. Pipe-delimited for multiple. */
  associatedReferences?: string
  /** Identifiers (URIs) of genetic sequence information associated with the occurrence. Pipe-delimited for multiple. */
  associatedSequences?: string
  /** Identifiers of other occurrences associated with this one (e.g., parasite-host). Pipe-delimited. */
  associatedOccurrences?: string
  /** Identifier for the sampling event. Can be used to group occurrences from the same event. */
  eventID?: string
  /** AT-URI reference to an app.gainforest.dwc.event record (for star-schema linkage). */
  eventRef?: string
  /** The date or date-time (or interval) during which the occurrence was recorded. ISO 8601 format (e.g., '2024-03-15', '2024-03-15T10:30:00Z', '2024-03/2024-06'). */
  eventDate: string
  /** The time of the event. ISO 8601 format (e.g., '14:30:00', '14:30:00+02:00'). */
  eventTime?: string
  /** A description of the habitat in which the event occurred (e.g., 'tropical rainforest', 'mangrove swamp', 'montane cloud forest'). */
  habitat?: string
  /** The method or protocol used during the event (e.g., 'camera trap', 'point count', 'mist net', '20m x 20m plot survey', 'acoustic monitoring'). */
  samplingProtocol?: string
  /** The amount of effort expended during the event (e.g., '2 trap-nights', '30 minutes', '10 km transect'). */
  samplingEffort?: string
  /** Notes or reference to notes taken in the field about the event. */
  fieldNotes?: string
  /** Identifier for the location (e.g., a reference to a named site). */
  locationID?: string
  /** Geographic latitude in decimal degrees (WGS84). Positive values are north of the Equator. Range: -90 to 90. */
  decimalLatitude?: string
  /** Geographic longitude in decimal degrees (WGS84). Positive values are east of the Greenwich Meridian. Range: -180 to 180. */
  decimalLongitude?: string
  /** The spatial reference system for the coordinates. Recommended: 'EPSG:4326' (WGS84). */
  geodeticDatum?: string
  /** Horizontal distance (meters) from the given coordinates describing the smallest circle containing the whole location. */
  coordinateUncertaintyInMeters?: number
  /** The name of the country or major administrative unit. */
  country?: string
  /** The standard code for the country (ISO 3166-1 alpha-2). */
  countryCode?: string
  /** The name of the next smaller administrative region than country. */
  stateProvince?: string
  /** The full, unabbreviated name of the next smaller administrative region than stateProvince. */
  county?: string
  /** The full, unabbreviated name of the next smaller administrative region than county. */
  municipality?: string
  /** The specific description of the place (e.g., '500m upstream of bridge on Rio Pará'). */
  locality?: string
  /** The original textual description of the place as provided by the recorder. */
  verbatimLocality?: string
  /** The lower limit of the range of elevation (in meters above sea level). */
  minimumElevationInMeters?: number
  /** The upper limit of the range of elevation (in meters above sea level). */
  maximumElevationInMeters?: number
  /** The lesser depth of a range of depth below the local surface (in meters). */
  minimumDepthInMeters?: number
  /** The greater depth of a range of depth below the local surface (in meters). */
  maximumDepthInMeters?: number
  /** Comments about the location. */
  locationRemarks?: string
  /** GBIF backbone taxonomy key for the identified taxon. Retained for backward compatibility with existing GainForest workflows. */
  gbifTaxonKey?: string
  /** The full scientific name, with authorship and date if known (e.g., 'Centropyge flavicauda Fraser-Brunner 1933'). */
  scientificName: string
  /** The authorship information for the scientific name (e.g., 'Fraser-Brunner 1933'). */
  scientificNameAuthorship?: string
  /** The full scientific name of the kingdom (e.g., 'Animalia', 'Plantae', 'Fungi'). */
  kingdom?: string
  /** The full scientific name of the phylum or division. */
  phylum?: string
  /** The full scientific name of the class. */
  class?: string
  /** The full scientific name of the order. */
  order?: string
  /** The full scientific name of the family. */
  family?: string
  /** The full scientific name of the genus. */
  genus?: string
  /** The name of the species epithet of the scientificName. */
  specificEpithet?: string
  /** The name of the lowest or terminal infraspecific epithet. */
  infraspecificEpithet?: string
  /** The taxonomic rank of the most specific name in scientificName. */
  taxonRank?:
    | 'kingdom'
    | 'phylum'
    | 'class'
    | 'order'
    | 'family'
    | 'subfamily'
    | 'genus'
    | 'subgenus'
    | 'species'
    | 'subspecies'
    | 'variety'
    | 'form'
  /** A common or vernacular name for the taxon. */
  vernacularName?: string
  /** The status of the use of the scientificName (e.g., 'accepted', 'synonym', 'doubtful'). */
  taxonomicStatus?: string
  /** The nomenclatural code under which the scientificName is constructed. */
  nomenclaturalCode?: 'ICZN' | 'ICN' | 'ICNP' | 'ICTV' | 'BioCode'
  /** A complete list of taxa names terminating at the rank immediately superior to the taxon. Pipe-delimited (e.g., 'Animalia|Chordata|Mammalia|Rodentia|Ctenomyidae|Ctenomys'). */
  higherClassification?: string
  /** Person(s) who assigned the taxon to the occurrence. Pipe-delimited for multiple. */
  identifiedBy?: string
  /** Persistent identifier(s) (e.g., ORCID) of the person(s) who identified. Pipe-delimited. */
  identifiedByID?: string
  /** The date on which the identification was made. ISO 8601 format. */
  dateIdentified?: string
  /** A brief phrase or standard term qualifying the identification (e.g., 'cf. agrestis', 'aff. agrestis'). */
  identificationQualifier?: string
  /** Comments or notes about the identification. */
  identificationRemarks?: string
  /** Previous assignments of names to the occurrence. Pipe-delimited. */
  previousIdentifications?: string
  /** Additional structured data as a valid JSON string (per Simple DwC Section 7.1). Example: '{"iucnStatus":"vulnerable","canopyCover":"85%"}'. Should be flattened to a single line with no non-printing characters. */
  dynamicProperties?: string
  imageEvidence?: AppGainforestCommonDefs.Image
  trunkEvidence?: AppGainforestCommonDefs.Image
  leafEvidence?: AppGainforestCommonDefs.Image
  barkEvidence?: AppGainforestCommonDefs.Image
  audioEvidence?: AppGainforestCommonDefs.Audio
  videoEvidence?: AppGainforestCommonDefs.Video
  spectrogramEvidence?: AppGainforestCommonDefs.Spectrogram
  /** Timestamp of record creation in the ATProto PDS. */
  createdAt: string
  conservationStatus?: AppGainforestCommonDefs.ConservationStatus
  plantTraits?: AppGainforestDwcDefs.PlantTraits
  /** AT-URI reference to the organization info record for the project this occurrence belongs to. */
  projectRef?: string
  /** AT-URI reference to the site record where this occurrence was observed. */
  siteRef?: string
  /** Name of the monitoring programme under which this occurrence was recorded. */
  monitoringProgramme?: string
  /** AT-URI reference to a dataset record this occurrence belongs to. */
  datasetRef?: string
  /** URL to a thumbnail image for display in lists and cards. */
  thumbnailUrl?: string
  /** URL to a representative species image. */
  speciesImageUrl?: string
  [k: string]: unknown
}

const hashRecord = 'main'

export function isRecord<V>(v: V) {
  return is$typed(v, id, hashRecord)
}

export function validateRecord<V>(v: V) {
  return validate<Record & V>(v, id, hashRecord, true)
}
