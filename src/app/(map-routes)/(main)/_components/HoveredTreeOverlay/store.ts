import { create } from "zustand";

export type HoveredTreeOverlayState = {
  treeInformation: {
    treeSpecies?: string;
    treeCommonName?: string;
    treeHeight: string;
    treeDBH: string;
    treePhotos: string[];
    dateOfMeasurement: string;
  } | null;
  isExpanded: boolean;
};

export type HoveredTreeOverlayActions = {
  setTreeInformation: (
    treeInformation: HoveredTreeOverlayState["treeInformation"]
  ) => void;
  setIsExpanded: (isExpanded: HoveredTreeOverlayState["isExpanded"]) => void;
};

const initialState: HoveredTreeOverlayState = {
  treeInformation: null,
  isExpanded: false,
};

const useHoveredTreeOverlayStore = create<
  HoveredTreeOverlayState & HoveredTreeOverlayActions
>((set) => {
  return {
    ...initialState,
    setTreeInformation: (treeInformation) => {
      set({ treeInformation });
    },
    setIsExpanded: (isExpanded) => {
      set({ isExpanded });
    },
  };
});

export default useHoveredTreeOverlayStore;
