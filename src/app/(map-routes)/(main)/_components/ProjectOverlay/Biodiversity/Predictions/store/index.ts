import { create } from "zustand";
import useProjectOverlayStore from "../../../store";
import {
  fetchPlantsData,
  fetchAnimalsData,
  fetchPlantsFromATProto,
  fetchAnimalsFromATProto,
} from "./utils";
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
        const overlayState = useProjectOverlayStore.getState();
        const { projectId: did, projectSlug } = overlayState;
        if (!did || !projectSlug) {
          set({ dataStatus: "loading", data: null });
          return;
        }
        // Do not fetch data if the projectId (DID) is the same and data is already loaded
        if (did === get().projectId && get().dataStatus === "success") {
          return;
        } else {
          set({ projectId: did, dataStatus: "loading", data: null });
        }

        // ── Fetch plants: ATProto first, fall back to S3 ──────────────────────
        const [atprotoPlants, atprotoAnimals] = await Promise.all([
          fetchPlantsFromATProto(did),
          fetchAnimalsFromATProto(did),
        ]);

        if (get().projectId !== did) {
          return;
        }

        // Plants: use ATProto if it returned any records, otherwise fall back to S3
        let treesData: BiodiversityPlant[];
        let herbsData: BiodiversityPlant[];

        const atprotoHasPlants =
          atprotoPlants !== null &&
          (atprotoPlants.trees.length > 0 || atprotoPlants.herbs.length > 0);

        if (atprotoHasPlants && atprotoPlants !== null) {
          treesData = atprotoPlants.trees;
          herbsData = atprotoPlants.herbs;
        } else {
          // S3 fallback for plants
          const [s3Trees, s3Herbs] = await Promise.all([
            fetchPlantsData(projectSlug, "Trees"),
            fetchPlantsData(projectSlug, "Herbs"),
          ]);
          if (get().projectId !== did) {
            return;
          }
          treesData = s3Trees?.items ?? [];
          herbsData = s3Herbs?.items ?? [];
        }

        // Animals: use ATProto if it returned any records, otherwise fall back to S3
        let animalsData: BiodiversityAnimal[];

        const atprotoHasAnimals =
          atprotoAnimals !== null && atprotoAnimals.length > 0;

        if (atprotoHasAnimals && atprotoAnimals !== null) {
          animalsData = atprotoAnimals;
        } else {
          // S3 fallback for animals
          const s3Animals = await fetchAnimalsData(projectSlug);
          if (get().projectId !== did) {
            return;
          }
          animalsData = s3Animals ?? [];
        }

        set({
          dataStatus: "success",
          data: {
            treesData,
            herbsData,
            animalsData,
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
