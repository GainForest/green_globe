import { create } from "zustand";

export type PreviewState = {
  embedMode: boolean;
  treeUri: string | null;
  datasetRef: string | null;
};

type PreviewActions = {
  setPreviewState: (state: PreviewState) => void;
};

const initialState: PreviewState = {
  embedMode: false,
  treeUri: null,
  datasetRef: null,
};

const usePreviewStore = create<PreviewState & PreviewActions>((set) => ({
  ...initialState,
  setPreviewState: (state) => {
    set(state);
  },
}));

export default usePreviewStore;
