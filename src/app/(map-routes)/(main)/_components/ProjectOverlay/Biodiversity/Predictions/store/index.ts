import { create } from "zustand";
import useProjectOverlayStore from "../../../store";
import { fetchPlantsData, fetchAnimalsData } from "./utils";
import { BiodiversityAnimal, BiodiversityPlant } from "./types";

type BiodiversityPredictionsData = {
  treesData: BiodiversityPlant[];
  herbsData: BiodiversityPlant[];
  animalsData: BiodiversityAnimal[];
};

type BiodiversityPredictionsDataStateCatalog = {
  loading: {
    dataStatus: "loading";
    data: null;
  };
  success: {
    dataStatus: "success";
    data: BiodiversityPredictionsData;
  };
  error: {
    dataStatus: "error";
    data: null;
  };
};

type BiodiversityPredictionsDataState =
  BiodiversityPredictionsDataStateCatalog[keyof BiodiversityPredictionsDataStateCatalog];

export type BiodiversityPredictionsState = {
  projectId: string | null;
  page: "plants" | "animals" | null;
} & BiodiversityPredictionsDataState;

export type BiodiversityPredictionsActions = {
  fetchData: () => void;
  setPage: (page: "plants" | "animals" | null) => void;
};

const initialState: BiodiversityPredictionsState = {
  projectId: null,
  page: null,
  dataStatus: "loading",
  data: null,
};

const useBiodiversityPredictionsStore = create<
  BiodiversityPredictionsState & BiodiversityPredictionsActions
>((set, get) => {
  return {
    ...initialState,
    fetchData: async () => {
      try {
        const projectData = useProjectOverlayStore.getState().projectData;
        if (!projectData) {
          set({ dataStatus: "loading", data: null });
          return;
        }
        // Do not fetch data if the projectId is the same and the data is already loaded
        if (
          projectData.id === get().projectId &&
          get().dataStatus === "success"
        ) {
          return;
        } else {
          set({ projectId: projectData.id, dataStatus: "loading", data: null });
        }
        const treesData = fetchPlantsData(projectData.name, "Trees");
        const herbsData = fetchPlantsData(projectData.name, "Herbs");
        const animalsData = fetchAnimalsData(projectData.name);
        const allData = await Promise.all([treesData, herbsData, animalsData]);
        if (get().projectId !== projectData.id) {
          return;
        }
        set({
          dataStatus: "success",
          data: {
            treesData: allData[0]?.items ?? [],
            herbsData: allData[1]?.items ?? [],
            animalsData: allData[2] ?? [],
          },
        });
      } catch (error) {
        console.error(error);
        set({ dataStatus: "error", data: null });
      }
    },
    setPage: (page) => {
      set({ page });
    },
  };
});

export default useBiodiversityPredictionsStore;
