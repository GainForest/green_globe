// GBIF Registry API types — matches GBIF Registry OpenAPI spec
// No HTTP calls — purely types and constants

// ---------------------------------------------------------------------------
// Enums (as const objects + derived types)
// ---------------------------------------------------------------------------

export const DatasetType = {
  OCCURRENCE: 'OCCURRENCE',
  CHECKLIST: 'CHECKLIST',
  METADATA: 'METADATA',
  SAMPLING_EVENT: 'SAMPLING_EVENT',
} as const
export type DatasetType = (typeof DatasetType)[keyof typeof DatasetType]

export const EndpointType = {
  DWC_ARCHIVE: 'DWC_ARCHIVE',
  EML: 'EML',
  CAMTRAP_DP: 'CAMTRAP_DP',
  COLDP: 'COLDP',
  BIOCASE: 'BIOCASE',
  BIOCASE_XML_ARCHIVE: 'BIOCASE_XML_ARCHIVE',
  DIGIR: 'DIGIR',
  DIGIR_MANIS: 'DIGIR_MANIS',
  TAPIR: 'TAPIR',
  OAI_PMH: 'OAI_PMH',
  OTHER: 'OTHER',
} as const
export type EndpointType = (typeof EndpointType)[keyof typeof EndpointType]

export const InstallationType = {
  IPT_INSTALLATION: 'IPT_INSTALLATION',
  HTTP_INSTALLATION: 'HTTP_INSTALLATION',
  BIOCASE_INSTALLATION: 'BIOCASE_INSTALLATION',
  DIGIR_INSTALLATION: 'DIGIR_INSTALLATION',
  TAPIR_INSTALLATION: 'TAPIR_INSTALLATION',
  OTHER_INSTALLATION: 'OTHER_INSTALLATION',
} as const
export type InstallationType =
  (typeof InstallationType)[keyof typeof InstallationType]

export const ContactType = {
  ADMINISTRATIVE_POINT_OF_CONTACT: 'ADMINISTRATIVE_POINT_OF_CONTACT',
  TECHNICAL_POINT_OF_CONTACT: 'TECHNICAL_POINT_OF_CONTACT',
  ORIGINATOR: 'ORIGINATOR',
  METADATA_AUTHOR: 'METADATA_AUTHOR',
  POINT_OF_CONTACT: 'POINT_OF_CONTACT',
  PRINCIPAL_INVESTIGATOR: 'PRINCIPAL_INVESTIGATOR',
} as const
export type ContactType = (typeof ContactType)[keyof typeof ContactType]

export const ValidationStatus = {
  DOWNLOADING: 'DOWNLOADING',
  SUBMITTED: 'SUBMITTED',
  RUNNING: 'RUNNING',
  FINISHED: 'FINISHED',
  ABORTED: 'ABORTED',
  FAILED: 'FAILED',
  QUEUED: 'QUEUED',
} as const
export type ValidationStatus =
  (typeof ValidationStatus)[keyof typeof ValidationStatus]

export const CrawlFinishReason = {
  NORMAL: 'NORMAL',
  USER_ABORT: 'USER_ABORT',
  ABORT: 'ABORT',
  NOT_MODIFIED: 'NOT_MODIFIED',
  UNKNOWN: 'UNKNOWN',
} as const
export type CrawlFinishReason =
  (typeof CrawlFinishReason)[keyof typeof CrawlFinishReason]

export const ProcessState = {
  EMPTY: 'EMPTY',
  RUNNING: 'RUNNING',
  FINISHED: 'FINISHED',
} as const
export type ProcessState = (typeof ProcessState)[keyof typeof ProcessState]

export const FileFormat = {
  DWCA: 'DWCA',
  XML: 'XML',
  TABULAR: 'TABULAR',
  SPREADSHEET: 'SPREADSHEET',
} as const
export type FileFormat = (typeof FileFormat)[keyof typeof FileFormat]

export const License = {
  CC0_1_0: 'CC0_1_0',
  CC_BY_4_0: 'CC_BY_4_0',
  CC_BY_NC_4_0: 'CC_BY_NC_4_0',
  UNSPECIFIED: 'UNSPECIFIED',
  UNSUPPORTED: 'UNSUPPORTED',
} as const
export type License = (typeof License)[keyof typeof License]

// ---------------------------------------------------------------------------
// Machine tag type (used by GbifEndpoint)
// ---------------------------------------------------------------------------

export type GbifMachineTag = {
  key?: number
  namespace: string
  name: string
  value: string
}

// ---------------------------------------------------------------------------
// Core entity types
// ---------------------------------------------------------------------------

export type GbifDataset = {
  key?: string
  installationKey: string
  publishingOrganizationKey: string
  type: DatasetType
  title: string
  language: string
  description?: string
  doi?: string
  license?: string
  homepage?: string
  logoUrl?: string
}

export type GbifEndpoint = {
  key?: number
  type: EndpointType
  url: string
  description?: string
  machineTags?: GbifMachineTag[]
}

export type GbifInstallation = {
  key?: string
  organizationKey: string
  type: InstallationType
  title: string
  description?: string
  disabled?: boolean
}

export type GbifContact = {
  key?: number
  type: ContactType
  primary?: boolean
  firstName?: string
  lastName?: string
  email?: string[]
  position?: string[]
  organization?: string
  phone?: string[]
  homepage?: string[]
  country?: string
}

export type GbifValidation = {
  key: string
  status: ValidationStatus
  file?: string
  fileSize?: number
  fileFormat?: FileFormat
  metrics?: {
    indexeable?: boolean
    stepTypes?: unknown[]
    error?: string
  }
}

export type GbifCrawlStatus = {
  datasetKey: string
  crawlJob?: {
    targetUrl: string
    attempt: number
  }
  startedCrawling?: string
  finishedCrawling?: string
  finishReason?: CrawlFinishReason
  processStateOccurrence?: ProcessState
  rawOccurrencesPersistedNew?: number
  rawOccurrencesPersistedUpdated?: number
  rawOccurrencesPersistedError?: number
  interpretedOccurrencesPersistedSuccessful?: number
  interpretedOccurrencesPersistedError?: number
}

export type GbifPaginated<T> = {
  endOfRecords: boolean
  count: number
  results: T[]
}
