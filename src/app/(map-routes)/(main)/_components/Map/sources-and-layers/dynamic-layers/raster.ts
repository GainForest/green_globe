import { Map } from "mapbox-gl";
import { resolveLayerUrl } from "@/lib/utils";

const addRasterSourceAndLayer = async (
  map: Map,
  layer: { name: string; endpoint: string; type: string }
) => {
  try {
    if (!map.getSource(layer.name)) {
      map.addSource(layer.name, {
        type: "raster",
        tiles: [
          `${process.env.NEXT_PUBLIC_TITILER_ENDPOINT}/cog/tiles/WebMercatorQuad/{z}/{x}/{y}@1x?url=${resolveLayerUrl(layer.endpoint)}`,
        ],
      });
    }
    if (!map.getLayer(layer.name)) {
      map.addLayer({
        id: layer.name,
        type: "raster",
        source: layer.name,
        paint: {
          "raster-opacity": 1,
        },
      });
    }
  } catch (error) {
    console.error("Error reading GeoJSON file:", error);
  }
};

export default addRasterSourceAndLayer;
