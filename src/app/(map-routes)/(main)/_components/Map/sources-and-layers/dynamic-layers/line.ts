import { EMPTY_GEOJSON } from "@/constants";
import { Map } from "mapbox-gl";

const geojsonLineSource = (treeCrownGeojson = EMPTY_GEOJSON) => ({
  type: "geojson" as const,
  data: treeCrownGeojson,
});

const geojsonLineLayer = (layerName: string) => ({
  id: layerName,
  type: "line" as const,
  source: layerName,
  layout: {
    "line-join": "round" as const,
    "line-cap": "round" as const,
    visibility: "visible" as const,
  },
  paint: {
    "line-color": "#AC4197",
    "line-width": 2.5,
  },
});

const addGeojsonLineSourceAndLayer = async (
  map: Map,
  layer: { name: string; endpoint: string; type: string }
) => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_AWS_STORAGE}/${layer.endpoint}`
    );
    const treeCrownGeojson = await res.json();

    if (!map.getSource(layer.name)) {
      map.addSource(layer.name, geojsonLineSource(treeCrownGeojson));
    }
    if (!map.getLayer(layer.name)) {
      map.addLayer(geojsonLineLayer(layer.name));
    }
  } catch (error) {
    console.error("Error reading GeoJSON file:", error);
  }
};

export default addGeojsonLineSourceAndLayer;
