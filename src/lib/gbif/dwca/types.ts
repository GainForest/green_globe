// DwC-A shared types, constants, and field mappings
// No runtime dependencies — purely types and constants

// ---------------------------------------------------------------------------
// Utility constants
// ---------------------------------------------------------------------------

export const TAB = '\t'
export const NEWLINE = '\n'

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

export type DwcaOccurrenceRow = {
  occurrenceID?: string
  basisOfRecord?: string
  eventDate?: string
  scientificName?: string
  kingdom?: string
  phylum?: string
  class?: string
  order?: string
  family?: string
  genus?: string
  specificEpithet?: string
  taxonRank?: string
  vernacularName?: string
  decimalLatitude?: string
  decimalLongitude?: string
  geodeticDatum?: string
  coordinateUncertaintyInMeters?: string
  country?: string
  countryCode?: string
  stateProvince?: string
  locality?: string
  recordedBy?: string
  datasetName?: string
  institutionCode?: string
  associatedMedia?: string
  occurrenceRemarks?: string
  dynamicProperties?: string
  occurrenceStatus?: string
  individualCount?: string
  sex?: string
  lifeStage?: string
  habitat?: string
  samplingProtocol?: string
}

export type DwcaMeasurementRow = {
  coreid?: string
  measurementID?: string
  measurementType?: string
  measurementValue?: string
  measurementUnit?: string
  measurementAccuracy?: string
  measurementDeterminedBy?: string
  measurementDeterminedDate?: string
  measurementMethod?: string
  measurementRemarks?: string
}

export type DwcaMultimediaRow = {
  coreid?: string
  identifier?: string
  type?: 'StillImage' | 'MovingImage' | 'Sound'
  format?: string
  title?: string
  description?: string
  created?: string
  creator?: string
  license?: string
  rightsHolder?: string
  publisher?: string
}

export type DwcaEmlInput = {
  datasetTitle: string
  datasetId?: string
  abstract: string
  license: 'CC0' | 'CC-BY' | 'CC-BY-NC'
  licenseVersion?: string
  organizationName: string
  contactEmail: string
  contactName: string
  pubDate?: string
  language?: string
  westBound?: number
  eastBound?: number
  northBound?: number
  southBound?: number
  startDate?: string
  endDate?: string
  keywords?: string[]
}

export type DwcaArchiveFiles = Record<string, string>

// ---------------------------------------------------------------------------
// TSV column order constants
// ---------------------------------------------------------------------------

export const OCCURRENCE_TSV_COLUMNS: string[] = [
  'occurrenceID',
  'basisOfRecord',
  'eventDate',
  'scientificName',
  'kingdom',
  'phylum',
  'class',
  'order',
  'family',
  'genus',
  'specificEpithet',
  'taxonRank',
  'vernacularName',
  'decimalLatitude',
  'decimalLongitude',
  'geodeticDatum',
  'coordinateUncertaintyInMeters',
  'country',
  'countryCode',
  'stateProvince',
  'locality',
  'recordedBy',
  'datasetName',
  'institutionCode',
  'associatedMedia',
  'occurrenceRemarks',
  'dynamicProperties',
  'occurrenceStatus',
  'individualCount',
  'sex',
  'lifeStage',
  'habitat',
  'samplingProtocol',
]

export const MEASUREMENT_TSV_COLUMNS: string[] = [
  'coreid',
  'measurementID',
  'measurementType',
  'measurementValue',
  'measurementUnit',
  'measurementAccuracy',
  'measurementDeterminedBy',
  'measurementDeterminedDate',
  'measurementMethod',
  'measurementRemarks',
]

export const MULTIMEDIA_TSV_COLUMNS: string[] = [
  'coreid',
  'identifier',
  'type',
  'format',
  'title',
  'description',
  'created',
  'creator',
  'license',
  'rightsHolder',
  'publisher',
]

// ---------------------------------------------------------------------------
// Row type URIs
// ---------------------------------------------------------------------------

export const DWCA_ROW_TYPES = {
  occurrence: 'http://rs.tdwg.org/dwc/terms/Occurrence',
  measurement: 'http://rs.tdwg.org/dwc/terms/MeasurementOrFact',
  multimedia: 'http://rs.gbif.org/terms/1.0/Multimedia',
} as const

// ---------------------------------------------------------------------------
// Term URIs (coreid is intentionally absent — it is the linking column)
// ---------------------------------------------------------------------------

