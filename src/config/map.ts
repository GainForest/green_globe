import type { GlobePointOfView } from "@/app/(map-routes)/_utils/globe-data";

export const GLOBE_INITIAL_POINT_OF_VIEW: GlobePointOfView = {
  lat: 9,
  lng: 102,
  altitude: 2.5,
};

const GLOBE_VISUAL_PRESETS = {
  classic: {
    backgroundColor: "#000011",
    backgroundImageUrl: null,
    globeImageUrl: "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg",
    bumpImageUrl: "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png",
    atmosphereColor: "rgb(36, 92, 223)",
    atmosphereAltitude: 0.18,
    showGraticules: false,
    globeCurvatureResolution: 5,
    ambientLightColor: "#cccccc",
    ambientLightIntensity: Math.PI,
    keyLightColor: "#ffffff",
    keyLightIntensity: 0.6 * Math.PI,
    keyLightPosition: [0, 1, 0] as const,
    fillLightColor: "#ffffff",
    fillLightIntensity: 0,
    fillLightPosition: [-1, 0.5, -1] as const,
  },
  cinematic: {
    backgroundColor: "#020617",
    backgroundImageUrl: "https://cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png",
    globeImageUrl: "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg",
    bumpImageUrl: "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png",
    atmosphereColor: "#38bdf8",
    atmosphereAltitude: 0.28,
    showGraticules: false,
    globeCurvatureResolution: 2.5,
    ambientLightColor: "#dbeafe",
    ambientLightIntensity: 1.25,
    keyLightColor: "#f8fafc",
    keyLightIntensity: 0.95,
    keyLightPosition: [1.4, 1.2, 1.8] as const,
    fillLightColor: "#22d3ee",
    fillLightIntensity: 0.35,
    fillLightPosition: [-1.4, 0.25, -0.8] as const,
  },
} as const;

type GlobeVisualPresetName = keyof typeof GLOBE_VISUAL_PRESETS;

const requestedGlobeVisualPreset = process.env.NEXT_PUBLIC_GLOBE_VISUAL_PRESET;
const globeVisualPresetName: GlobeVisualPresetName =
  requestedGlobeVisualPreset === "classic" || requestedGlobeVisualPreset === "cinematic"
    ? requestedGlobeVisualPreset
    : "cinematic";

const readIntegerEnv = (
  value: string | undefined,
  fallback: number,
  options: { min: number; max: number },
) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.max(options.min, Math.min(options.max, parsed));
};

const readNumberEnv = (
  value: string | undefined,
  fallback: number,
  options: { min: number; max: number },
) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(options.min, Math.min(options.max, parsed));
};

const closeSatelliteTileEnableAltitude = readNumberEnv(
  process.env.NEXT_PUBLIC_GLOBE_CLOSE_SATELLITE_ENABLE_ALTITUDE,
  0.18,
  { min: 0.001, max: 2.8 },
);
const closeSatelliteTileDisableAltitude = Math.max(
  closeSatelliteTileEnableAltitude,
  readNumberEnv(
    process.env.NEXT_PUBLIC_GLOBE_CLOSE_SATELLITE_DISABLE_ALTITUDE,
    0.24,
    { min: 0.001, max: 2.8 },
  ),
);

export const GLOBE_CONFIG = {
  ...GLOBE_VISUAL_PRESETS[globeVisualPresetName],
  visualPresetName: globeVisualPresetName,
  secondsPerRevolution: 120,
  tileEngineMaxLevel: 19,
  satelliteSupertileZoomOffset: readIntegerEnv(
    process.env.NEXT_PUBLIC_GLOBE_SATELLITE_SUPERTILE_OFFSET,
    1,
    { min: 0, max: 2 },
  ),
  satelliteSupertileMaxLevel: readIntegerEnv(
    process.env.NEXT_PUBLIC_GLOBE_SATELLITE_SUPERTILE_MAX_LEVEL,
    5,
    { min: 0, max: 10 },
  ),
  landcoverTileEngineMaxLevel: 14,
  landcoverTileEngineMinLevel: 6,
  closeSatelliteTileEnableAltitude,
  closeSatelliteTileDisableAltitude,
};

export const getRawSatelliteTileUrl = (x: number, y: number, level: number) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${level}/${y}/${x}`;

export const getSatelliteTileUrl = (x: number, y: number, level: number) => {
  if (
    GLOBE_CONFIG.satelliteSupertileZoomOffset <= 0 ||
    level > GLOBE_CONFIG.satelliteSupertileMaxLevel
  ) {
    return getRawSatelliteTileUrl(x, y, level);
  }

  return `/api/tiles?mode=satellite&z=${level}&x=${x}&y=${y}&sourceZoomOffset=${GLOBE_CONFIG.satelliteSupertileZoomOffset}`;
};

export const getLandcoverTileUrl = (x: number, y: number, level: number) => {
  if (level < GLOBE_CONFIG.landcoverTileEngineMinLevel) {
    return getSatelliteTileUrl(x, y, level);
  }

  return `https://wmts.terrascope.be/?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=esa-worldcover-map-10m-2021-v2_map&STYLE=default&TILEMATRIXSET=EPSG:3857&TILEMATRIX=${level}&TILECOL=${x}&TILEROW=${y}&FORMAT=image/png&TIME=2021-01-01&assets=Map&colormap_name=worldcover`;
};
