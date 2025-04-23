export type Feature = {
  type: "Feature";
  geometry: {
    coordinates: [number, number];
    type: "Point";
  };
  properties: {
    country: string;
    name: string;
    projectId: string;
  };
};

export type ProjectSitePoints = {
  type: "FeatureCollection";
  features: Array<Feature>;
};
