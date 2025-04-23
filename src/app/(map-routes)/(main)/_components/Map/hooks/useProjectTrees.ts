import { useEffect } from "react";
import useMapStore from "../store";
import { GeoJSONSource } from "mapbox-gl";
import useProjectOverlayStore from "../../ProjectOverlay/store";

const useProjectTrees = () => {
  const mapRef = useMapStore((state) => state.mapRef);
  const currentView = useMapStore((state) => state.currentView);
  const projectTreesAsync = useProjectOverlayStore((state) => state.treesAsync);

  const projectTrees = projectTreesAsync ? projectTreesAsync.data : null;

  useEffect(() => {
    if (currentView !== "project") return;
    const map = mapRef?.current;
    if (!map || !projectTrees) return;

    (map.getSource("trees") as GeoJSONSource | undefined)?.setData(
      projectTrees
    );
  }, [mapRef, currentView, projectTrees]);
};

export default useProjectTrees;
