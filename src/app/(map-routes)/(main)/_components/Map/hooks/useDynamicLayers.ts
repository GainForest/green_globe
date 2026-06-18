import useLayersOverlayStore from "../../LayersOverlay/store";
import { DynamicLayer } from "../../LayersOverlay/store/types";
import useMapStore from "../store";
import { useEffect, useMemo } from "react";
import addNamedSource, {
  removeNamedSource,
} from "../sources-and-layers/dynamic-layers";

const useDynamicLayers = () => {
  const mapRef = useMapStore((state) => state.mapRef);
  const mapLoaded = useMapStore((state) => state.mapLoaded);
  const categorizedDynamicLayers = useLayersOverlayStore(
    (state) => state.categorizedDynamicLayers,
  );
  const projectSpecificLayers = useLayersOverlayStore(
    (state) => state.projectSpecificLayers,
  );

  const flatMapLayers = useMemo(() => {
    let arr: DynamicLayer[] = [];
    categorizedDynamicLayers.forEach((category) => {
      const layers = category[Object.keys(category)[0]];
      arr = [...arr, ...structuredClone(layers)];
    });
    arr = [...arr, ...structuredClone(projectSpecificLayers.layers ?? [])];
    return arr;
  }, [categorizedDynamicLayers, projectSpecificLayers]);

  useEffect(() => {
    const globe = mapRef?.current;
    if (!mapLoaded || !globe) return;

    const controller = new AbortController();

    const syncDynamicLayers = async () => {
      for (const layer of flatMapLayers) {
        if (controller.signal.aborted) {
          return;
        }

        try {
          if (layer.visible) {
            await addNamedSource(globe, layer, controller.signal);
          } else {
            removeNamedSource(globe, layer);
          }
        } catch (error) {
          if (!controller.signal.aborted) {
            console.error(`Error syncing dynamic layer ${layer.name}`, error);
          }
        }
      }
    };

    void syncDynamicLayers();

    return () => {
      controller.abort();
    };
  }, [mapLoaded, mapRef, flatMapLayers]);
};

export default useDynamicLayers;
