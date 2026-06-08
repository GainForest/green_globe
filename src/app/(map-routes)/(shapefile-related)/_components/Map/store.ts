import { AsyncData } from "@/lib/types";
import type { GlobeController } from "@/app/(map-routes)/_utils/GlobeController";
import { create } from "zustand";
import { Feature, FeatureCollection, MultiPolygon } from "geojson";

export type SupportedGeoJSON = FeatureCollection | Feature<MultiPolygon>;

export type MapStoreState = {
  map: GlobeController | null;
  mapLoaded: boolean;
  asyncShapeData: AsyncData<SupportedGeoJSON>;
};

export type MapStoreActions = {
  setMap: (map: GlobeController | null) => void;
  setMapLoaded: (mapLoaded: boolean) => void;
  setAsyncShapeData: (asyncShapeData: AsyncData<SupportedGeoJSON>) => void;
};

const useMapStore = create<MapStoreState & MapStoreActions>((set) => ({
  map: null,
  mapLoaded: false,
  asyncShapeData: {
    _status: "loading",
    data: null,
    error: null,
  },
  setMap: (map) => set({ map }),
  setMapLoaded: (mapLoaded) => set({ mapLoaded }),
  setAsyncShapeData: (asyncShapeData) => set({ asyncShapeData }),
}));

export default useMapStore;
