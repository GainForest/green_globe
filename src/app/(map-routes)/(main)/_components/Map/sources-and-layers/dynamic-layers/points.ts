import { DynamicLayer } from "@/app/(map-routes)/(main)/_components/LayersOverlay/store/types";
import { EMPTY_GEOJSON } from "@/constants";
import { Map } from "mapbox-gl";
import { resolveLayerUrl } from "@/lib/utils";

const addGeojsonPointSourceAndLayer = async (map: Map, layer: DynamicLayer) => {
  let pointsGeojson = EMPTY_GEOJSON;
  try {
    const res = await fetch(resolveLayerUrl(layer.endpoint));
    pointsGeojson = await res.json();
  } catch (error) {
    console.error("Error fetching points geojson", error);
  }

  if (!map.getSource(layer.name)) {
    map.addSource(layer.name, {
      type: "geojson",
      data: pointsGeojson || EMPTY_GEOJSON,
    });
  }

  if (!map.getLayer(`${layer.name}`)) {
    const layerNameLower = layer.name.toLowerCase();
    let color = "#FFA500"; // 🎨 Default: Vibrant orange
    let emoji = "📍"; // Default emoji

    // 🌈 Colorful layer identification
    switch (true) {
      case layerNameLower.includes("airstrip"):
        color = "#FF4136"; // 🛫 Airstrip: Vibrant red
        emoji = "✈️";
        break;
      case layerNameLower.includes("water"):
        color = "#7FDBFF"; // 💧 Water: Bright sky blue
        emoji = "💧";
        break;
      case layerNameLower.includes("surface"):
        color = "#85144b"; // 🏔️ Surface: Deep maroon
        emoji = "🏔️";
        break;
      case layerNameLower.includes("raft"):
        color = "#000000"; // 🛶 Raft: Teal
        emoji = "🛶";
        break;
      case layerNameLower.includes("basecamp"):
        color = "#2bce89";
        emoji = "";
        break;
    }

    console.log(`Adding layer: ${emoji} ${layer.name} (${color})`);

    map.addLayer({
      id: `${layer.name}`,
      type: "circle",
      source: layer.name,
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": color,
        "circle-radius": 6,
        "circle-stroke-color": "#FFFFFF",
        "circle-stroke-width": 2,
      },
    });
  }
};

export default addGeojsonPointSourceAndLayer;
