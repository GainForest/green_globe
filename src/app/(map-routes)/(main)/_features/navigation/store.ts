import { create } from "zustand";
import { produce, Draft } from "immer";
import { OverlayTabsState } from "../../_components/Overlay/OverlayTabs/store";

export type OverlayNavigationState = {
  "active-tab": OverlayTabsState["activeTab"];
  display: OverlayTabsState["display"];
};

export type ProjectNavigationState = {
  "project-id": string;
  "site-id": string | null;
  views: string[];
};

export type LayersNavigationState = {
  "historical-satellite": {
    date: string;
  } | null;
  landcover: boolean;
  "enabled-layers": string[];
};

export type SearchNavigationState = {
  q: string | null;
};

export type MapNavigationState = {
  bounds: [number, number, number, number] | null;
};

export type NavigationState = {
  overlay: OverlayNavigationState;
  project: ProjectNavigationState | null;
  layers: LayersNavigationState;
  search: SearchNavigationState;
  map: MapNavigationState;
};

export type NavigationActions = {
  updateNavigationState: (
    state: Partial<NavigationState> | ((draft: Draft<NavigationState>) => void)
  ) => void;
};

export const DEFAULT_NAVIGATION_STATE: NavigationState = {
  overlay: {
    "active-tab": "search",
    display: "hidden",
  },
  project: null,
  layers: {
    "historical-satellite": null,
    landcover: false,
    "enabled-layers": [],
  },
  search: {
    q: null,
  },
  map: {
    bounds: null,
  },
};

const useNavigationStore = create<NavigationState & NavigationActions>(
  (set) => ({
    ...DEFAULT_NAVIGATION_STATE,
    updateNavigationState: (state) => {
      set((current) => {
        let newState;
        if (typeof state === "function") {
          newState = produce(current, state);
        } else {
          newState = produce(current, (draft: Draft<NavigationState>) => {
            Object.assign(draft, state);
          });
        }
        return newState;
      });
    },
  })
);

export default useNavigationStore;
