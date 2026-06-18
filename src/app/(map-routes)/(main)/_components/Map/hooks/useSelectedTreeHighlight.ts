import { useEffect } from "react";
import useMapStore from "../store";
import useProjectOverlayStore from "../../ProjectOverlay/store";
import usePreviewStore from "../../../_features/preview/store";

const useSelectedTreeHighlight = () => {
  const currentView = useMapStore((state) => state.currentView);
  const mapRef = useMapStore((state) => state.mapRef);
  const mapLoaded = useMapStore((state) => state.mapLoaded);
  const activeProjectId = useProjectOverlayStore((state) => state.projectId);
  const treesAsync = useProjectOverlayStore((state) => state.treesAsync);
  const selectedTreeUri = usePreviewStore((state) => state.treeUri);

  useEffect(() => {
    const globe = mapRef?.current;
    if (currentView !== "project" || !activeProjectId || !mapLoaded || !globe) {
      return;
    }

    if (treesAsync?._status !== "success" || !selectedTreeUri) {
      globe.setSelectedTreeId(null);
      return;
    }

    const matchingFeature = treesAsync.data?.features.find(
      (feature) => feature.properties.occurrenceUri === selectedTreeUri,
    );

    globe.setSelectedTreeId(matchingFeature?.id ?? null);

    return () => {
      globe.setSelectedTreeId(null);
    };
  }, [activeProjectId, currentView, mapLoaded, mapRef, selectedTreeUri, treesAsync]);
};

export default useSelectedTreeHighlight;
