"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  geoJsonInputToFeatures,
  type GlobeGeoJsonInput,
} from "@/app/(map-routes)/_utils/globe-data";
import useMapStore from "./store";
import useProjectOverlayStore from "../ProjectOverlay/store";
import type { ProjectPolygonAPIResponse } from "../ProjectOverlay/store/types";

type BoundaryShape = {
  points: string;
  closed: boolean;
};

type ScreenPoint = { x: number; y: number };

const POINT_BOUNDARY_RADIUS_PX = 24;
const POINT_BOUNDARY_SEGMENTS = 32;

const coordinatesToPoints = (
  getScreenCoords: (lng: number, lat: number) => ScreenPoint,
  positions: GeoJSON.Position[],
): string =>
  positions
    .map(([lng, lat]) => {
      const { x, y } = getScreenCoords(lng, lat);
      return `${x},${y}`;
    })
    .join(" ");

const pointToCircle = (
  getScreenCoords: (lng: number, lat: number) => ScreenPoint,
  coordinates: GeoJSON.Position,
): string => {
  const [lng, lat] = coordinates;
  const { x, y } = getScreenCoords(lng, lat);

  return Array.from({ length: POINT_BOUNDARY_SEGMENTS }, (_, index) => {
    const angle = (index / POINT_BOUNDARY_SEGMENTS) * Math.PI * 2;
    return `${x + Math.cos(angle) * POINT_BOUNDARY_RADIUS_PX},${y + Math.sin(angle) * POINT_BOUNDARY_RADIUS_PX}`;
  }).join(" ");
};

const lineStringToShape = (
  getScreenCoords: (lng: number, lat: number) => ScreenPoint,
  coordinates: GeoJSON.Position[],
): BoundaryShape[] => {
  if (coordinates.length < 2) return [];

  return [
    {
      points: coordinatesToPoints(getScreenCoords, coordinates),
      // Site boundaries are sometimes stored as LineString rings instead of Polygon.
      // Treat 3+ coordinate lines as boundary rings so selected sites still receive
      // the yellow outline/fill and clipped loader.
      closed: coordinates.length >= 3,
    },
  ];
};

const computeBoundaryShapes = (
  getScreenCoords: (lng: number, lat: number) => ScreenPoint,
  polygon: ProjectPolygonAPIResponse,
): BoundaryShape[] => {
  const features = geoJsonInputToFeatures(
    polygon as unknown as GlobeGeoJsonInput,
  );
  const shapes: BoundaryShape[] = [];

  for (const feature of features) {
    const geo = feature.geometry as GeoJSON.Geometry | null;
    if (!geo) continue;

    if (geo.type === "Polygon") {
      const [outerRing] = (geo as GeoJSON.Polygon).coordinates;
      if (outerRing) {
        shapes.push({
          points: coordinatesToPoints(getScreenCoords, outerRing),
          closed: true,
        });
      }
    } else if (geo.type === "MultiPolygon") {
      for (const poly of (geo as GeoJSON.MultiPolygon).coordinates) {
        const [outerRing] = poly;
        if (outerRing) {
          shapes.push({
            points: coordinatesToPoints(getScreenCoords, outerRing),
            closed: true,
          });
        }
      }
    } else if (geo.type === "LineString") {
      shapes.push(
        ...lineStringToShape(
          getScreenCoords,
          (geo as GeoJSON.LineString).coordinates,
        ),
      );
    } else if (geo.type === "MultiLineString") {
      for (const line of (geo as GeoJSON.MultiLineString).coordinates) {
        shapes.push(...lineStringToShape(getScreenCoords, line));
      }
    } else if (geo.type === "Point") {
      shapes.push({
        points: pointToCircle(getScreenCoords, (geo as GeoJSON.Point).coordinates),
        closed: true,
      });
    } else if (geo.type === "MultiPoint") {
      for (const point of (geo as GeoJSON.MultiPoint).coordinates) {
        shapes.push({
          points: pointToCircle(getScreenCoords, point),
          closed: true,
        });
      }
    }
  }

  return shapes.filter((shape) => shape.points.length > 0);
};

const TreesLoadingOverlay = () => {
  const mapRef = useMapStore((s) => s.mapRef);
  const mapLoaded = useMapStore((s) => s.mapLoaded);
  const highlightedPolygon = useMapStore((s) => s.highlightedPolygon);
  const treeOverlayReady = useMapStore((s) => s.treeOverlayReady);
  const treesAsync = useProjectOverlayStore((s) => s.treesAsync);
  const projectId = useProjectOverlayStore((s) => s.projectId);
  const [boundaryShapes, setBoundaryShapes] = useState<BoundaryShape[]>([]);

  const isLoading =
    projectId !== undefined &&
    (!treesAsync || treesAsync._status === "loading");
  const hasRenderableTreeData =
    treesAsync?._status === "success" && Boolean(treesAsync.data?.features.length);
  const shouldShowLoadingOverlay =
    isLoading || (hasRenderableTreeData && !treeOverlayReady);

  const update = useCallback(() => {
    const globe = mapRef?.current;
    if (!globe || !highlightedPolygon) {
      setBoundaryShapes([]);
      return;
    }

    const nextBoundaryShapes = computeBoundaryShapes(
      (lng, lat) => globe.getScreenCoords(lng, lat),
      highlightedPolygon,
    );

    setBoundaryShapes(nextBoundaryShapes);
  }, [mapRef, highlightedPolygon]);

  useEffect(() => {
    const globe = mapRef?.current;
    if (!mapLoaded || !globe) return;

    update();
    return globe.onMove(update);
  }, [mapLoaded, mapRef, update]);

  if (boundaryShapes.length === 0) return null;

  const closedShapes = boundaryShapes.filter((shape) => shape.closed);

  return (
    <svg
      className="pointer-events-none"
      data-testid="project-boundary-overlay"
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", zIndex: 10 }}
    >
      <defs>
        <linearGradient id="trees-shimmer-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="40%" stopColor="rgba(255,255,255,0)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.22)" />
          <stop offset="60%" stopColor="rgba(255,255,255,0)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <clipPath id="trees-loading-clip">
          {closedShapes.map((shape, i) => (
            <polygon key={i} points={shape.points} />
          ))}
        </clipPath>
      </defs>

      {shouldShowLoadingOverlay && closedShapes.length > 0 && (
        <g clipPath="url(#trees-loading-clip)" data-testid="trees-loading-overlay">
          <rect width="100%" height="100%" fill="rgba(255,255,255,0.07)" />
          <rect
            width="100%"
            height="100%"
            fill="url(#trees-shimmer-grad)"
            className="trees-shimmer-sweep"
          />
        </g>
      )}

      {boundaryShapes.map((shape, i) =>
        shape.closed ? (
          <polygon
            key={i}
            points={shape.points}
            fill="rgba(255, 234, 0, 0.08)"
            stroke="#FFEA00"
            strokeLinejoin="round"
            strokeWidth={3}
            vectorEffect="non-scaling-stroke"
          />
        ) : (
          <polyline
            key={i}
            points={shape.points}
            fill="none"
            stroke="#FFEA00"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeWidth={3}
            vectorEffect="non-scaling-stroke"
          />
        ),
      )}
    </svg>
  );
};

export default TreesLoadingOverlay;
