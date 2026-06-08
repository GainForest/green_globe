import type { Feature, FeatureCollection, GeoJsonProperties, Geometry, LineString, MultiLineString, MultiPoint, MultiPolygon, Point, Polygon, Position } from "geojson";

export type GlobeBounds = [number, number, number, number];

export type GlobePointKind = "tree" | "dynamic-point";

export type GlobePointDatum = {
  id: string | number;
  kind: GlobePointKind;
  layerName: string;
  lat: number;
  lng: number;
  color: string;
  radius: number;
  label?: string;
  feature?: Feature<Point>;
};

export type GlobeHtmlKind = "project-marker" | "centroid-marker";

export type GlobeHtmlDatum = {
  id: string;
  kind: GlobeHtmlKind;
  lat: number;
  lng: number;
  label: string;
  did?: string;
  color?: string;
};

export type GlobePolygonKind =
  | "highlighted-site"
  | "dynamic-polygon"
  | "shapefile";

export type GlobePolygonDatum = {
  id: string;
  kind: GlobePolygonKind;
  layerName: string;
  geometry: Polygon | MultiPolygon;
  properties: GeoJsonProperties;
  capColor: string;
  sideColor: string;
  strokeColor: string | boolean | null;
  altitude: number;
  label?: string;
};

export type GlobePathDatum = {
  id: string;
  layerName: string;
  points: Array<[number, number]>;
  color: string;
  stroke: number;
  label?: string;
};

export type GlobePointOfView = {
  lat: number;
  lng: number;
  altitude: number;
};

export type GlobeGeoJsonInput =
  | FeatureCollection
  | Feature
  | Geometry
  | null
  | undefined;

const DEFAULT_BOUNDS: GlobeBounds = [-180, -70, 180, 70];

const toFiniteNumber = (value: unknown): number | null => {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
};

const GEOMETRY_TYPES = new Set<string>([
  "Point",
  "MultiPoint",
  "LineString",
  "MultiLineString",
  "Polygon",
  "MultiPolygon",
  "GeometryCollection",
]);

const isGeometry = (value: unknown): value is Geometry =>
  typeof value === "object" &&
  value !== null &&
  "type" in value &&
  GEOMETRY_TYPES.has(String((value as { type?: unknown }).type));

export const geoJsonInputToFeatures = (data: GlobeGeoJsonInput): Feature[] => {
  if (!data) return [];

  if (data.type === "FeatureCollection") {
    return data.features ?? [];
  }

  if (data.type === "Feature") {
    return [data];
  }

  if (isGeometry(data)) {
    if (data.type === "GeometryCollection") {
      return data.geometries.map((geometry, index) => ({
        type: "Feature" as const,
        id: `geometry-${index}`,
        properties: {},
        geometry,
      }));
    }

    return [
      {
        type: "Feature" as const,
        properties: {},
        geometry: data,
      },
    ];
  }

  return [];
};

export const normalizeBounds = (bounds: GlobeBounds | null): GlobeBounds => {
  if (!bounds) return DEFAULT_BOUNDS;

  const [west, south, east, north] = bounds.map((value) =>
    Number.isFinite(value) ? value : 0,
  ) as GlobeBounds;

  return [
    Math.max(-180, Math.min(180, west)),
    Math.max(-90, Math.min(90, south)),
    Math.max(-180, Math.min(180, east)),
    Math.max(-90, Math.min(90, north)),
  ];
};

type GlobeMarkerPosition = {
  lat: number;
  lng: number;
};

const ringCentroid = (ring: Position[]): (GlobeMarkerPosition & { weight: number }) | null => {
  if (ring.length < 3) return null;

  let areaFactor = 0;
  let lngSum = 0;
  let latSum = 0;
  const fallbackPositions: GlobeMarkerPosition[] = [];

  for (let index = 0; index < ring.length; index += 1) {
    const current = ring[index];
    const next = ring[(index + 1) % ring.length];
    const currentLng = toFiniteNumber(current[0]);
    const currentLat = toFiniteNumber(current[1]);
    const nextLng = toFiniteNumber(next[0]);
    const nextLat = toFiniteNumber(next[1]);

    if (
      currentLng === null ||
      currentLat === null ||
      nextLng === null ||
      nextLat === null
    ) {
      continue;
    }

    fallbackPositions.push({ lng: currentLng, lat: currentLat });
    const cross = currentLng * nextLat - nextLng * currentLat;
    areaFactor += cross;
    lngSum += (currentLng + nextLng) * cross;
    latSum += (currentLat + nextLat) * cross;
  }

  if (Math.abs(areaFactor) > 1e-12) {
    return {
      lng: lngSum / (3 * areaFactor),
      lat: latSum / (3 * areaFactor),
      weight: Math.abs(areaFactor),
    };
  }

  if (fallbackPositions.length === 0) return null;

  return {
    lng:
      fallbackPositions.reduce((total, position) => total + position.lng, 0) /
      fallbackPositions.length,
    lat:
      fallbackPositions.reduce((total, position) => total + position.lat, 0) /
      fallbackPositions.length,
    weight: 1,
  };
};

