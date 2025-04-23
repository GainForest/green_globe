import { useEffect } from "react";
import useLayersOverlayStore from "../../LayersOverlay/store";
import useMapStore from "../store";

const useLandcoverLayer = () => {
  const mapLoaded = useMapStore((state) => state.mapLoaded);
  const isLandcoverLayerVisible = useLayersOverlayStore(
    (state) => state.staticLayersVisibility.landcover
  );
  const mapRef = useMapStore((state) => state.mapRef);
  
  useEffect(() => {
    if (!mapLoaded) return;
    const map = mapRef?.current;
    if (!map) return;

    const mapLayerName = "landCoverLayer";

    if (isLandcoverLayerVisible) {
      map.setLayoutProperty(mapLayerName, "visibility", "visible");
    } else {
      map.setLayoutProperty(mapLayerName, "visibility", "none");
    }
  }, [mapLoaded, isLandcoverLayerVisible]);
};

export default useLandcoverLayer;
