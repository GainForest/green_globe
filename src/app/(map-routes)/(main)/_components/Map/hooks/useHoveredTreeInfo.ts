import { useCallback, useEffect, useRef } from "react";

import type { GlobePointDatum } from "@/app/(map-routes)/_utils/globe-data";
import { getTreeInformationFromFeature } from "../utils";
import useHoveredTreeOverlayStore, {
  HoveredTreeOverlayState,
} from "../../HoveredTreeOverlay/store";
import useMapStore from "../store";
import useProjectOverlayStore from "../../ProjectOverlay/store";
import type { NormalizedTreeFeature } from "../../ProjectOverlay/store/types";

export function useHoveredTreeInfo() {
  const currentView = useMapStore((state) => state.currentView);
  const activeProjectId = useProjectOverlayStore((state) => state.projectId);
  const mapRef = useMapStore((state) => state.mapRef);
  const mapLoaded = useMapStore((state) => state.mapLoaded);

  const setTreeInformation = useHoveredTreeOverlayStore(
    (actions) => actions.setTreeInformation,
  );
  const clearSelectedTreeInformation = useHoveredTreeOverlayStore(
    (actions) => actions.clearSelectedTreeInformation,
  );

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSetTreesInformation = useCallback(
    (treeInfo: HoveredTreeOverlayState["treeInformation"]) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        setTreeInformation(treeInfo);
      }, 150);
    },
    [setTreeInformation],
  );

  const cleanup = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    setTreeInformation(null);
    clearSelectedTreeInformation();
  }, [clearSelectedTreeInformation, setTreeInformation]);

  useEffect(() => {
    if (currentView !== "project" || !activeProjectId) return;
    const globe = mapRef?.current;
    if (!mapLoaded || !globe) return;

    globe.setCallbacks({
      onHighlightedPolygonClick: () => globe.setTreesVisible(true),
      onTreeHover: (point: GlobePointDatum | null) => {
        const treeInformation = getTreeInformationFromFeature(
          point?.feature as NormalizedTreeFeature | undefined,
          activeProjectId,
        );
        debouncedSetTreesInformation(treeInformation);
      },
    });

    return () => {
      cleanup();
    };
  }, [
    currentView,
    activeProjectId,
    mapLoaded,
    mapRef,
    debouncedSetTreesInformation,
    cleanup,
  ]);
}
