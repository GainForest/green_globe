import { useEffect } from "react";
import useMapStore from "../store";

const useHighlightedPolygon = () => {
  const highlightedPolygon = useMapStore((state) => state.highlightedPolygon);
  const mapRef = useMapStore((state) => state.mapRef);
  const mapLoaded = useMapStore((state) => state.mapLoaded);

  useEffect(() => {
    const globe = mapRef?.current;
    if (!mapLoaded || !globe) return;

    globe.setHighlightedPolygon(
      highlightedPolygon as unknown as GeoJSON.FeatureCollection | null,
    );
  }, [mapLoaded, mapRef, highlightedPolygon]);
};

export default useHighlightedPolygon;
