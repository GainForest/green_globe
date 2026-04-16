import { useEffect } from "react";
import useMapStore from "../store";
import useProjectOverlayStore from "../../ProjectOverlay/store";

const useTreesLoadingOverlay = () => {
  const mapRef = useMapStore((s) => s.mapRef);
  const mapLoaded = useMapStore((s) => s.mapLoaded);
  const treesAsync = useProjectOverlayStore((s) => s.treesAsync);
  const projectId = useProjectOverlayStore((s) => s.projectId);

  const isLoading =
    projectId !== undefined &&
    (!treesAsync || treesAsync._status === "loading");

  useEffect(() => {
    const map = mapRef?.current;
    if (!mapLoaded || !map || !map.getLayer("treesLoadingFill")) return;

    if (!isLoading) {
      map.setLayoutProperty("treesLoadingFill", "visibility", "none");
      return;
    }

    map.setLayoutProperty("treesLoadingFill", "visibility", "visible");

    let rafId: number;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const t = (timestamp - startTime) / 1200;
      const opacity = 0.105 + 0.075 * Math.sin(t * Math.PI * 2);
      mapRef?.current?.setPaintProperty(
        "treesLoadingFill",
        "fill-opacity",
        opacity
      );
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      mapRef?.current?.setLayoutProperty("treesLoadingFill", "visibility", "none");
    };
  }, [isLoading, mapLoaded, mapRef]);
};

export default useTreesLoadingOverlay;
