"use client";
import React, { useRef } from "react";
import "@/app/(map-routes)/_styles/map.css";
import "mapbox-gl/dist/mapbox-gl.css";

import { useHoveredTreeInfo } from "./hooks/useHoveredTreeInfo";
import useProjectTrees from "./hooks/useProjectTrees";
import useHistoricalSatelliteLayer from "./hooks/useHistoricalSatelliteLayer";
import useMapbox from "./hooks/useMapbox";
import useDynamicLayers from "./hooks/useDynamicLayers";
import useBounds from "./hooks/useBounds";
import useHighlightedPolygon from "./hooks/useHighlightedPolygon";
import useLandcoverLayer from "./hooks/useLandcoverLayer";

const Map = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useMapbox(mapContainerRef);
  useBounds();
  useHighlightedPolygon();
  useProjectTrees();
  useHoveredTreeInfo();
  useHistoricalSatelliteLayer();
  useLandcoverLayer();
  useDynamicLayers();

  return (
    <div
      style={{ height: "100%" }}
      ref={mapContainerRef}
      className="map-container flex-1"
    ></div>
  );
};

export default Map;
