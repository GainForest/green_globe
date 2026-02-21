// ATProto-based site record (replaces GraphQL Asset/SiteAsset)
export type AtprotoSite = {
  uri: string;
  rkey: string;
  name: string;
  lat: string;
  lon: string;
  area: string;
  shapefile: unknown; // blob ref or boundary URI
  trees?: unknown;
  createdAt?: string;
};

// ---------------------------------------------------------------------------
// Legacy GraphQL types — kept for backward compatibility with downstream stores
// (BiodiversityPredictions, LayersOverlay) until task 17.4 migrates them.
// ---------------------------------------------------------------------------

/** @deprecated Use AtprotoSite instead */
export type Shapefile = {
  default: boolean;
  isReference: boolean;
  shortName: string;
};

/** @deprecated Use AtprotoSite instead */
export type Asset = {
  id: string;
  name: string;
  classification: string;
  awsCID: string;
  shapefile: Shapefile | null;
};

/** @deprecated Use AtprotoSite instead */
export type SiteAsset = {
  id: string;
  name: string;
  shapefile: Shapefile;
  awsCID: string;
  classification: "Shapefiles";
};

export type CommunityMember = {
  id: number;
  firstName: string;
  lastName: string;
  priority: number | null;
  role: string | null;
  bio: string | null;
  fundsReceived: number | null;
  profileUrl: string | null;
  Wallet: {
    CeloAccounts: string[] | null;
    SOLAccounts: string[] | null;
  } | null;
};

/**
 * Minimal project shape kept for backward compatibility with downstream stores
 * (BiodiversityPredictions, LayersOverlay, ExportDialog) until task 17.4.
 * After 17.3 this is populated from ATProto data:
 *   - id   → organization DID
 *   - name → project slug (handle prefix, e.g. "kayapo-project")
 */
export type Project = {
  id: string;
  name: string;
  country: string;
  dataDownloadUrl: string;
  dataDownloadInfo: string;
  description: string;
  longDescription: string;
  stripeUrl: string;
  discordId: string | null;
  lat: number;
  lon: number;
  area: number;
  objective?: string;
  assets: Asset[];
  communityMembers: CommunityMember[];
  Wallet: unknown | null;
};

/** @deprecated No longer fetched from GraphQL */
export type ProjectDataApiResponse = {
  data: {
    project?: Project;
  };
  extensions: object;
};

/** @deprecated No longer fetched from AWS S3 awsCID */
export type ProjectPolygonAPIResponse = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    id: string;
    geometry: GeoJSON.Point;
    properties: {
      name: string;
    };
  }>;
};

export type TreeFeatureProperties = {
  lat: number;
  lon: number;
  Height?: string;
  height?: string;
  diameter?: string;
  species: string;
  commonName?: string;
  dateMeasured?: string;
  dateOfMeasurement?: string;
  datePlanted?: string;
  "FCD-tree_records-tree_time"?: string;
  "FCD-tree_records-tree_photo"?: string;
  ID?: string;
  awsUrl: string;
  koboUrl: string;
  leafAwsUrl?: string;
  leafKoboUrl?: string;
  barkAwsUrl: string;
  barkKoboUrl: string;
  videoAwsUrl?: string;
  videoKoboUrl?: string;
  soundAwsUrl?: string;
  soundKoboUrl?: string;
  tree_photo?: string;
  Plant_Name?: string;
  DBH?: string;
};

export type TreeFeature = {
  type: "Feature";
  properties: TreeFeatureProperties;
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
};

export type NormalizedTreeFeature = TreeFeature & {
  id: number;
  properties: TreeFeatureProperties & {
    type: "measured-tree";
  };
};

export type NormalizedTreeProperties = NormalizedTreeFeature["properties"];

export type MeasuredTreesGeoJSON<
  T extends TreeFeature | NormalizedTreeFeature = NormalizedTreeFeature
> = {
  type: "FeatureCollection";
  features: T[];
};
