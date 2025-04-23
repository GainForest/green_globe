import mapboxgl from "mapbox-gl";
import { EMPTY_GEOJSON } from "@/constants";

export const addProjectMarkersSourceAndLayer = (map: mapboxgl.Map) => {
  if (!map.hasImage("projectMarker")) {
    map.loadImage("/assets/project-marker.webp", (error, image) => {
      if (error) throw error;
      if (image) {
        map.addImage("projectMarkerImage", image);
      }
    });
  }
  if (!map.getSource("projectMarkerSource")) {
    map.addSource("projectMarkerSource", {
      type: "geojson",
      data: EMPTY_GEOJSON,
      promoteId: "projectId", // This tells Mapbox to use projectId from properties as the feature ID
    });
  }
  if (!map.getLayer("projectMarkerLayer")) {
    map.addLayer({
      id: "projectMarkerLayer",
      type: "symbol",
      source: "projectMarkerSource",
      layout: {
        "icon-image": "projectMarkerImage",
        "icon-size": 0.05, // Adjust the size as needed
        "icon-allow-overlap": true, // Allow icons to overlap
        "icon-anchor": "bottom" as const,
      },
      paint: {
        "icon-opacity": 1,
      },
    });
  }
};
