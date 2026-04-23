import type {
  Feature,
  FeatureCollection,
  GeoJsonObject,
  Geometry,
  GeometryCollection,
  MultiPolygon,
  Polygon,
  Position,
} from "geojson";
import {
  area as turfArea,
  bbox as turfBbox,
  centerOfMass,
  centroid as turfCentroid,
  featureCollection,
} from "@turf/turf";

export type Coordinates = {
  lat: number;
  lon: number;
};

export type PolygonMetrics = {
  areaSqMeters: number | null;
  areaHectares: number | null;
  centroid: Coordinates | null;
  bbox: [number, number, number, number] | null;
};

export const HECTARES_PER_SQUARE_METER = 0.0001;

const isFeatureCollection = (
  value: GeoJsonObject
): value is FeatureCollection => value.type === "FeatureCollection";

const isFeature = (value: GeoJsonObject): value is Feature =>
  value.type === "Feature";

const isGeometryCollection = (
  value: Geometry
): value is GeometryCollection => value.type === "GeometryCollection";

const isPolygon = (value: Geometry): value is Polygon =>
  value.type === "Polygon";

const isMultiPolygon = (value: Geometry): value is MultiPolygon =>
  value.type === "MultiPolygon";

const toFeature = (geometry: Geometry): Feature<Geometry> => ({
  type: "Feature",
  geometry,
  properties: {},
});

const extractPolygonFeatures = (
  input: GeoJsonObject
): Feature<Polygon | MultiPolygon>[] => {
  if (isFeatureCollection(input)) {
    return input.features.flatMap((feature) =>
      extractPolygonFeatures(feature)
    );
  }

  if (isFeature(input)) {
    const geometry = input.geometry;
    if (!geometry) return [];

    if (isGeometryCollection(geometry)) {
      return geometry.geometries.flatMap((subGeometry) =>
        extractPolygonFeatures(toFeature(subGeometry))
      );
    }

    if (isPolygon(geometry) || isMultiPolygon(geometry)) {
      return [input as Feature<Polygon | MultiPolygon>];
    }

    return [];
  }

  const geometry = input as Geometry;

  if (isGeometryCollection(geometry)) {
    return geometry.geometries.flatMap((subGeometry) =>
      extractPolygonFeatures(toFeature(subGeometry))
    );
  }

  if (isPolygon(geometry) || isMultiPolygon(geometry)) {
    return [toFeature(geometry) as Feature<Polygon | MultiPolygon>];
  }

  return [];
};

const computeCentroid = (
  features: Feature<Polygon | MultiPolygon>[]
): Position | null => {
  if (features.length === 0) return null;

  const collection = featureCollection(features);

  try {
    const { geometry } = centerOfMass(collection);
    return geometry.coordinates;
  } catch {
    try {
      const { geometry } = turfCentroid(collection);
      return geometry.coordinates;
    } catch {
      return null;
    }
  }
};

export const computePolygonMetrics = (
  geoJson: GeoJsonObject
): PolygonMetrics => {
  const polygonFeatures = extractPolygonFeatures(geoJson);

  if (polygonFeatures.length === 0) {
    return {
      areaSqMeters: null,
      areaHectares: null,
      centroid: null,
      bbox: null,
    };
  }

  const areaSqMeters = polygonFeatures.reduce(
    (acc, feature) => acc + turfArea(feature),
    0
  );

  const centroidPosition = computeCentroid(polygonFeatures);
  const bbox = turfBbox(featureCollection(polygonFeatures)) as [
    number,
    number,
    number,
    number
  ];

  return {
    areaSqMeters,
    areaHectares: areaSqMeters * HECTARES_PER_SQUARE_METER,
    centroid: centroidPosition
      ? { lat: centroidPosition[1], lon: centroidPosition[0] }
      : null,
    bbox,
  };
};

export const toFeatureCollection = (
  geoJson: GeoJsonObject
): FeatureCollection => {
  if (isFeatureCollection(geoJson)) return geoJson;

  if (isFeature(geoJson)) {
    return featureCollection([geoJson]);
  }

  return featureCollection([toFeature(geoJson as Geometry)]);
};
