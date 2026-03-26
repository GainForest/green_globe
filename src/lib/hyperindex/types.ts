export type HyperindexOccurrenceNode = {
  uri: string;
  did: string;
  rkey: string;
  scientificName: string;
  vernacularName: string | null;
  basisOfRecord: string;
  kingdom: string | null;
  decimalLatitude: string | null;
  decimalLongitude: string | null;
  eventDate: string | null;
  dynamicProperties: string | null;
  occurrenceID: string | null;
  associatedMedia: string | null;
  imageEvidence: { file: { ref: string; mimeType: string; size: number } } | null;
};

export type HyperindexMeasurementNode = {
  uri: string;
  did: string;
  rkey: string;
  occurrenceRef: string;
  measurementType: string;
  measurementValue: string;
  measurementUnit: string | null;
};

export type HyperindexConnection<T> = {
  edges: Array<{ node: T; cursor: string }>;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
  totalCount?: number;
};

export type HyperindexQueryResponse<K extends string, T> = {
  [key in K]: HyperindexConnection<T>;
};
