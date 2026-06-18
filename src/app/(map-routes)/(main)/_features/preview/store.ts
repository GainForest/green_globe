import { create } from "zustand";

export type PreviewMode = "all" | "only" | "none";

export type PreviewState = {
  embedMode: boolean;
  treeUri: string | null;
  datasetRefs: string[];
  focusedDatasetRef: string | null;
  focusedSiteRef: string | null;
  previewMode: PreviewMode;
};

type PreviewActions = {
  setPreviewState: (state: PreviewState) => void;
};

const initialState: PreviewState = {
  embedMode: false,
  treeUri: null,
  datasetRefs: [],
  focusedDatasetRef: null,
  focusedSiteRef: null,
  previewMode: "all",
};

const usePreviewStore = create<PreviewState & PreviewActions>((set) => ({
  ...initialState,
  setPreviewState: (state) => {
    set(state);
  },
}));

export default usePreviewStore;
