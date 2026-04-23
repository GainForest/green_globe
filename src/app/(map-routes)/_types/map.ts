export type Feature = {
  type: "Feature";
  geometry: {
    coordinates: [number, number];
    type: "Point";
  };
  properties: {
    country: string;
    name: string;
    did: string;
  };
};

export type OrganizationPoints = {
  type: "FeatureCollection";
  features: Array<Feature>;
};