const positionsCentroid = (
  positions: Position[],
): (GlobeMarkerPosition & { weight: number }) | null => {
  const safePositions = positions.flatMap((position) => {
    const lng = toFiniteNumber(position[0]);
    const lat = toFiniteNumber(position[1]);
    return lng === null || lat === null ? [] : [{ lng, lat }];
  });

  if (safePositions.length === 0) return null;

  return {
    lng:
      safePositions.reduce((total, position) => total + position.lng, 0) /
      safePositions.length,
    lat:
      safePositions.reduce((total, position) => total + position.lat, 0) /
      safePositions.length,
    weight: safePositions.length,
  };
};

const pointPosition = (
  position: Position,
): (GlobeMarkerPosition & { weight: number }) | null => {
  const lng = toFiniteNumber(position[0]);
  const lat = toFiniteNumber(position[1]);
  return lng === null || lat === null ? null : { lng, lat, weight: 1 };
};

const lineStringCentroid = (
  positions: Position[],
): (GlobeMarkerPosition & { weight: number }) | null =>
  ringCentroid(positions) ?? positionsCentroid(positions);

export const featureCollectionToMarkerPosition = (
  data: GlobeGeoJsonInput,
): GlobeMarkerPosition | null => {
  const features = geoJsonInputToFeatures(data);
  if (features.length === 0) return null;

  const centroids: Array<GlobeMarkerPosition & { weight: number }> = [];

  for (const feature of features) {
    const geometry = feature.geometry;
    if (geometry?.type === "Polygon") {
      const centroid = ringCentroid((geometry as Polygon).coordinates[0] ?? []);
      if (centroid) centroids.push(centroid);
    } else if (geometry?.type === "MultiPolygon") {
      for (const polygon of (geometry as MultiPolygon).coordinates) {
        const centroid = ringCentroid(polygon[0] ?? []);
        if (centroid) centroids.push(centroid);
      }
    } else if (geometry?.type === "LineString") {
      const centroid = lineStringCentroid((geometry as LineString).coordinates);
      if (centroid) centroids.push(centroid);
    } else if (geometry?.type === "MultiLineString") {
      for (const line of (geometry as MultiLineString).coordinates) {
        const centroid = lineStringCentroid(line);
        if (centroid) centroids.push(centroid);
      }
    } else if (geometry?.type === "Point") {
      const centroid = pointPosition((geometry as Point).coordinates);
      if (centroid) centroids.push(centroid);
    } else if (geometry?.type === "MultiPoint") {
      for (const point of (geometry as MultiPoint).coordinates) {
        const centroid = pointPosition(point);
        if (centroid) centroids.push(centroid);
      }
    }
  }

  if (centroids.length === 0) return null;

  const totalWeight = centroids.reduce(
    (total, centroid) => total + centroid.weight,
    0,
  );

  return {
    lng:
      centroids.reduce(
        (total, centroid) => total + centroid.lng * centroid.weight,
        0,
      ) / totalWeight,
    lat:
      centroids.reduce(
        (total, centroid) => total + centroid.lat * centroid.weight,
        0,
      ) / totalWeight,
  };
};

export const boundsToPointOfView = (
  bounds: GlobeBounds | null,
  options: { minAltitude?: number; maxAltitude?: number } = {},
): GlobePointOfView => {
  const [west, south, east, north] = normalizeBounds(bounds);
  const minAltitude = options.minAltitude ?? 0.00008;
  const maxAltitude = options.maxAltitude ?? 2.8;

  const lngSpan = Math.max(Math.abs(east - west), 0.001);
  const latSpan = Math.max(Math.abs(north - south), 0.001);
  const maxSpan = Math.max(lngSpan, latSpan);

  return {
    lng: (west + east) / 2,
    lat: (south + north) / 2,
    altitude: Math.max(minAltitude, Math.min(maxAltitude, maxSpan * 0.009 + 0.00008)),
  };
};

