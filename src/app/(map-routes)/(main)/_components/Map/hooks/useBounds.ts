import { useEffect } from "react";
import useMapStore from "../store";
import useOverlayStore from "../../Overlay/store";

const useBounds = () => {
  const bounds = useMapStore((state) => state.mapBounds);
  const mapRef = useMapStore((state) => state.mapRef);
  const mapLoaded = useMapStore((state) => state.mapLoaded);

  const isOverlayOpen = useOverlayStore((state) => state.isOpen);
  const size = useOverlayStore((state) => state.size);

  const shouldAddExtraLeftPadding = size === "desktop" && isOverlayOpen;

  useEffect(() => {
    const globe = mapRef?.current;
    if (!mapLoaded || !globe || !bounds) return;

    globe.fitBounds(bounds, {
      extraLeftPadding: shouldAddExtraLeftPadding,
    });
  }, [mapLoaded, mapRef, bounds, shouldAddExtraLeftPadding]);
};

export default useBounds;