export const DWCA_TERM_URIS: Record<string, string> = {
  // Occurrence core fields
  occurrenceID: 'http://rs.tdwg.org/dwc/terms/occurrenceID',
  basisOfRecord: 'http://rs.tdwg.org/dwc/terms/basisOfRecord',
  eventDate: 'http://rs.tdwg.org/dwc/terms/eventDate',
  scientificName: 'http://rs.tdwg.org/dwc/terms/scientificName',
  kingdom: 'http://rs.tdwg.org/dwc/terms/kingdom',
  phylum: 'http://rs.tdwg.org/dwc/terms/phylum',
  class: 'http://rs.tdwg.org/dwc/terms/class',
  order: 'http://rs.tdwg.org/dwc/terms/order',
  family: 'http://rs.tdwg.org/dwc/terms/family',
  genus: 'http://rs.tdwg.org/dwc/terms/genus',
  specificEpithet: 'http://rs.tdwg.org/dwc/terms/specificEpithet',
  taxonRank: 'http://rs.tdwg.org/dwc/terms/taxonRank',
  vernacularName: 'http://rs.tdwg.org/dwc/terms/vernacularName',
  decimalLatitude: 'http://rs.tdwg.org/dwc/terms/decimalLatitude',
  decimalLongitude: 'http://rs.tdwg.org/dwc/terms/decimalLongitude',
  geodeticDatum: 'http://rs.tdwg.org/dwc/terms/geodeticDatum',
  coordinateUncertaintyInMeters:
    'http://rs.tdwg.org/dwc/terms/coordinateUncertaintyInMeters',
  country: 'http://rs.tdwg.org/dwc/terms/country',
  countryCode: 'http://rs.tdwg.org/dwc/terms/countryCode',
  stateProvince: 'http://rs.tdwg.org/dwc/terms/stateProvince',
  locality: 'http://rs.tdwg.org/dwc/terms/locality',
  recordedBy: 'http://rs.tdwg.org/dwc/terms/recordedBy',
  datasetName: 'http://rs.tdwg.org/dwc/terms/datasetName',
  institutionCode: 'http://rs.tdwg.org/dwc/terms/institutionCode',
  associatedMedia: 'http://rs.tdwg.org/dwc/terms/associatedMedia',
  occurrenceRemarks: 'http://rs.tdwg.org/dwc/terms/occurrenceRemarks',
  dynamicProperties: 'http://rs.tdwg.org/dwc/terms/dynamicProperties',
  occurrenceStatus: 'http://rs.tdwg.org/dwc/terms/occurrenceStatus',
  individualCount: 'http://rs.tdwg.org/dwc/terms/individualCount',
  sex: 'http://rs.tdwg.org/dwc/terms/sex',
  lifeStage: 'http://rs.tdwg.org/dwc/terms/lifeStage',
  habitat: 'http://rs.tdwg.org/dwc/terms/habitat',
  samplingProtocol: 'http://rs.tdwg.org/dwc/terms/samplingProtocol',
  // MeasurementOrFact extension fields
  measurementID: 'http://rs.tdwg.org/dwc/terms/measurementID',
  measurementType: 'http://rs.tdwg.org/dwc/terms/measurementType',
  measurementValue: 'http://rs.tdwg.org/dwc/terms/measurementValue',
  measurementUnit: 'http://rs.tdwg.org/dwc/terms/measurementUnit',
  measurementAccuracy: 'http://rs.tdwg.org/dwc/terms/measurementAccuracy',
  measurementDeterminedBy:
    'http://rs.tdwg.org/dwc/terms/measurementDeterminedBy',
  measurementDeterminedDate:
    'http://rs.tdwg.org/dwc/terms/measurementDeterminedDate',
  measurementMethod: 'http://rs.tdwg.org/dwc/terms/measurementMethod',
  measurementRemarks: 'http://rs.tdwg.org/dwc/terms/measurementRemarks',
  // Simple Multimedia extension fields (Dublin Core terms)
  identifier: 'http://purl.org/dc/terms/identifier',
  type: 'http://purl.org/dc/terms/type',
  format: 'http://purl.org/dc/terms/format',
  title: 'http://purl.org/dc/terms/title',
  description: 'http://purl.org/dc/terms/description',
  created: 'http://purl.org/dc/terms/created',
  creator: 'http://purl.org/dc/terms/creator',
  license: 'http://purl.org/dc/terms/license',
  rightsHolder: 'http://purl.org/dc/terms/rightsHolder',
  publisher: 'http://purl.org/dc/terms/publisher',
}

// ---------------------------------------------------------------------------
// License constants
// ---------------------------------------------------------------------------

export const GBIF_LICENSES: Record<string, string> = {
  CC0: 'http://creativecommons.org/publicdomain/zero/1.0/legalcode',
  'CC-BY': 'http://creativecommons.org/licenses/by/4.0/legalcode',
  'CC-BY-NC': 'http://creativecommons.org/licenses/by-nc/4.0/legalcode',
}

export const GBIF_LICENSE_TITLES: Record<string, string> = {
  CC0: 'Creative Commons Public Domain (CC0 1.0) License',
  'CC-BY': 'Creative Commons Attribution (CC-BY) 4.0 License',
  'CC-BY-NC':
    'Creative Commons Attribution Non Commercial (CC-BY-NC) 4.0 License',
}
