import type { Feature, FeatureCollection } from "geojson";
import { bbox, centroid } from "@turf/turf";
import type { GlobeController } from "@/app/(map-routes)/_utils/GlobeController";
import type { GlobeBounds, GlobeHtmlDatum } from "@/app/(map-routes)/_utils/globe-data";
import { featureCollectionToPolygons } from "@/app/(map-routes)/_utils/globe-data";

const SHAPEFILE_LAYER = "customGeojson";
const SHAPEFILE_MARKER_LAYER = "customGeojsonMarkers";

const toFeatureCollection = (features: Feature[]): FeatureCollection => ({
  type: "FeatureCollection",
  features,
});

export function addShapefileSourceAndLayers(
  globe: GlobeController,
  features: Feature[],
) {
  const collection = toFeatureCollection(features);

  globe.setPolygonLayer(
    SHAPEFILE_LAYER,
    featureCollectionToPolygons(collection, {
      kind: "shapefile",
      layerName: SHAPEFILE_LAYER,
      capColor: "rgba(255, 0, 255, 0.15)",
      sideColor: "rgba(255, 0, 255, 0.1)",
      strokeColor: "#FF00FF",
      altitude: 0.006,
    }),
  );

  const markers: GlobeHtmlDatum[] = features.flatMap((feature, index) => {
    const point = feature.geometry.type === "MultiPolygon"
      ? {
          type: "Feature" as const,
          properties: feature.properties,
          geometry: {
            type: "Point" as const,
            coordinates: feature.geometry.coordinates[0][0][0],
          },
        }
      : centroid(feature);

    const coordinates = point.geometry.coordinates;
    if (coordinates.length < 2) return [];

    return [
      {
        id: `shapefile-marker-${index}`,
        kind: "centroid-marker" as const,
        lng: coordinates[0],
        lat: coordinates[1],
        label:
          typeof feature.properties?.name === "string"
            ? feature.properties.name
            : "Shapefile feature",
        color: "#FF00FF",
      },
    ];
  });

  globe.setHtmlLayer(SHAPEFILE_MARKER_LAYER, markers);

  const bounds = bbox(collection).slice(0, 4) as GlobeBounds;
  globe.fitBounds(bounds);
}

export function removeShapefileLayers(globe: GlobeController) {
  globe.removeDynamicLayer(SHAPEFILE_LAYER);
  globe.removeHtmlLayer(SHAPEFILE_MARKER_LAYER);
}
