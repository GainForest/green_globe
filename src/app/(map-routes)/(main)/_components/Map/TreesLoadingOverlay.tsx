"use client";
import { useEffect, useState, useCallback } from "react";
import useMapStore from "./store";
import useProjectOverlayStore from "../ProjectOverlay/store";
import bbox from "@turf/bbox";
import type { Map as MapboxMap } from "mapbox-gl";
import type { ProjectPolygonAPIResponse } from "../ProjectOverlay/store/types";

type ScreenBounds = { top: number; left: number; width: number; height: number };

const computeScreenBounds = (
  map: MapboxMap,
  polygon: ProjectPolygonAPIResponse
): ScreenBounds | null => {
  const [minLng, minLat, maxLng, maxLat] = bbox(
    polygon as unknown as GeoJSON.FeatureCollection
  );
  const sw = map.project([minLng, minLat]);
  const ne = map.project([maxLng, maxLat]);
  const rect = map.getContainer().getBoundingClientRect();

  const top = rect.top + Math.min(sw.y, ne.y);
  const left = rect.left + Math.min(sw.x, ne.x);
  const width = Math.abs(ne.x - sw.x);
  const height = Math.abs(ne.y - sw.y);

  if (width <= 0 || height <= 0) return null;
  return { top, left, width, height };
};

const TreesLoadingOverlay = () => {
  const mapRef = useMapStore((s) => s.mapRef);
  const mapLoaded = useMapStore((s) => s.mapLoaded);
  const highlightedPolygon = useMapStore((s) => s.highlightedPolygon);
  const treesAsync = useProjectOverlayStore((s) => s.treesAsync);
  const projectId = useProjectOverlayStore((s) => s.projectId);
  const [bounds, setBounds] = useState<ScreenBounds | null>(null);

  const isLoading =
    projectId !== undefined &&
    (!treesAsync || treesAsync._status === "loading");

  const update = useCallback(() => {
    const map = mapRef?.current;
    if (!map || !highlightedPolygon) {
      setBounds(null);
      return;
    }
    setBounds(computeScreenBounds(map, highlightedPolygon));
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

  if (!isLoading || !bounds) return null;

  return (
    <div
      className="pointer-events-none overflow-hidden"
      style={{ position: "fixed", zIndex: 10, ...bounds }}
    >
      <div className="trees-loading-shimmer" />
    </div>
  );
};

export default TreesLoadingOverlay;
