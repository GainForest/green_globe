import { FogSpecification, MapOptions } from "mapbox-gl";

export const MAP_CONFIG = {
  projection: "globe",
  style: "mapbox://styles/mapbox/satellite-streets-v12",
  zoom: 2,
  center: [102, 9],
} as MapOptions;

export const MAP_FOG_CONFIG = {
  color: "#000000",
  "high-color": "rgb(36, 92, 223)",
  "horizon-blend": 0.02,
  "space-color": "rgb(11, 11, 25)",
  "star-intensity": 0.05,
} as FogSpecification;
