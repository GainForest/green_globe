import { useEffect } from "react";
import useMapStore from "../store";
import { GeoJSONSource } from "mapbox-gl";
import { GeoJsonObject } from "geojson";
import { AllGeoJSON } from "@turf/turf";

/**
 * When the active project polygon changes, fit the map to the polygon and update the highlighted site source
 * @param mapRef - The ref to the map
 */
const useHighlightedPolygon = () => {
  const highlightedPolygon = useMapStore((state) => state.highlightedPolygon);
  const mapRef = useMapStore((state) => state.mapRef);

  useEffect(() => {
    const map = mapRef?.current;
    if (!map || !highlightedPolygon) return;

    (map.getSource("highlightedSite") as GeoJSONSource | undefined)?.setData(
      highlightedPolygon satisfies GeoJsonObject as AllGeoJSON
    );
  }, [mapRef, highlightedPolygon]);
};

export default useHighlightedPolygon;
