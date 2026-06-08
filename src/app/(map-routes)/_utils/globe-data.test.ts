import { describe, expect, it } from "vitest";
import {
  boundsToCameraZoom,
  boundsToPointOfView,
  featureCollectionToMarkerPosition,
  featureCollectionToPaths,
  featureCollectionToPolygons,
  geoJsonToPointData,
  pointOfViewToApproxBounds,
  steppedColor,
  SPECIES_RICHNESS_STOPS,
} from "./globe-data";

const pointCollection = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      id: "point-a",
      properties: { name: "Point A" },
      geometry: { type: "Point" as const, coordinates: [36.8, -1.2] },
    },
  ],
};

const polygonCollection = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      properties: { name: "Site", species_richness: 6 },
      geometry: {
        type: "Polygon" as const,
        coordinates: [
          [
            [36.8, -1.2],
            [36.9, -1.2],
            [36.9, -1.1],
            [36.8, -1.1],
            [36.8, -1.2],
          ],
        ],
      },
    },
  ],
};

const lineBoundaryCollection = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      properties: { name: "Line boundary" },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [36.8, -1.2],
          [36.9, -1.2],
          [36.9, -1.1],
          [36.8, -1.1],
        ],
      },
    },
  ],
};

const bareFeatureBoundary = {
  type: "Feature" as const,
  properties: { name: "Bare feature boundary" },
  geometry: {
    type: "MultiPolygon" as const,
    coordinates: [
      [
        [
          [36.8, -1.2],
          [36.9, -1.2],
          [36.9, -1.1],
          [36.8, -1.1],
          [36.8, -1.2],
        ],
      ],
    ],
  },
};

describe("globe-data", () => {
  it("converts GeoJSON point features to lat/lng globe points", () => {
    const points = geoJsonToPointData(pointCollection, {
      kind: "dynamic-point",
      layerName: "Community Wells",
    });

    expect(points).toHaveLength(1);
    expect(points[0]).toMatchObject({
      id: "point-a",
      lat: -1.2,
      lng: 36.8,
      label: "Point A",
    });
  });

  it("computes a project marker position from the selected site polygon", () => {
    const position = featureCollectionToMarkerPosition(polygonCollection);

    expect(position).not.toBeNull();
    expect(position?.lat).toBeCloseTo(-1.15);
    expect(position?.lng).toBeCloseTo(36.85);
  });

  it("computes a project marker position from line-stored boundaries", () => {
    const position = featureCollectionToMarkerPosition(lineBoundaryCollection);

    expect(position).not.toBeNull();
    expect(position?.lat).toBeCloseTo(-1.15);
    expect(position?.lng).toBeCloseTo(36.85);
  });

  it("computes a project marker position from bare GeoJSON features", () => {
    const position = featureCollectionToMarkerPosition(bareFeatureBoundary);

    expect(position).not.toBeNull();
    expect(position?.lat).toBeCloseTo(-1.15);
    expect(position?.lng).toBeCloseTo(36.85);
  });

  it("converts polygons and polygon rings to globe polygon/path data", () => {
    const polygons = featureCollectionToPolygons(polygonCollection, {
      kind: "highlighted-site",
      layerName: "active-site",
      capColor: "rgba(255, 234, 0, 0.08)",
    });
    const paths = featureCollectionToPaths(polygonCollection, {
      layerName: "active-site-outline",
    });

    expect(polygons).toHaveLength(1);
    expect(polygons[0].geometry.type).toBe("Polygon");
    expect(paths).toHaveLength(1);
    expect(paths[0].points[0]).toEqual([-1.2, 36.8]);
  });

  it("maps bbox to a deterministic point of view and approximate bounds", () => {
    const pov = boundsToPointOfView([36.8, -1.2, 36.9, -1.1]);

    expect(pov.lat).toBeCloseTo(-1.15);
    expect(pov.lng).toBeCloseTo(36.85);
    expect(pov.altitude).toBeCloseTo(0.00098);

    expect(boundsToCameraZoom([36.8, -1.2, 36.9, -1.1])).toBeCloseTo(2 / 3);

    const approx = pointOfViewToApproxBounds(pov);
    expect(approx).not.toBeNull();
    expect(approx?.[0]).toBeLessThan(pov.lng);
    expect(approx?.[2]).toBeGreaterThan(pov.lng);
  });

  it("interpolates choropleth colors from legacy style stops", () => {
    expect(steppedColor(0, SPECIES_RICHNESS_STOPS)).toBe("#471064");
    expect(steppedColor(12, SPECIES_RICHNESS_STOPS)).toBe("#FDE724");
    expect(steppedColor(6, SPECIES_RICHNESS_STOPS)).toMatch(/^rgb\(/);
  });
});