export const boundsToCameraZoom = (
  bounds: GlobeBounds | null,
  options: { minZoom?: number; maxZoom?: number } = {},
): number => {
  const [west, south, east, north] = normalizeBounds(bounds);
  const minZoom = options.minZoom ?? 0.6;
  const maxZoom = options.maxZoom ?? 1;
  const lngSpan = Math.max(Math.abs(east - west), 0.01);
  const latSpan = Math.max(Math.abs(north - south), 0.01);
  const maxSpan = Math.max(lngSpan, latSpan);

  return Math.max(minZoom, Math.min(maxZoom, maxSpan / 0.15));
};

export const pointOfViewToApproxBounds = (
  pov: Partial<GlobePointOfView> | null | undefined,
): GlobeBounds | null => {
  if (!pov || pov.lat == null || pov.lng == null) return null;

  const altitude = pov.altitude ?? 2.5;
  const span = Math.max(0.01, Math.min(180, (altitude - 0.00008) / 0.01));
  const half = span / 2;

  return normalizeBounds([
    pov.lng - half,
    pov.lat - half,
    pov.lng + half,
    pov.lat + half,
  ] as GlobeBounds);
};

export const getFeatureId = (
  feature: Feature,
  fallback: string,
): string | number => {
  if (feature.id !== undefined && feature.id !== null) return feature.id;

  const properties = feature.properties ?? {};
  const propertyId =
    properties.id ??
    properties.ID ??
    properties.objectId ??
    properties.occurrenceUri ??
    properties.name;

  if (typeof propertyId === "string" || typeof propertyId === "number") {
    return propertyId;
  }

  return fallback;
};

const getPointFeatureCoordinates = (feature: Feature): [number, number] | null => {
  if (feature.geometry?.type !== "Point") return null;

  const [lng, lat] = (feature.geometry as Point).coordinates;
  const safeLng = toFiniteNumber(lng);
  const safeLat = toFiniteNumber(lat);

  return safeLng === null || safeLat === null ? null : [lng, lat];
};

export const geoJsonToPointData = (
  data: GlobeGeoJsonInput,
  options: {
    kind: GlobePointKind;
    layerName: string;
    color?: string;
    radius?: number;
  },
): GlobePointDatum[] => {
  const features = geoJsonInputToFeatures(data);
  if (features.length === 0) return [];

  return features.flatMap((feature, index) => {
    const coordinates = getPointFeatureCoordinates(feature);
    if (!coordinates) return [];

    const [lng, lat] = coordinates;
    const properties = feature.properties ?? {};
    const id = getFeatureId(feature, `${options.layerName}-${index}`);
    const label =
      typeof properties.name === "string"
        ? properties.name
        : typeof properties.scientificName === "string"
          ? properties.scientificName
          : undefined;

    return [
      {
        id,
        kind: options.kind,
        layerName: options.layerName,
        lat,
        lng,
        color: options.color ?? getDynamicPointLayerColor(options.layerName),
        radius: options.radius ?? 0.08,
        label,
        feature: feature as Feature<Point>,
      },
    ];
  });
};

export const featureCollectionToPolygons = (
  data: GlobeGeoJsonInput,
  options: {
    kind: GlobePolygonKind;
    layerName: string;
    capColor: string | ((feature: Feature<Polygon | MultiPolygon>, index: number) => string);
    sideColor?: string;
    strokeColor?: string | boolean | null;
    altitude?: number;
  },
): GlobePolygonDatum[] => {
  const features = geoJsonInputToFeatures(data);
  if (features.length === 0) return [];

  return features.flatMap((feature, index) => {
    if (
      feature.geometry?.type !== "Polygon" &&
      feature.geometry?.type !== "MultiPolygon"
    ) {
      return [];
    }

    const polygonFeature = feature as Feature<Polygon | MultiPolygon>;
    const properties = polygonFeature.properties ?? {};
    const name = typeof properties.name === "string" ? properties.name : undefined;

    return [
      {
        id: String(getFeatureId(feature, `${options.layerName}-${index}`)),
        kind: options.kind,
        layerName: options.layerName,
        geometry: polygonFeature.geometry,
        properties,
        capColor:
          typeof options.capColor === "function"
            ? options.capColor(polygonFeature, index)
            : options.capColor,
        sideColor: options.sideColor ?? "rgba(255,255,255,0.08)",
        strokeColor: options.strokeColor ?? "#ffffff",
        altitude: options.altitude ?? 0.006,
        label: name,
      },
    ];
  });
};

