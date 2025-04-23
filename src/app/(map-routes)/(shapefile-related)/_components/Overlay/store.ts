import { create } from "zustand";

export type ControlsConfigCatalog = {
  view: {
    mode: "view";
    source: {
      type: "url";
      value: string;
      dataFormat: "geojson";
    };
  };
  draw: {
    mode: "draw";
  };
};

export type ControlsConfig = ControlsConfigCatalog[keyof ControlsConfigCatalog];

export type MapControls = {
  showProjectMarkers: boolean;
};

export type OverlayStoreState = {
  visibility: boolean;
  controlsConfig: ControlsConfig;
  mapControls: MapControls;
};

export type OverlayStoreActions = {
  setVisibility: (visibility: boolean) => void;
  setControlsConfig: (controlsConfig: Partial<ControlsConfig>) => void;
  setMapControls: (mapControls: Partial<MapControls>) => void;
};

const useOverlayStore = create<OverlayStoreState & OverlayStoreActions>(
  (set, get) => ({
    visibility: false,
    controlsConfig: {
      mode: "view",
      source: {
        type: "url",
        value: "",
        dataFormat: "geojson",
      },
    },
    mapControls: {
      showProjectMarkers: true,
    },
    setVisibility: (visibility) => set({ visibility }),
    setControlsConfig: (controlsConfig) => {
      const tempState = structuredClone(get().controlsConfig);
      Object.entries(controlsConfig).forEach(([key, value]) => {
        tempState[key as keyof ControlsConfig] = value;
      });
      set({ controlsConfig: tempState });
    },
    setMapControls: (mapControls) => {
      const tempState = structuredClone(get().mapControls);
      Object.entries(mapControls).forEach(([key, value]) => {
        tempState[key as keyof MapControls] = value;
      });
      set({ mapControls: tempState });
    },
  })
);

export default useOverlayStore;
