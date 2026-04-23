import { useEffect } from "react";
import useMapStore from "../store";
import { GeoJSONSource } from "mapbox-gl";
import useProjectOverlayStore from "../../ProjectOverlay/store";
import type { MeasuredTreesGeoJSON } from "../../ProjectOverlay/store/types";

const EMPTY_TREES_GEOJSON: MeasuredTreesGeoJSON = {
  type: "FeatureCollection",
  features: [],
};

const useProjectTrees = () => {
  const mapRef = useMapStore((state) => state.mapRef);
  const mapLoaded = useMapStore((state) => state.mapLoaded);
  const currentView = useMapStore((state) => state.currentView);
  const projectTreesAsync = useProjectOverlayStore((state) => state.treesAsync);

  const projectTrees = projectTreesAsync ? projectTreesAsync.data : null;

  useEffect(() => {
    if (currentView !== "project") return;
    const map = mapRef?.current;
    if (!mapLoaded || !map) return;

    (map.getSource("trees") as GeoJSONSource | undefined)?.setData(
      projectTrees ?? EMPTY_TREES_GEOJSON,
    );
  }, [mapLoaded, mapRef, currentView, projectTrees]);
};

export default useProjectTrees;