const positionToPathPoint = (position: Position): [number, number] | null => {
  const [lng, lat] = position;
  const safeLng = toFiniteNumber(lng);
  const safeLat = toFiniteNumber(lat);
  return safeLng === null || safeLat === null ? null : [safeLat, safeLng];
};

const positionsToPath = (positions: Position[]): Array<[number, number]> =>
  positions.flatMap((position) => {
    const point = positionToPathPoint(position);
    return point ? [point] : [];
  });

const geometryToPaths = (geometry: Geometry): Array<Array<[number, number]>> => {
  if (geometry.type === "LineString") {
    return [positionsToPath((geometry as LineString).coordinates)];
  }

  if (geometry.type === "MultiLineString") {
    return (geometry as MultiLineString).coordinates.map(positionsToPath);
  }

  if (geometry.type === "Polygon") {
    return (geometry as Polygon).coordinates.map(positionsToPath);
  }

  if (geometry.type === "MultiPolygon") {
    return (geometry as MultiPolygon).coordinates.flatMap((polygon) =>
      polygon.map(positionsToPath),
    );
  }

  return [];
};

export const featureCollectionToPaths = (
  data: GlobeGeoJsonInput,
  options: { layerName: string; color?: string; stroke?: number } ,
): GlobePathDatum[] => {
  const features = geoJsonInputToFeatures(data);
  if (features.length === 0) return [];

  return features.flatMap((feature, featureIndex) => {
    if (!feature.geometry) return [];

    const properties = feature.properties ?? {};
    const label = typeof properties.name === "string" ? properties.name : undefined;

    return geometryToPaths(feature.geometry).flatMap((points, pathIndex) => {
      if (points.length < 2) return [];
      return [
        {
          id: `${getFeatureId(feature, `${options.layerName}-${featureIndex}`)}-${pathIndex}`,
          layerName: options.layerName,
          points,
          color: options.color ?? "#AC4197",
          stroke: options.stroke ?? 0.08,
          label,
        },
      ];
    });
  });
};

export const getDynamicPointLayerColor = (layerName: string): string => {
  const lower = layerName.toLowerCase();

  if (lower.includes("airstrip")) return "#FF4136";
  if (lower.includes("water")) return "#7FDBFF";
  if (lower.includes("surface")) return "#85144b";
  if (lower.includes("raft")) return "#000000";
  if (lower.includes("basecamp")) return "#2bce89";

  return "#FFA500";
};

const interpolateHexColor = (from: string, to: string, t: number): string => {
  const parse = (hex: string) => {
    const normalized = hex.replace("#", "");
    return [
      Number.parseInt(normalized.slice(0, 2), 16),
      Number.parseInt(normalized.slice(2, 4), 16),
      Number.parseInt(normalized.slice(4, 6), 16),
    ];
  };

  const [fr, fg, fb] = parse(from);
  const [tr, tg, tb] = parse(to);
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t);

  return `rgb(${mix(fr, tr)}, ${mix(fg, tg)}, ${mix(fb, tb)})`;
};

export const steppedColor = (
  value: unknown,
  stops: Array<[number, string]>,
): string => {
  const numericValue = toFiniteNumber(value) ?? stops[0]?.[0] ?? 0;
  if (stops.length === 0) return "#ffffff";
  if (numericValue <= stops[0][0]) return stops[0][1];

  for (let index = 1; index < stops.length; index += 1) {
    const [stopValue, stopColor] = stops[index];
    const [previousValue, previousColor] = stops[index - 1];

    if (numericValue === stopValue) return stopColor;

    if (numericValue < stopValue) {
      const denominator = stopValue - previousValue || 1;
      return interpolateHexColor(
        previousColor,
        stopColor,
        (numericValue - previousValue) / denominator,
      );
    }
  }

  return stops[stops.length - 1][1];
};

export const SPECIES_RICHNESS_STOPS: Array<[number, string]> = [
  [0, "#471064"],
  [2.4, "#306D8E"],
  [4.8, "#219F86"],
  [7.2, "#68CB5C"],
  [9.6, "#71CE55"],
  [12, "#FDE724"],
];

export const SHANNON_INDEX_STOPS: Array<[number, string]> = [
  [0, "#471064"],
  [1, "#306D8E"],
  [2, "#219F86"],
  [3, "#68CB5C"],
  [4, "#71CE55"],
  [5, "#FDE724"],
];
