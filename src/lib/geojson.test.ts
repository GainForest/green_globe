import { describe, expect, it } from "vitest";
import {
  computePolygonMetrics,
  HECTARES_PER_SQUARE_METER,
} from "./geojson";
import {
  area as turfArea,
  bbox as turfBbox,
  centerOfMass,
  featureCollection,
  multiPolygon,
  point,
  polygon,
} from "@turf/turf";
import type { GeoJsonObject, GeometryCollection } from "geojson";

const closeTo = (value: number | null | undefined, expected: number, digits = 6) => {
  expect(value).not.toBeNull();
  expect(value).not.toBeUndefined();
  if (value === null || value === undefined) return;
  expect(value).toBeCloseTo(expected, digits);
};

describe("computePolygonMetrics", () => {
  it("computes area, centroid, and bbox for a single polygon feature", () => {
    const square = polygon([
      [
        [0, 0],
        [0.001, 0],
        [0.001, 0.001],
        [0, 0.001],
        [0, 0],
      ],
    ]);

    const metrics = computePolygonMetrics(square as GeoJsonObject);
    const expectedArea = turfArea(square);
    const expectedCentroid = centerOfMass(square);
    const expectedBbox = turfBbox(square);

    closeTo(metrics.areaSqMeters, expectedArea, 3);
    closeTo(
      metrics.areaHectares,
      expectedArea * HECTARES_PER_SQUARE_METER,
      6
    );
    closeTo(
      metrics.centroid?.lon,
      expectedCentroid.geometry.coordinates[0],
      8
    );
    closeTo(
      metrics.centroid?.lat,
      expectedCentroid.geometry.coordinates[1],
      8
    );
    expect(metrics.bbox).toEqual(expectedBbox);
  });

  it("sums areas and returns blended centroid for a feature collection", () => {
    const squareA = polygon([
      [
        [0, 0],
        [0.001, 0],
        [0.001, 0.001],
        [0, 0.001],
        [0, 0],
      ],
    ]);
    const squareB = polygon([
      [
        [0.002, 0],
        [0.003, 0],
        [0.003, 0.001],
        [0.002, 0.001],
        [0.002, 0],
      ],
    ]);

    const collection = featureCollection([squareA, squareB]);
    const metrics = computePolygonMetrics(collection as GeoJsonObject);
    const expectedArea =
      turfArea(squareA) +
      turfArea(squareB);
    const expectedCentroid = centerOfMass(collection);
    const expectedBbox = turfBbox(collection);

    closeTo(metrics.areaSqMeters, expectedArea, 3);
    closeTo(
      metrics.areaHectares,
      expectedArea * HECTARES_PER_SQUARE_METER,
      6
    );
    closeTo(
      metrics.centroid?.lon,
      expectedCentroid.geometry.coordinates[0],
      8
    );
    closeTo(
      metrics.centroid?.lat,
      expectedCentroid.geometry.coordinates[1],
      8
    );
    expect(metrics.bbox).toEqual(expectedBbox);
  });

  it("handles multi polygons and geometry collections", () => {
    const polyOne = polygon([
      [
        [0, 0],
        [0, 0.002],
        [0.002, 0.002],
        [0.002, 0],
        [0, 0],
      ],
    ]);
    const polyTwo = polygon([
      [
        [0.003, 0],
        [0.003, 0.001],
        [0.004, 0.001],
        [0.004, 0],
        [0.003, 0],
      ],
    ]);

    const geometry: GeometryCollection = {
      type: "GeometryCollection",
      geometries: [
        multiPolygon([polyOne.geometry.coordinates, polyTwo.geometry.coordinates])
          .geometry,
        point([10, 10]).geometry,
      ],
    };

    const metrics = computePolygonMetrics(geometry);
    const expectedArea = turfArea(
      featureCollection([polyOne, polyTwo])
    );
    const expectedBbox = turfBbox(
      featureCollection([polyOne, polyTwo])
    );

    closeTo(metrics.areaSqMeters, expectedArea, 3);
    closeTo(
      metrics.areaHectares,
      expectedArea * HECTARES_PER_SQUARE_METER,
      6
    );
    expect(metrics.centroid).not.toBeNull();
    expect(metrics.bbox).toEqual(expectedBbox);
  });

  it("returns null metrics when no polygonal geometries exist", () => {
    const points = featureCollection([
      point([0, 0]),
      point([1, 1]),
    ]);

    const metrics = computePolygonMetrics(points as GeoJsonObject);

    expect(metrics.areaSqMeters).toBeNull();
    expect(metrics.areaHectares).toBeNull();
    expect(metrics.centroid).toBeNull();
    expect(metrics.bbox).toBeNull();
  });
});
