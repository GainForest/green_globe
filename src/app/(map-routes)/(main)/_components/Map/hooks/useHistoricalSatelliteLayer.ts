import { useEffect } from "react";
import useLayersOverlayStore from "../../LayersOverlay/store";
import useMapStore from "../store";

const useHistoricalSatelliteLayer = () => {
  const mapLoaded = useMapStore((state) => state.mapLoaded);
  const isHistoricalSatelliteLayerVisible = useLayersOverlayStore(
    (state) => state.staticLayersVisibility.historicalSatellite
  );
  const { formattedPreviousDate, formattedCurrentDate } = useLayersOverlayStore(
    (state) => state.historicalSatelliteState
  );
  const mapRef = useMapStore((state) => state.mapRef);
  useEffect(() => {
    if (!mapLoaded) return;
    const map = mapRef?.current;
    if (!map) return;

    if (formattedPreviousDate) {
      try {
        const previousMapLayerName = `planetLayer${formattedPreviousDate}`;
        map.setLayoutProperty(previousMapLayerName, "visibility", "none");
      } catch {}
    }

    const mapLayerName = `planetLayer${formattedCurrentDate}`;

    if (isHistoricalSatelliteLayerVisible) {
      map.setLayoutProperty(mapLayerName, "visibility", "visible");
    } else {
      map.setLayoutProperty(mapLayerName, "visibility", "none");
    }
  }, [mapLoaded, isHistoricalSatelliteLayerVisible, formattedCurrentDate]);
};

export default useHistoricalSatelliteLayer;
