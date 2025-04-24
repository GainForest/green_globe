import { create } from "zustand";

export type OverlayState = {
  isOpen: boolean;
  size: "desktop" | "smaller";
};

export type OverlayActions = {
  setIsOpen: (isOpen: boolean) => void;
  setSize: (size: "desktop" | "smaller") => void;
};

type OverlayStore = OverlayState & OverlayActions;

const useOverlayStore = create<OverlayStore>((set) => ({
  isOpen: true,
  size: "smaller",
  setIsOpen: (isOpen: boolean) => set({ isOpen }),
  setSize: (size: "desktop" | "smaller") => set({ size }),
}));

export default useOverlayStore;
