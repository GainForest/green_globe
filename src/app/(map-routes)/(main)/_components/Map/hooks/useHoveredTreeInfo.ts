import { useCallback, useEffect, useRef } from "react";
import { MapMouseEvent } from "mapbox-gl";

import { getTreeInformation } from "../utils";
import useHoveredTreeOverlayStore, {
  HoveredTreeOverlayState,
} from "../../HoveredTreeOverlay/store";
import useMapStore from "../store";
import useProjectOverlayStore from "../../ProjectOverlay/store";
import { toggleMeasuredTreesLayer } from "../sources-and-layers/measured-trees";
import { NormalizedTreeFeature } from "../../ProjectOverlay/store/types";

export function useHoveredTreeInfo() {
  const currentView = useMapStore((state) => state.currentView);
  const activeProjectId = useProjectOverlayStore((state) => state.projectId);
  const mapRef = useMapStore((state) => state.mapRef);

  // Get the setter from the store
  const setTreeInformation = useHoveredTreeOverlayStore(
    (actions) => actions.setTreeInformation
  );

  // Debounce timeout ref
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create a ref to track the currently hovered tree ID
  const hoveredTreeIdRef = useRef<number | null>(null);

  // Debounced version of setTreeInformation
  const debouncedSetTreesInformation = useCallback(
    (treeInfo: HoveredTreeOverlayState["treeInformation"]) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        setTreeInformation(treeInfo);
      }, 150);
    },
    [setTreeInformation]
  );

  // Handler for mouse move events
  const handleMouseMoveUnclusteredTrees = useCallback(
    (e: MapMouseEvent, map: mapboxgl.Map, activeProjectId: string) => {
      if (!e.features || e.features.length <= 0) return;

      const treeInformation = getTreeInformation(e, activeProjectId);
      debouncedSetTreesInformation(treeInformation);

      if (hoveredTreeIdRef.current !== null) {
        map.setFeatureState(
          { source: "trees", id: hoveredTreeIdRef.current },
          { hover: false }
        );
      }

      const hoveredTreeFeature = e.features.find((feature) => {
        if (!feature.properties) return null;
        return (
          "type" in feature.properties &&
          feature.properties.type === "measured-tree"
        );
      }) as NormalizedTreeFeature | undefined;

      if (!hoveredTreeFeature) return;
      hoveredTreeIdRef.current = hoveredTreeFeature.id;
      map.setFeatureState(
        { source: "trees", id: hoveredTreeFeature.id },
        { hover: true }
      );
    },
    [debouncedSetTreesInformation]
  );

  // Cleanup function
  const cleanup = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Reset the hovered tree ID ref
    hoveredTreeIdRef.current = null;
  }, []);

  useEffect(() => {
    if (currentView !== "project" || !activeProjectId) return;
    const map = mapRef?.current;
    if (!map) return;

    const onClickProjectFill = () => {
      toggleMeasuredTreesLayer(map, "visible");
    };

    const onMouseMoveUnclusteredTrees = (e: MapMouseEvent) => {
      handleMouseMoveUnclusteredTrees(e, map, activeProjectId);
    };

    map.on("click", "projectFill", onClickProjectFill);
    map.on("mousemove", "unclusteredTrees", onMouseMoveUnclusteredTrees);

    return () => {
      if (map) {
        map.off("click", "projectFill", onClickProjectFill);
        map.off("mousemove", "unclusteredTrees", onMouseMoveUnclusteredTrees);
      }
      // Clean up the hovered tree info
      cleanup();
    };
  }, [currentView, activeProjectId, handleMouseMoveUnclusteredTrees, cleanup]);
}
