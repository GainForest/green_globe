import { useEffect } from "react";
import useLayersOverlayStore from "../../LayersOverlay/store";
import useMapStore from "../store";

const useLandcoverLayer = () => {
  const mapLoaded = useMapStore((state) => state.mapLoaded);
  const isLandcoverLayerVisible = useLayersOverlayStore(
    (state) => state.staticLayersVisibility.landcover,
  );
  const mapRef = useMapStore((state) => state.mapRef);

  useEffect(() => {
    const globe = mapRef?.current;
    if (!mapLoaded || !globe) return;

    globe.setLandcoverVisible(isLandcoverLayerVisible);
  }, [mapLoaded, mapRef, isLandcoverLayerVisible]);
};

export default useLandcoverLayer;
