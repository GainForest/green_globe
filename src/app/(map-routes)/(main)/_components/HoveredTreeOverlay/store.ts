import { create } from "zustand";

export type TreeInformation = {
  treeUri?: string;
  treeSpecies?: string;
  treeCommonName?: string;
  treeHeight: string;
  treeDBH: string;
  treePhotos: string[];
  dateOfMeasurement: string;
};

export type HoveredTreeOverlayState = {
  treeInformation: TreeInformation | null;
  selectedTreeInformation: TreeInformation | null;
  isExpanded: boolean;
};

export type HoveredTreeOverlayActions = {
  setTreeInformation: (
    treeInformation: HoveredTreeOverlayState["treeInformation"]
  ) => void;
  setSelectedTreeInformation: (
    treeInformation: HoveredTreeOverlayState["treeInformation"]
  ) => void;
  clearSelectedTreeInformation: () => void;
  setIsExpanded: (isExpanded: HoveredTreeOverlayState["isExpanded"]) => void;
};

const initialState: HoveredTreeOverlayState = {
  treeInformation: null,
  selectedTreeInformation: null,
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
    setSelectedTreeInformation: (treeInformation) => {
      set({ selectedTreeInformation: treeInformation, treeInformation });
    },
    clearSelectedTreeInformation: () => {
      set({ selectedTreeInformation: null, treeInformation: null, isExpanded: false });
    },
    setIsExpanded: (isExpanded) => {
      set({ isExpanded });
    },
  };
});

export default useHoveredTreeOverlayStore;
