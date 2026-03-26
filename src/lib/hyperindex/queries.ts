/**
 * Query for measured tree occurrences (basisOfRecord = HumanObservation) for a given DID.
 * Accepts: $did: String!, $first: Int!, $after: String
 */
export const MEASURED_TREE_OCCURRENCES_QUERY = `
  query MeasuredTreeOccurrences($did: String!, $first: Int!, $after: String) {
    appGainforestDwcOccurrence(
      where: { did: { eq: $did }, basisOfRecord: { eq: "HumanObservation" } }
      first: $first
      after: $after
    ) {
      edges {
        node {
          uri
          did
          rkey
          scientificName
          vernacularName
          basisOfRecord
          kingdom
          decimalLatitude
          decimalLongitude
          eventDate
          dynamicProperties
          occurrenceID
          associatedMedia
          conservationStatus
          plantTraits
          imageEvidence {
            file {
              ref
              mimeType
              size
            }
          }
          siteRef
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
        hasPreviousPage
        startCursor
      }
    }
  }
`;

/**
 * Query for all measurements for a given DID.
 * Accepts: $did: String!, $first: Int!, $after: String
 */
export const MEASUREMENTS_BY_DID_QUERY = `
  query MeasurementsByDid($did: String!, $first: Int!, $after: String) {
    appGainforestDwcMeasurement(
      where: { did: { eq: $did } }
      first: $first
      after: $after
    ) {
      edges {
        node {
          uri
          did
          rkey
          occurrenceRef
          measurementType
          measurementValue
          measurementUnit
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
        hasPreviousPage
        startCursor
      }
    }
  }
`;

/**
 * Query for occurrences filtered by DID and kingdom.
 * Accepts: $did: String!, $kingdom: String!, $first: Int!, $after: String
 */
export const OCCURRENCES_BY_KINGDOM_QUERY = `
  query OccurrencesByKingdom($did: String!, $kingdom: String!, $first: Int!, $after: String) {
    appGainforestDwcOccurrence(
      where: { did: { eq: $did }, kingdom: { eq: $kingdom } }
      first: $first
      after: $after
    ) {
      edges {
        node {
          uri
          did
          rkey
          scientificName
          vernacularName
          basisOfRecord
          kingdom
          decimalLatitude
          decimalLongitude
          eventDate
          dynamicProperties
          occurrenceID
          associatedMedia
          conservationStatus
          plantTraits
          imageEvidence {
            file {
              ref
              mimeType
              size
            }
          }
          siteRef
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
        hasPreviousPage
        startCursor
      }
    }
  }
`;

/**
 * Query for plant predictions (kingdom = Plantae, basisOfRecord != HumanObservation) for a given DID.
 * Accepts: $did: String!, $first: Int!, $after: String
 */
export const PLANT_PREDICTIONS_QUERY = `
  query PlantPredictions($did: String!, $first: Int!, $after: String) {
    appGainforestDwcOccurrence(
      where: { did: { eq: $did }, kingdom: { eq: "Plantae" }, basisOfRecord: { neq: "HumanObservation" } }
      first: $first
      after: $after
    ) {
      edges {
        node {
          uri
          did
          rkey
          scientificName
          vernacularName
          basisOfRecord
          kingdom
          decimalLatitude
          decimalLongitude
          eventDate
          dynamicProperties
          occurrenceID
          associatedMedia
          conservationStatus
          plantTraits
          imageEvidence {
            file {
              ref
              mimeType
              size
            }
          }
          siteRef
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
        hasPreviousPage
        startCursor
      }
    }
  }
`;
