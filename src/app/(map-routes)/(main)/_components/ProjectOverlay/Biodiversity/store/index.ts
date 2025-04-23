import useNavigation from "@/app/(map-routes)/(main)/_features/navigation/use-navigation";
import { create } from "zustand";

export type BiodiversityState = {
  activeTab: "predictions" | "observations";
};

export type BiodiversityActions = {
  setActiveTab: (
    tab: "predictions" | "observations",
    navigate?: ReturnType<typeof useNavigation>
  ) => void;
};

const initialState: BiodiversityState = {
  activeTab: "predictions",
};

const useBiodiversityStore = create<BiodiversityState & BiodiversityActions>(
  (set) => ({
    ...initialState,
    setActiveTab: (tab, navigate) => {
      set({ activeTab: tab });
      navigate?.((draft) => {
        const project = draft.project;
        if (!project) return;
        project.views = ["biodiversity", tab];
      });
    },
  })
);
export default useBiodiversityStore;
