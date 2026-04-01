import { gql } from "graphql-request";

// ── Organization listing ───────────────────────────────────────────────────────

/**
 * Fetch all public organization info records.
 * Used by /api/list-organizations to replace the PDS listRepos + N×getRecord chain.
 */
export const ALL_ORGANIZATION_INFOS = gql`
  query AllOrganizationInfos($first: Int!) {
    appGainforestOrganizationInfo(
      where: { visibility: { eq: "Public" } }
      first: $first
      sortBy: displayName
      sortDirection: ASC
    ) {
      edges {
        node {
          uri
          did
          rkey
          displayName
          country
          visibility
        }
      }
      totalCount
    }
  }
`;

/**
 * Fetch all default site pointers.
 * Each record links an org DID to its default site AT-URI.
 */
export const ALL_DEFAULT_SITES = gql`
  query AllDefaultSites($first: Int!) {
    appGainforestOrganizationDefaultSite(first: $first) {
      edges {
        node {
          did
          site
        }
      }
    }
  }
`;

// ── Organization members ───────────────────────────────────────────────────────

/**
 * Fetch members for a specific organization by DID.
 */
export const ORGANIZATION_MEMBERS = gql`
  query OrganizationMembers($did: String!, $first: Int!) {
    appGainforestOrganizationMember(
      where: { did: { eq: $did } }
      first: $first
      sortBy: createdAt
      sortDirection: ASC
    ) {
      edges {
        node {
          uri
          rkey
          did
          displayName
          firstName
          lastName
          role
          bio
          profileImage
          expertise
          languages
          walletAddresses
          joinedAt
          displayOrder
          isPublic
          email
          orcid
        }
      }
      totalCount
    }
  }
`;

// ── Organization layers (generic query for full field fidelity) ─────────────────

/**
 * Fetch all layer records via generic records() query.
 *
 * We use the generic query instead of the typed appGainforestOrganizationLayer
 * query because the typed query is missing critical fields: category,
 * uri (endpoint URL — shadowed by AT-URI), legend, and isDefault.
 * The generic query returns the full record value as JSON.
 */
export const ALL_LAYER_RECORDS = gql`
  query AllLayerRecords($first: Int!) {
    records(
      collection: "app.gainforest.organization.layer"
      first: $first
    ) {
      edges {
        node {
          uri
          did
          value
        }
      }
      totalCount
    }
  }
`;

// ── DWC Occurrences ────────────────────────────────────────────────────────────

/**
 * Fetch occurrences for a specific org, optionally filtered by kingdom.
 * Supports cursor-based pagination.
 */
export const OCCURRENCES_BY_DID = gql`
  query OccurrencesByDid(
    $did: String!
    $first: Int!
    $after: String
    $kingdom: String
    $basisOfRecord: String
  ) {
    appGainforestDwcOccurrence(
      where: {
        did: { eq: $did }
        kingdom: { eq: $kingdom }
        basisOfRecord: { eq: $basisOfRecord }
      }
      first: $first
      after: $after
      sortBy: createdAt
      sortDirection: DESC
    ) {
      edges {
        node {
          uri
          cid
          rkey
          did
          scientificName
          vernacularName
          kingdom
          family
          genus
          basisOfRecord
          decimalLatitude
          decimalLongitude
          eventDate
          occurrenceID
          dynamicProperties
          conservationStatus
          plantTraits
          imageEvidence
          associatedMedia
          siteRef
        }
      }
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

/**
 * Fetch occurrences with dynamicProperties containing a substring.
 * Used for measured trees (dynamicProperties contains "measuredTree").
 */
export const OCCURRENCES_BY_DID_WITH_DYNAMIC = gql`
  query OccurrencesByDidWithDynamic(
    $did: String!
    $first: Int!
    $after: String
    $basisOfRecord: String
    $dynamicContains: String
  ) {
    appGainforestDwcOccurrence(
      where: {
        did: { eq: $did }
        basisOfRecord: { eq: $basisOfRecord }
        dynamicProperties: { contains: $dynamicContains }
      }
      first: $first
      after: $after
      sortBy: createdAt
      sortDirection: DESC
    ) {
      edges {
        node {
          uri
          cid
          rkey
          did
          scientificName
          vernacularName
          decimalLatitude
          decimalLongitude
          eventDate
          dynamicProperties
          associatedMedia
          basisOfRecord
          siteRef
        }
      }
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// ── DWC Measurements ───────────────────────────────────────────────────────────

/**
 * Fetch all measurements for a specific org by DID.
 */
export const MEASUREMENTS_BY_DID = gql`
  query MeasurementsByDid($did: String!, $first: Int!, $after: String) {
    appGainforestDwcMeasurement(
      where: { did: { eq: $did } }
      first: $first
      after: $after
      sortBy: createdAt
      sortDirection: DESC
    ) {
      edges {
        node {
          uri
          rkey
          did
          occurrenceRef
          occurrenceID
          measurementType
          measurementValue
          measurementUnit
          measurementMethod
        }
      }
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// ── AC Multimedia ──────────────────────────────────────────────────────────────

/**
 * Fetch all multimedia records for a specific org by DID.
 */
export const MULTIMEDIA_BY_DID = gql`
  query MultimediaByDid($did: String!, $first: Int!, $after: String) {
    appGainforestAcMultimedia(
      where: { did: { eq: $did } }
      first: $first
      after: $after
      sortBy: createdAt
      sortDirection: DESC
    ) {
      edges {
        node {
          uri
          rkey
          did
          occurrenceRef
          siteRef
          subjectPart
          format
          accessUri
          caption
          file
        }
      }
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// ── Certified Locations (replaces deprecated organization.site) ────────────────

/**
 * Fetch locations for a specific org by DID.
 */
export const LOCATIONS_BY_DID = gql`
  query LocationsByDid($did: String!, $first: Int!) {
    appCertifiedLocation(
      where: { did: { eq: $did } }
      first: $first
      sortBy: name
      sortDirection: ASC
    ) {
      edges {
        node {
          uri
          rkey
          did
          name
          description
          locationType
          lpVersion
          srs
          createdAt
          location {
            ... on OrgHypercertsDefsUri {
              uri
            }
            ... on OrgHypercertsDefsSmallBlob {
              blob {
                ref
                mimeType
                size
              }
            }
          }
        }
      }
      totalCount
    }
  }
`;

/**
 * Fetch the default site pointer for a specific org by DID.
 */
export const DEFAULT_SITE_BY_DID = gql`
  query DefaultSiteByDid($did: String!) {
    appGainforestOrganizationDefaultSite(
      where: { did: { eq: $did } }
      first: 1
    ) {
      edges {
        node {
          did
          site
        }
      }
    }
  }
`;

// ── Collection statistics ──────────────────────────────────────────────────────

/**
 * Fetch record counts for specific collections.
 */
export const COLLECTION_STATS = gql`
  query CollectionStats($collections: [String!]) {
    collectionStats(collections: $collections) {
      collection
      count
    }
  }
`;
