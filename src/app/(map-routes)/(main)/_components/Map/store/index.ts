import { create } from "zustand";
import type { GlobeController } from "@/app/(map-routes)/_utils/GlobeController";
import type { GlobeBounds } from "@/app/(map-routes)/_utils/globe-data";
import { ProjectPolygonAPIResponse } from "../../ProjectOverlay/store/types";

export type MapState = {
  currentView: "project";
  mapBounds: GlobeBounds | null;
  mapRef: React.RefObject<GlobeController | null> | null;
  mapLoaded: boolean;
  highlightedPolygon: ProjectPolygonAPIResponse | null;
  treeOverlayReady: boolean;
};

export type MapActions = {
  getMapBounds: () => GlobeBounds | null;
  setMapBounds: (bounds: GlobeBounds | null) => void;
  setCurrentView: (currentView: "project") => void;
  setMapRef: (mapRef: React.RefObject<GlobeController | null> | null) => void;
  setMapLoaded: (mapLoaded: boolean) => void;
  setHighlightedPolygon: (polygon: ProjectPolygonAPIResponse | null) => void;
  setTreeOverlayReady: (ready: boolean) => void;
};

const initialState: MapState = {
  currentView: "project",
  highlightedPolygon: null,
  mapBounds: null,
  mapRef: null,
  mapLoaded: false,
  treeOverlayReady: false,
};

const useMapStore = create<MapState & MapActions>((set, get) => {
  return {
    ...initialState,
    getMapBounds: () => get().mapRef?.current?.getApproxBounds() ?? null,
    setMapBounds: (bounds) => {
      set({ mapBounds: bounds });
    },
    setCurrentView: (currentView) => {
      set({ currentView });
    },
    setMapRef: (mapRef) => {
      set({ mapRef });
    },
    setMapLoaded: (mapLoaded) => {
      set({ mapLoaded });
    },
    setHighlightedPolygon: (highlightedPolygon) => {
      set({ highlightedPolygon });
    },
    setTreeOverlayReady: (treeOverlayReady) => {
      set({ treeOverlayReady });
    },
  };
});

export default useMapStore;
