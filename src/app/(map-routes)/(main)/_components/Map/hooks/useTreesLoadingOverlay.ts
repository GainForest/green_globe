import { useEffect } from "react";
import useMapStore from "../store";
import useProjectOverlayStore from "../../ProjectOverlay/store";

const useTreesLoadingOverlay = () => {
  const mapRef = useMapStore((s) => s.mapRef);
  const mapLoaded = useMapStore((s) => s.mapLoaded);
  const treesAsync = useProjectOverlayStore((s) => s.treesAsync);
  const projectId = useProjectOverlayStore((s) => s.projectId);

  const isLoading =
    projectId !== undefined &&
    (!treesAsync || treesAsync._status === "loading");

  useEffect(() => {
    const map = mapRef?.current;
    if (!mapLoaded || !map || !map.getLayer("treesLoadingFill")) return;

    if (!isLoading) {
      map.setLayoutProperty("treesLoadingFill", "visibility", "none");
      return;
    }

    map.setLayoutProperty("treesLoadingFill", "visibility", "visible");
    map.setPaintProperty("treesLoadingFill", "fill-opacity", 0.08);
  }, [isLoading, mapLoaded, mapRef]);
};

export default useTreesLoadingOverlay;
