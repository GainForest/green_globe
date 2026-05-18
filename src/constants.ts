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
