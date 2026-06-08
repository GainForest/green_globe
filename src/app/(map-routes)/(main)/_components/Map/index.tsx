"use client";
import React, { useRef } from "react";
import "@/app/(map-routes)/_styles/map.css";

import { useHoveredTreeInfo } from "./hooks/useHoveredTreeInfo";
import useProjectTrees from "./hooks/useProjectTrees";
import useGlobe from "./hooks/useGlobe";
import useDynamicLayers from "./hooks/useDynamicLayers";
import useBounds from "./hooks/useBounds";
import useHighlightedPolygon from "./hooks/useHighlightedPolygon";
import useLandcoverLayer from "./hooks/useLandcoverLayer";
import useSelectedTreeHighlight from "./hooks/useSelectedTreeHighlight";
import useActiveProjectMarker from "./hooks/useActiveProjectMarker";

const Map = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useGlobe(mapContainerRef);
  useBounds();
  useHighlightedPolygon();
  useActiveProjectMarker();
  useProjectTrees();
  useHoveredTreeInfo();
  useSelectedTreeHighlight();
  useLandcoverLayer();
  useDynamicLayers();

  return (
    <div
      style={{ height: "100%" }}
      ref={mapContainerRef}
      data-testid="map-root"
      className="map-container flex-1"
    />
  );
};

export default Map;
