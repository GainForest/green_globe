/**
 * TypeScript types for Hyperindex GraphQL responses.
 *
 * Hyperindex uses Relay-style cursor-based pagination. These types mirror the
 * GraphQL schema and are used to type the responses from graphql-request.
 */

// ── Relay pagination primitives ────────────────────────────────────────────────

export type PageInfo = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
};

export type Edge<T> = {
  cursor: string;
  node: T;
};

export type Connection<T> = {
  edges: Edge<T>[];
  pageInfo: PageInfo;
  totalCount?: number;
};

export type SortDirection = "ASC" | "DESC";

// ── Blob type (embedded in records) ────────────────────────────────────────────

export type HiBlob = {
  ref: string;
  mimeType: string;
  size: number;
};

// ── Generic record (from `records()` query) ────────────────────────────────────

export type HiGenericRecord = {
  uri: string;
  did: string;
  cid: string;
  rkey: string;
  collection: string;
  value: Record<string, unknown>;
};

// ── app.gainforest.organization.info ────────────────────────────────────────────

export type HiOrganizationInfo = {
  uri: string;
  did: string;
  cid: string;
  rkey: string;
  createdAt: string;
  displayName?: string;
  country?: string;
  visibility?: string;
  website?: string;
  startDate?: string;
  shortDescription?: { text?: string };
  longDescription?: unknown;
  coverImage?: unknown;
  logo?: unknown;
  objectives?: string[];
};

// ── app.gainforest.organization.member ──────────────────────────────────────────

export type HiOrganizationMember = {
  uri: string;
  did: string;
  cid: string;
  rkey: string;
  createdAt: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  bio?: string;
  profileImage?: unknown;
  expertise?: string[];
  languages?: string[];
  walletAddresses?: unknown;
  joinedAt?: string;
  displayOrder?: number;
  isPublic?: boolean;
  email?: string;
  orcid?: string;
};

// ── app.gainforest.organization.layer ───────────────────────────────────────────
// NOTE: The typed query is missing critical fields (category, uri/endpoint,
// legend, isDefault). We use the generic records() query for layers instead.
// This type represents the raw value from the generic query.

export type HiOrganizationLayerValue = {
  $type: string;
  name?: string;
  type?: string;
  uri?: string;
  category?: string;
  description?: string;
  isDefault?: boolean;
  legend?: unknown[];
  createdAt?: string;
  [k: string]: unknown;
};

// ── app.gainforest.organization.defaultSite ─────────────────────────────────────

export type HiOrganizationDefaultSite = {
  uri: string;
  did: string;
  cid: string;
  rkey: string;
  createdAt: string;
  site?: string;
};

// ── app.gainforest.organization.donation ─────────────────────────────────────────

export type HiOrganizationDonation = {
  uri: string;
  did: string;
  cid: string;
  rkey: string;
  createdAt: string;
  amount?: number;
  amountUsd?: string;
  currency?: string;
  donorName?: string;
  donorDid?: string;
  donorIdentifier?: string;
  donatedAt?: string;
  paymentMethod?: string;
  transactionHash?: string;
  transactionType?: string;
  blockchainNetwork?: string;
  purpose?: string;
  notes?: string;
  isAnonymous?: boolean;
  receiptUrl?: string;
  recipientMemberRef?: string;
};

// ── app.gainforest.dwc.occurrence ───────────────────────────────────────────────

export type HiDwcOccurrence = {
  uri: string;
  did: string;
  cid: string;
  rkey: string;
  createdAt: string;
  basisOfRecord: string;
  eventDate: string;
  scientificName: string;
  // Taxonomy
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  specificEpithet?: string;
  infraspecificEpithet?: string;
  taxonRank?: string;
  taxonomicStatus?: string;
  vernacularName?: string;
  gbifTaxonKey?: string;
  // Location
  decimalLatitude?: string;
  decimalLongitude?: string;
  coordinateUncertaintyInMeters?: number;
  country?: string;
  locality?: string;
  habitat?: string;
  // Observation
  occurrenceID?: string;
  occurrenceStatus?: string;
  occurrenceRemarks?: string;
  individualCount?: number;
  sex?: string;
  lifeStage?: string;
  behavior?: string;
  recordedBy?: string;
  identifiedBy?: string;
  samplingProtocol?: string;
  // Evidence (embedded blobs — CID refs, not full binary)
  imageEvidence?: { file?: { ref?: unknown; mimeType?: string } };
  audioEvidence?: unknown;
  videoEvidence?: unknown;
  associatedMedia?: string;
  // Extended
  dynamicProperties?: string;
  conservationStatus?: unknown;
  plantTraits?: unknown;
  // Linkage
  eventRef?: string;
  eventID?: string;
  siteRef?: string;
};

// ── app.gainforest.dwc.measurement ──────────────────────────────────────────────

export type HiDwcMeasurement = {
  uri: string;
  did: string;
  cid: string;
  rkey: string;
  createdAt: string;
  occurrenceRef: string;
  occurrenceID?: string;
  measurementType?: string;
  measurementValue?: string;
  measurementUnit?: string;
  measurementID?: string;
  measurementAccuracy?: string;
  measurementMethod?: string;
  measurementDeterminedBy?: string;
  measurementDeterminedDate?: string;
  measurementRemarks?: string;
};

export type HiMeasurementResult = {
  $type?: string;
  dbh?: string;
  totalHeight?: string;
  basalDiameter?: string;
  canopyCoverPercent?: string;
  measurements?: unknown[];
  additionalMeasurements?: unknown[];
  [k: string]: unknown;
};

export type HiMeasurementRecordValue = {
  $type?: string;
  createdAt?: string;
  occurrenceID?: string;
  occurrenceRef?: string;
  result?: HiMeasurementResult;
  measurementType?: string;
  measurementValue?: string;
  measurementUnit?: string;
  measurementID?: string;
  measurementAccuracy?: string;
  measurementMethod?: string;
  measurementDeterminedBy?: string;
  measurementDeterminedDate?: string;
  measurementRemarks?: string;
  [k: string]: unknown;
};

export type HiGenericMeasurementRecord = {
  uri: string;
  did: string;
  value: HiMeasurementRecordValue;
};

// ── app.gainforest.ac.multimedia ────────────────────────────────────────────────

export type HiAcMultimedia = {
  uri: string;
  did: string;
  cid: string;
  rkey: string;
  createdAt: string;
  occurrenceRef?: string;
  siteRef?: string;
  subjectPart?: string;
  subjectPartUri?: string;
  subjectOrientation?: string;
  caption?: string;
  format?: string;
  accessUri?: string;
  creator?: string;
  createDate?: string;
  variantLiteral?: string;
  file?: { ref?: unknown; mimeType?: string };
};

// ── app.certified.location ──────────────────────────────────────────────────────

export type HiCertifiedLocation = {
  uri: string;
  did: string;
  cid: string;
  rkey: string;
  createdAt: string;
  name?: string;
  description?: string;
  locationType: string;
  lpVersion: string;
  srs: string;
  location:
    | { __typename?: "OrgHypercertsDefsUri"; uri: string }
    | { __typename?: "OrgHypercertsDefsSmallBlob"; blob: HiBlob };
};

// ── app.gainforest.evaluator.evaluation ─────────────────────────────────────────

export type HiEvaluatorEvaluation = {
  uri: string;
  did: string;
  cid: string;
  rkey: string;
  createdAt: string;
  evaluationType: string;
  confidence?: number;
  subject?: { uri: string; cid?: string };
  result?: unknown;
  supersedes?: string;
  neg?: boolean;
  dynamicProperties?: string;
};
