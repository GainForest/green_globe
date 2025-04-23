import { useEffect } from "react";
import useMapStore from "../store";
import useSidebarStore from "../../Overlay/store";

/**
 * When the active project polygon changes, fit the map to the polygon and update the highlighted site source
 * @param mapRef - The ref to the map
 */
const useBounds = () => {
  const bounds = useMapStore((state) => state.mapBounds);
  const mapRef = useMapStore((state) => state.mapRef);

  const isSidebarOpen = useSidebarStore((state) => state.isOpen);

  useEffect(() => {
    const map = mapRef?.current;
    if (!map || !bounds) return;

    map.fitBounds(bounds, {
      padding: {
        top: 40,
        bottom: 40,
        left: isSidebarOpen ? 540 : 40,
        right: 40,
      },
    });
    // (map.getSource("highlightedSite") as GeoJSONSource | undefined)?.setData(
    //   projectPolygon
    // );
  }, [mapRef, bounds, isSidebarOpen]);
};

export default useBounds;
