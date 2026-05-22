import { useEffect } from "react";
import useMapStore from "../store";
import { GeoJSONSource } from "mapbox-gl";

const EMPTY_HIGHLIGHTED_SITE: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

/**
 * When the active project polygon changes, fit the map to the polygon and update the highlighted site source
 * @param mapRef - The ref to the map
 */
const useHighlightedPolygon = () => {
  const highlightedPolygon = useMapStore((state) => state.highlightedPolygon);
  const mapRef = useMapStore((state) => state.mapRef);
  const mapLoaded = useMapStore((state) => state.mapLoaded);

  useEffect(() => {
    const map = mapRef?.current;
    if (!mapLoaded || !map) return;

    (map.getSource("highlightedSite") as GeoJSONSource | undefined)?.setData(
      highlightedPolygon ?? EMPTY_HIGHLIGHTED_SITE,
    );
  }, [mapLoaded, mapRef, highlightedPolygon]);
};

export default useHighlightedPolygon;
