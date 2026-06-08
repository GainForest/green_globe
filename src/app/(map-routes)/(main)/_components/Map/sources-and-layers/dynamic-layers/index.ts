import type { Feature, FeatureCollection } from "geojson";
import type { GlobeController, TileUrlFactory } from "@/app/(map-routes)/_utils/GlobeController";
import {
  featureCollectionToPaths,
  featureCollectionToPolygons,
  geoJsonToPointData,
  SHANNON_INDEX_STOPS,
  SPECIES_RICHNESS_STOPS,
  steppedColor,
} from "@/app/(map-routes)/_utils/globe-data";
import { DynamicLayer } from "@/app/(map-routes)/(main)/_components/LayersOverlay/store/types";
import { resolveLayerUrl } from "@/lib/utils";

const toFeatureCollection = (data: unknown): FeatureCollection => {
  const value = data as FeatureCollection | Feature;

  if (value?.type === "FeatureCollection") {
    return value;
  }

  if (value?.type === "Feature") {
    return {
      type: "FeatureCollection",
      features: [value],
    };
  }

  return {
    type: "FeatureCollection",
    features: [],
  };
};

const fetchGeoJson = async (
  endpoint: string,
  signal?: AbortSignal,
): Promise<FeatureCollection> => {
  const response = await fetch(resolveLayerUrl(endpoint), { signal });
  if (!response.ok) {
    throw new Error(`Failed to fetch layer GeoJSON (${response.status})`);
  }

  return toFeatureCollection(await response.json());
};

const createCompositeRasterTileUrl = (
  remoteTileUrl: string,
  x: number,
  y: number,
  level: number,
) =>
  `/api/tiles/raster-with-basemap?z=${level}&x=${x}&y=${y}&tileUrl=${encodeURIComponent(remoteTileUrl)}`;

const createRasterTileFactory = (layer: DynamicLayer): TileUrlFactory => {
  const endpoint = resolveLayerUrl(layer.endpoint);

  if (layer.type === "raster_tif") {
    return (x, y, level) => {
      const tileUrl = `${process.env.NEXT_PUBLIC_TITILER_ENDPOINT}/cog/tiles/WebMercatorQuad/${level}/${x}/${y}@1x?url=${encodeURIComponent(endpoint)}`;
      return createCompositeRasterTileUrl(tileUrl, x, y, level);
    };
  }

  return (x, y, level) => {
    const tmsY = 2 ** level - 1 - y;
    const tileUrl = endpoint
      .replaceAll("{z}", String(level))
      .replaceAll("{x}", String(x))
      .replaceAll("{y}", String(tmsY));
    return createCompositeRasterTileUrl(tileUrl, x, y, level);
  };
};

const addNamedSource = async (
  globe: GlobeController,
  layer: DynamicLayer,
  signal?: AbortSignal,
) => {
  if (layer.type === "geojson_points") {
    const data = await fetchGeoJson(layer.endpoint, signal);
    globe.setDynamicPointLayer(
      layer.name,
      geoJsonToPointData(data, {
        kind: "dynamic-point",
        layerName: layer.name,
        radius: 0.08,
      }),
    );
    return;
  }

  if (layer.type === "geojson_line") {
    const data = await fetchGeoJson(layer.endpoint, signal);
    globe.setPathLayer(
      layer.name,
      featureCollectionToPaths(data, {
        layerName: layer.name,
        color: "#AC4197",
        stroke: 0.08,
      }),
    );
    return;
  }

  if (layer.type === "choropleth" || layer.type === "choropleth_shannon") {
    const data = await fetchGeoJson(layer.endpoint, signal);
    const propertyName =
      layer.type === "choropleth_shannon" ? "shannon_index" : "species_richness";
    const stops =
      layer.type === "choropleth_shannon"
        ? SHANNON_INDEX_STOPS
        : SPECIES_RICHNESS_STOPS;

    globe.setPolygonLayer(
      layer.name,
      featureCollectionToPolygons(data, {
        kind: "dynamic-polygon",
        layerName: layer.name,
        capColor: (feature) => steppedColor(feature.properties?.[propertyName], stops),
        sideColor: "rgba(255,255,255,0.12)",
        strokeColor: "rgba(17,17,17,0.8)",
        altitude: 0.01,
      }),
    );
    return;
  }

  if (layer.type === "raster_tif" || layer.type === "tms_tile") {
    globe.setRasterTileLayer(layer.name, createRasterTileFactory(layer));
    return;
  }

  if (layer.type === "geojson_points_trees") {
    globe.setTreesVisible(true);
  }
};

export const removeNamedSource = (globe: GlobeController, layer: DynamicLayer) => {
  globe.removeDynamicLayer(layer.name);
};

export default addNamedSource;
