import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const toKebabCase = (str: string) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
};

export const camelCaseToTitleCase = (input: string) => {
  return input
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, function (str: string) {
      return str.toUpperCase();
    });
};

export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]>[] => {
  const groupedDataKeys: string[] = [];
  const groupedData = new Map<string, T[]>();

  array.forEach((item) => {
    const value = item[key];
    let valueStr: string;
    if (typeof value === "string") {
      valueStr = value;
    } else if (typeof value === "number") {
      valueStr = value.toString();
    } else {
      return;
    }

    if (groupedData.has(valueStr)) {
      groupedData.get(valueStr)?.push(item);
    } else {
      groupedData.set(valueStr, [item]);
      groupedDataKeys.push(valueStr);
    }
  });

  return groupedDataKeys.map((key) => ({
    [key]: groupedData.get(key),
  })) as Record<string, T[]>[];
};

export function truncateAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export const resolveLayerUrl = (endpoint: string): string => {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }
  return `${process.env.NEXT_PUBLIC_AWS_STORAGE}/${endpoint}`;
};

// Recursively collect all [lng, lat] pairs from any GeoJSON geometry coordinate array.
function collectCoords(value: unknown, out: [number, number][]): void {
  if (!Array.isArray(value)) return;
  if (typeof value[0] === "number" && typeof value[1] === "number") {
    out.push([value[0] as number, value[1] as number]);
  } else {
    for (const child of value) collectCoords(child, out);
  }
}

export const geojsonBbox = (
  geojson: Record<string, unknown>
): [number, number, number, number] | null => {
  const coords: [number, number][] = [];

  const processGeometry = (geom: Record<string, unknown>) => {
    if (!geom) return;
    if (geom.type === "GeometryCollection") {
      for (const g of (geom.geometries as Record<string, unknown>[]) ?? [])
        processGeometry(g);
    } else {
      collectCoords(geom.coordinates, coords);
    }
  };

  if (geojson.type === "FeatureCollection") {
    for (const f of (geojson.features as { geometry: Record<string, unknown> }[]) ?? [])
      if (f.geometry) processGeometry(f.geometry);
  } else if (geojson.type === "Feature") {
    const g = geojson.geometry as Record<string, unknown>;
    if (g) processGeometry(g);
  } else {
    processGeometry(geojson);
  }

  if (!coords.length) return null;
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }
  return [minLng, minLat, maxLng, maxLat];
};
