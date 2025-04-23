import { Map as MapInterface, Marker } from "mapbox-gl";
import { Feature } from "geojson";
import { bbox } from "@turf/turf";
import { centroid } from "@turf/turf";

function createCustomMarkerElement() {
  const markerRoot = document.createElement("div");
  markerRoot.style.boxSizing = "border-box";

  const markerLayout = document.createElement("div");
  markerLayout.style.position = "relative";
  markerLayout.style.boxSizing = "border-box";

  const marker = document.createElement("div");
  marker.style.boxSizing = "border-box";
  marker.style.position = "absolute";
  marker.style.bottom = "0";
  marker.style.left = "50%";
  marker.style.backgroundColor = "#FF00FF";
  marker.style.width = "20px";
  marker.style.height = "20px";
  marker.style.borderRadius = "50%";
  marker.style.borderBottomRightRadius = "10%";
  marker.style.border = "2px solid #FFFFFF";
  marker.style.transform = "translateX(-50%) rotateZ(45deg)";

  const markerDot = document.createElement("div");
  markerDot.style.boxSizing = "border-box";
  markerDot.style.position = "absolute";
  markerDot.style.bottom = "7px";
  markerDot.style.left = "50%";
  markerDot.style.transform = "translateX(-50%)";
  markerDot.style.borderRadius = "100%";
  markerDot.style.backgroundColor = "#FFFFFF";
  markerDot.style.width = "8px";
  markerDot.style.height = "8px";

  markerLayout.appendChild(marker);
  markerLayout.appendChild(markerDot);
  markerRoot.appendChild(markerLayout);
  return markerRoot;
}

export function addShapefileSourceAndLayers(
  map: MapInterface,
  features: Feature[]
) {
  if (!map.getSource("customGeojson")) {
    map.addSource("customGeojson", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: features,
      },
    });

    // Add fill layer
    map.addLayer({
      id: "customGeojsonFill",
      type: "fill",
      source: "customGeojson",
      paint: {
        "fill-color": "#FF00FF",
        "fill-opacity": 0.15,
      },
    });

    // Add outline layer
    map.addLayer({
      id: "customGeojsonOutline",
      type: "line",
      source: "customGeojson",
      layout: {
        "line-cap": "round",
        "line-join": "round",
        visibility: "visible",
      },
      paint: {
        "line-color": "#FF00FF",
        "line-width": 2,
      },
    });

    // Create centroids for each polygon
    const centroids = {
      type: "FeatureCollection",
      features: features.map((feature) => {
        if (feature.geometry.type === "MultiPolygon") {
          return {
            type: "Feature",
            properties: feature.properties,
            geometry: {
              type: "Point",
              coordinates: feature.geometry.coordinates[0][0][0],
            },
          };
        }
        return centroid(feature);
      }),
    };

    // Add markers for each centroid
    centroids.features.forEach((point) => {
      new Marker({
        color: "#FFFFFF",
        scale: 0.75,
        pitchAlignment: "map",
        rotationAlignment: "map",
        element: createCustomMarkerElement(),
      })
        .setLngLat(point.geometry.coordinates as [number, number])
        .addTo(map);
    });

    // Fit bounds to the shapefile
    const bounds = bbox({
      type: "FeatureCollection",
      features: features,
    });
    map.fitBounds(
      [
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]],
      ],
      {
        padding: { top: 40, bottom: 40, left: 40, right: 40 },
        animate: true,
      }
    );
  }
}

export function removeShapefileLayers(map: MapInterface) {
  if (map.getSource("customGeojson")) {
    if (map.getLayer("customGeojsonFill")) map.removeLayer("customGeojsonFill");
    if (map.getLayer("customGeojsonOutline"))
      map.removeLayer("customGeojsonOutline");
    map.removeSource("customGeojson");
  }
}
