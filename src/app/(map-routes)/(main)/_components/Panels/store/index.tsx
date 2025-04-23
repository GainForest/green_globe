import { create } from "zustand";
import EcocertAttestationCreation from "../EcocertAttestationCreation";

export const panelIdToComponent = {
  "attestation-creation": EcocertAttestationCreation,
};

export type PanelId = keyof typeof panelIdToComponent;

export type PanelsStoreState = {
  panelId: PanelId | null;
  backButtonText: string | null;
  panelStack: PanelId[];
};

export type PanelsStoreActions = {
  setPanelId: (panelId: PanelId | null) => void;
  setBackButtonText: (backButtonText: string | null) => void;
  onBackButtonClick: (preventDefault?: boolean, callback?: () => void) => void;
};

const usePanelsStore = create<PanelsStoreState & PanelsStoreActions>(
  (set, get) => ({
    panelId: null,
    backButtonText: null,
    panelStack: [],
    setPanelId: (panelId) => {
      set((state) => ({
        panelId,
        panelStack: panelId ? [...state.panelStack, panelId] : [],
        backButtonText: null,
      }));
    },
    setBackButtonText: (backButtonText) => {
      set({ backButtonText });
    },
    onBackButtonClick: (preventDefault = false, callback) => {
      if (!preventDefault) {
        const panelStack = get().panelStack;
        if (panelStack.length !== 0) panelStack.pop();
        const panelId = panelStack.at(-1) ?? null;
        set({
          panelId: panelId,
          panelStack: [...panelStack],
          backButtonText: null,
        });
      }
      callback?.();
    },
  })
);

export default usePanelsStore;
