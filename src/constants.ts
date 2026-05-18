export const EXCLUDED_GLOBE_PROJECT_DIDS = [
  "did:plc:xe4gr4hqr7v2k63hblweeahr", // FtC - Builder Residency
  "did:plc:f33zgpmtwsfvs4ivbwsztnxb", // Redemption DAO
] as const;

const EXCLUDED_GLOBE_PROJECT_DID_SET = new Set<string>(
  EXCLUDED_GLOBE_PROJECT_DIDS
);

export const isExcludedGlobeProjectDid = (did: string) =>
  EXCLUDED_GLOBE_PROJECT_DID_SET.has(did);

export const EMPTY_GEOJSON = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [],
      },
      properties: {},
    },
  ],
};
