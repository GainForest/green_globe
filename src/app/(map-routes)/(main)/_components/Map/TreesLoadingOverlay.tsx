"use client";
import React, { useEffect, useState, useCallback } from "react";
import useMapStore from "./store";
import useProjectOverlayStore from "../ProjectOverlay/store";
import type { Map as MapboxMap } from "mapbox-gl";
import type { ProjectPolygonAPIResponse } from "../ProjectOverlay/store/types";

const computeClipRings = (
  map: MapboxMap,
  polygon: ProjectPolygonAPIResponse
): string[] => {
  const collection = polygon as unknown as GeoJSON.FeatureCollection;
  const rect = map.getContainer().getBoundingClientRect();
  const rings: string[] = [];

  const projectRing = (ring: number[][]): string =>
    ring
      .map(([lng, lat]) => {
        const { x, y } = map.project([lng, lat]);
        return `${rect.left + x},${rect.top + y}`;
      })
      .join(" ");

  for (const feature of collection.features ?? []) {
    const geo = feature.geometry as GeoJSON.Geometry;
    if (geo.type === "Polygon") {
      rings.push(projectRing((geo as GeoJSON.Polygon).coordinates[0]));
    } else if (geo.type === "MultiPolygon") {
      for (const poly of (geo as GeoJSON.MultiPolygon).coordinates) {
        rings.push(projectRing(poly[0]));
      }
    }
  }

  return rings;
};

const TreesLoadingOverlay = () => {
  const mapRef = useMapStore((s) => s.mapRef);
  const mapLoaded = useMapStore((s) => s.mapLoaded);
  const highlightedPolygon = useMapStore((s) => s.highlightedPolygon);
  const treesAsync = useProjectOverlayStore((s) => s.treesAsync);
  const projectId = useProjectOverlayStore((s) => s.projectId);
  const [rings, setRings] = useState<string[]>([]);

  const isLoading =
    projectId !== undefined &&
    (!treesAsync || treesAsync._status === "loading");

  const update = useCallback(() => {
    const map = mapRef?.current;
    if (!map || !highlightedPolygon) {
      setRings([]);
      return;
    }
    setRings(computeClipRings(map, highlightedPolygon));
  }, [mapRef, highlightedPolygon]);

  useEffect(() => {
    const map = mapRef?.current;
    if (!mapLoaded || !map) return;
    update();
    map.on("move", update);
    return () => {
      map.off("move", update);
    };
  }, [mapLoaded, mapRef, update]);

  if (!isLoading || rings.length === 0) return null;

  return (
    <svg
      className="pointer-events-none"
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
          {rings.map((pts, i) => (
            <polygon key={i} points={pts} />
          ))}
        </clipPath>
      </defs>

      <rect
        width="100%"
        height="100%"
        fill="rgba(255,255,255,0.07)"
        clipPath="url(#trees-loading-clip)"
      />

      <rect
        width="100%"
        height="100%"
        fill="url(#trees-shimmer-grad)"
        clipPath="url(#trees-loading-clip)"
        className="trees-shimmer-sweep"
      />
    </svg>
  );
};

export default TreesLoadingOverlay;
