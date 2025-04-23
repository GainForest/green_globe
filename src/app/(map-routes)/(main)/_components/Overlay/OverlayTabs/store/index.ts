import useNavigation from "@/app/(map-routes)/(main)/_features/navigation/use-navigation";
import { create } from "zustand";

export const OVERLAY_TABS = ["project", "layers", "search"] as const;
export const OVERLAY_DISPLAY_STATES = [
  "hidden",
  "normal",
  "maximized",
] as const;

export type OverlayTabsState = {
  activeTab: (typeof OVERLAY_TABS)[number];
  display: (typeof OVERLAY_DISPLAY_STATES)[number];
};

export type OverlayTabsActions = {
  setActiveTab: (
    activeTab: OverlayTabsState["activeTab"],
    navigate?: ReturnType<typeof useNavigation>
  ) => void;
  setDisplay: (
    display: OverlayTabsState["display"],
    navigate?: ReturnType<typeof useNavigation>
  ) => void;
};

const useOverlayTabsStore = create<OverlayTabsState & OverlayTabsActions>(
  (set) => ({
    activeTab: "search",
    display: "normal",
    setActiveTab: (activeTab, navigate) => {
      set({ activeTab });
      navigate?.((draft) => {
        draft.overlay["active-tab"] = activeTab;
      });
    },
    setDisplay: (display, navigate) => {
      set({ display });
      navigate?.((draft) => {
        draft.overlay["display"] = display;
      });
    },
  })
);

export default useOverlayTabsStore;
