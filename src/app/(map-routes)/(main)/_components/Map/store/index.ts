import { create } from "zustand";
import { Map } from "mapbox-gl";
import { ProjectPolygonAPIResponse } from "../../ProjectOverlay/store/types";
export type MapState = {
  currentView: "project";
  mapBounds: [number, number, number, number] | null;
  mapRef: React.RefObject<Map | null> | null;
  mapLoaded: boolean;
  highlightedPolygon: ProjectPolygonAPIResponse | null;
};

export type MapActions = {
  getMapBounds: () => [number, number, number, number] | null;
  setMapBounds: (bounds: [number, number, number, number] | null) => void;
  setCurrentView: (currentView: "project") => void;
  setMapRef: (mapRef: React.RefObject<Map | null>) => void;
  setMapLoaded: (mapLoaded: boolean) => void;
  setHighlightedPolygon: (polygon: ProjectPolygonAPIResponse | null) => void;
};

const initialState: MapState = {
  currentView: "project",
  highlightedPolygon: null,
  mapBounds: null,
  mapRef: null,
  mapLoaded: false,
};

const useMapStore = create<MapState & MapActions>((set, get) => {
  return {
    ...initialState,
    getMapBounds: () => {
      const map = get().mapRef?.current;
      if (!map) return null;
      const bounds = map.getBounds();
      if (!bounds) return null;
      return [
        bounds.getNorthEast().lng,
        bounds.getNorthEast().lat,
        bounds.getSouthWest().lng,
        bounds.getSouthWest().lat,
      ];
    },
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
  };
});

export default useMapStore;
