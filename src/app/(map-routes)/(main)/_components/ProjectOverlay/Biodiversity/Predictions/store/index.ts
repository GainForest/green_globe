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
        const projectId = useProjectOverlayStore.getState().projectId;
        if (!projectId) {
          set({ dataStatus: "loading", data: null });
          return;
        }
        // Do not fetch data if the projectId is the same and the data is already loaded
        if (projectId === get().projectId && get().dataStatus === "success") {
          return;
        } else {
          set({ projectId, dataStatus: "loading", data: null });
        }
        // @TODO: get the project name
        const name = "Oceanus Conservation";
        const treesData = fetchPlantsData(name, "Trees");
        const herbsData = fetchPlantsData(name, "Herbs");
        const animalsData = fetchAnimalsData(name);
        const allData = await Promise.all([treesData, herbsData, animalsData]);
        if (get().projectId !== projectId) {
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
