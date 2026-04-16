import { useEffect, useRef } from "react";
import useMapStore from "../store";
import useProjectOverlayStore from "../../ProjectOverlay/store";
import usePreviewStore from "../../../_features/preview/store";

type FeatureIdentifier = string | number;

const useSelectedTreeHighlight = () => {
  const currentView = useMapStore((state) => state.currentView);
  const mapRef = useMapStore((state) => state.mapRef);
  const mapLoaded = useMapStore((state) => state.mapLoaded);
  const activeProjectId = useProjectOverlayStore((state) => state.projectId);
  const treesAsync = useProjectOverlayStore((state) => state.treesAsync);
  const selectedTreeUri = usePreviewStore((state) => state.treeUri);

  const selectedFeatureIdRef = useRef<FeatureIdentifier | null>(null);

  useEffect(() => {
    if (currentView !== "project" || !activeProjectId) {
      return;
    }

    const map = mapRef?.current;
    if (!mapLoaded || !map || !map.getSource("trees")) {
      return;
    }

    const previousFeatureId = selectedFeatureIdRef.current;
    if (previousFeatureId !== null) {
      map.setFeatureState(
        { source: "trees", id: previousFeatureId },
        { selected: false },
      );
      selectedFeatureIdRef.current = null;
    }

    if (treesAsync?._status !== "success" || !selectedTreeUri) {
      return;
    }

    const matchingFeature = treesAsync.data?.features.find(
      (feature) => feature.properties.occurrenceUri === selectedTreeUri,
    );

    if (!matchingFeature) {
      return;
    }

    map.setFeatureState(
      { source: "trees", id: matchingFeature.id },
      { selected: true },
    );
    selectedFeatureIdRef.current = matchingFeature.id;

    return () => {
      const featureId = selectedFeatureIdRef.current;
      if (featureId !== null && map.getSource("trees")) {
        map.setFeatureState({ source: "trees", id: featureId }, { selected: false });
      }
      selectedFeatureIdRef.current = null;
    };
  }, [activeProjectId, currentView, mapLoaded, mapRef, selectedTreeUri, treesAsync]);
};

export default useSelectedTreeHighlight;
