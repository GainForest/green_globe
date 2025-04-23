import { NormalizedTreeFeature } from "./types";

export type GFTreeProperties = {
  id: string;
  date_planted?: string;
  measurements_in_cm?: {
    height?: number;
    diameter?: number;
    date_measured?: string;
  };
  taxonomy?: {
    common_name?: string;
    class?: string;
    order?: string;
    family?: string;
    kingdom?: string;
    genus?: string;
    species?: string;
  };
  notes?: {
    title: string;
    description: string;
    data?: {
      [key: string]: string;
    };
  };
  media_sources?: {
    images?: Array<{
      type: "leaf" | "bark" | "trunk" | "entire_specimen";
      value: string;
    }>;
    videos?: Array<string>;
    audios?: Array<string>;
  };
};

export type GFTreeFeature = {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: GFTreeProperties;
};

export const convertFromGFTreeFeatureToNormalizedTreeFeature = (
  feature: GFTreeFeature
): NormalizedTreeFeature => {
  return {
    id: Number(feature.properties.id),
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: feature.geometry.coordinates,
    },
    properties: {
      type: "measured-tree",
      lat: feature.geometry.coordinates[1],
      lon: feature.geometry.coordinates[0],
      height: feature.properties.measurements_in_cm?.height
        ? feature.properties.measurements_in_cm.height.toString()
        : undefined,
      Height: feature.properties.measurements_in_cm?.height
        ? feature.properties.measurements_in_cm.height.toString()
        : undefined,
      diameter: feature.properties.measurements_in_cm?.diameter
        ? feature.properties.measurements_in_cm.diameter.toString()
        : undefined,
      DBH: feature.properties.measurements_in_cm?.diameter
        ? feature.properties.measurements_in_cm.diameter.toString()
        : undefined,
      species: feature.properties.taxonomy?.species ?? "",
      commonName: feature.properties.taxonomy?.common_name ?? "",
      dateMeasured: feature.properties.measurements_in_cm?.date_measured
        ? new Date(
            feature.properties.measurements_in_cm.date_measured
          ).toLocaleDateString("en-GB")
        : undefined,
      dateOfMeasurement: feature.properties.measurements_in_cm?.date_measured
        ? new Date(
            feature.properties.measurements_in_cm.date_measured
          ).toLocaleDateString("en-GB")
        : undefined,
      datePlanted: feature.properties.date_planted,
      "FCD-tree_records-tree_time": feature.properties.date_planted,
      "FCD-tree_records-tree_photo":
        feature.properties.media_sources?.images?.[0]?.value,
      ID: feature.properties.id,
      awsUrl: feature.properties.media_sources?.images?.[0]?.value ?? "",
      koboUrl: feature.properties.media_sources?.images?.[0]?.value ?? "",
      leafAwsUrl: feature.properties.media_sources?.images?.[0]?.value ?? "",
      leafKoboUrl: feature.properties.media_sources?.images?.[0]?.value ?? "",
      barkAwsUrl: feature.properties.media_sources?.images?.[0]?.value ?? "",
      barkKoboUrl: feature.properties.media_sources?.images?.[0]?.value ?? "",
    },
  };
};
