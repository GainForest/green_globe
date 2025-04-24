import { useEffect } from "react";
import useMapStore from "../store";
import useOverlayStore from "../../Overlay/store";

/**
 * When the active project polygon changes, fit the map to the polygon and update the highlighted site source
 * @param mapRef - The ref to the map
 */
const useBounds = () => {
  const bounds = useMapStore((state) => state.mapBounds);
  const mapRef = useMapStore((state) => state.mapRef);

  const isOverlayOpen = useOverlayStore((state) => state.isOpen);
  const size = useOverlayStore((state) => state.size);

  const shouldAddExtraLeftPadding = size === "desktop" && isOverlayOpen;

  useEffect(() => {
    const map = mapRef?.current;
    if (!map || !bounds) return;

    map.fitBounds(bounds, {
      padding: {
        top: 40,
        bottom: 40,
        left: shouldAddExtraLeftPadding ? 540 : 40,
        right: 40,
      },
    });
  }, [mapRef, bounds, shouldAddExtraLeftPadding]);
};

export default useBounds;
