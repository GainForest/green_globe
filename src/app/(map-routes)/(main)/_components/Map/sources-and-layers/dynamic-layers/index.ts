import { Map } from "mapbox-gl";
import { addMeasuredTreesSourceAndLayer } from "../measured-trees";
import { DynamicLayer } from "@/app/(map-routes)/(main)/_components/LayersOverlay/store/types";
import addGeojsonPointSourceAndLayer from "./points";
import addGeojsonLineSourceAndLayer from "./line";
import addTMSTileSourceAndLayer from "./tms-tile";
import addRasterSourceAndLayer from "./raster";
import addChoroplethSourceAndLayers from "./chloropleth";
import addShannonChoroplethSourceAndLayers from "./shannon-chloropleth";

const safeMoveLayer = (map: Map, layerId: string, beforeId?: string) => {
  if (!map.getLayer(layerId)) {
    return;
  }

  if (beforeId && map.getLayer(beforeId)) {
    map.moveLayer(layerId, beforeId);
    return;
  }

  map.moveLayer(layerId);
};

const addNamedSource = async (map: Map, layer: DynamicLayer) => {
  if (!map.getSource(layer.name)) {
    if (layer.type == "geojson_points") {
      await addGeojsonPointSourceAndLayer(map, layer);
    }
    if (layer.type == "geojson_line") {
      await addGeojsonLineSourceAndLayer(map, layer);
    }
    if (layer.type == "tms_tile") {
      addTMSTileSourceAndLayer(map, layer);
    }
    if (layer.type == "raster_tif") {
      await addRasterSourceAndLayer(map, layer);
    }
    if (layer.type == "choropleth") {
      addChoroplethSourceAndLayers(map, layer);
    }
    if (layer.type == "choropleth_shannon") {
      addShannonChoroplethSourceAndLayers(map, layer);
    }
    if (layer.type == "geojson_points_trees") {
      addMeasuredTreesSourceAndLayer(map);
    }
  }

  safeMoveLayer(map, layer.name, "highlightedSiteOutline");
  safeMoveLayer(map, "highlightedSiteOutline", "projectMarkerLayer");
};

export const removeNamedSource = (map: Map, layer: DynamicLayer) => {
  if (map.getLayer(layer.name)) {
    map.removeLayer(layer.name);
  }

  if (map.getSource(layer.name)) {
    map.removeSource(layer.name);
  }
};

export default addNamedSource;
