import { create } from "zustand";
import dayjs from "dayjs";
import { fetchLayers, fetchProjectSpecificLayers } from "./utils";
import { DynamicLayer } from "./types";
import { groupBy } from "@/lib/utils";
import useProjectOverlayStore from "../../ProjectOverlay/store";
import useNavigation from "@/app/(map-routes)/(main)/_features/navigation/use-navigation";
export type LayersOverlayState = {
  toggledOnLayerIds: Set<string>;
  staticLayersVisibility: {
    historicalSatellite: boolean;
    landcover: boolean;
  };
  categorizedDynamicLayers: Record<string, DynamicLayer[]>[];
  projectSpecificLayers: {
    projectId: string | null;
    status: "loading" | "success";
    layers: DynamicLayer[] | null;
  };
  historicalSatelliteState: {
    minDate: dayjs.Dayjs;
    maxDate: dayjs.Dayjs;
    previousDate: dayjs.Dayjs | null;
    formattedPreviousDate: string | null;
    currentDate: dayjs.Dayjs;
    formattedCurrentDate: string;
  };
};

export type LayersOverlayActions = {
  setToggledOnLayerIds: (
    layers: string[],
    navigate?: ReturnType<typeof useNavigation>
  ) => void;
  setHistoricalSatelliteDate: (
    date: dayjs.Dayjs,
    navigate?: ReturnType<typeof useNavigation>
  ) => void;
  setStaticLayerVisibility: (
    layerView: keyof LayersOverlayState["staticLayersVisibility"],
    value: boolean,
    navigate?: ReturnType<typeof useNavigation>
  ) => void;
  fetchCategorizedDynamicLayers: () => Promise<void>;
  fetchProjectSpecificLayers: () => Promise<void>;
};

const initialState: LayersOverlayState = {
  toggledOnLayerIds: new Set<string>(),
  staticLayersVisibility: {
    historicalSatellite: false,
    landcover: false,
  },
  categorizedDynamicLayers: [],
  projectSpecificLayers: {
    projectId: null,
    status: "loading",
    layers: null,
  },
  historicalSatelliteState: {
    minDate: dayjs("2020-09-01"),
    maxDate: dayjs().subtract(6, "week").set("date", 1),
    previousDate: null,
    formattedPreviousDate: null,
    currentDate: dayjs().subtract(6, "week").set("date", 1),
    formattedCurrentDate: dayjs()
      .subtract(6, "week")
      .set("date", 1)
      .format("YYYY-MM"),
  },
};

const useLayersOverlayStore = create<LayersOverlayState & LayersOverlayActions>(
  (set, get) => {
    return {
      ...initialState,

      setToggledOnLayerIds: (layers, navigate) => {
        const layersSet = new Set(layers);
        set((state) => {
          // Update the categorized dynamic layers
          const categorizedDynamicLayers = state.categorizedDynamicLayers.map(
            (categoryObj) => {
              const categoryKey = Object.keys(categoryObj)[0];
              const categoryLayers = categoryObj[categoryKey];
              const newCategoryLayers = categoryLayers.map((layer) => ({
                ...layer,
                visible: layersSet.has(layer.name),
              }));
              return {
                [categoryKey]: newCategoryLayers,
              };
            }
          );
          // Update the project specific layers
          const projectSpecificLayers = state.projectSpecificLayers.layers?.map(
            (layer) => ({ ...layer, visible: layersSet.has(layer.name) })
          );
          return {
            categorizedDynamicLayers,
            projectSpecificLayers: {
              ...state.projectSpecificLayers,
              layers: projectSpecificLayers ?? null,
            },
            toggledOnLayerIds: new Set(layers),
          };
        });

        navigate?.((draft) => {
          draft.layers["enabled-layers"] = [...layers];
        });
      },
      setStaticLayerVisibility: (layerName, value, navigate) => {
        if (layerName === "landcover") {
          navigate?.((draft) => {
            draft.layers["landcover"] = value;
          });
        } else if (layerName === "historicalSatellite") {
          navigate?.((draft) => {
            draft.layers["historical-satellite"] = value
              ? {
                  date: get().historicalSatelliteState.formattedCurrentDate,
                }
              : null;
          });
        }
        set((state) => ({
          staticLayersVisibility: {
            ...state.staticLayersVisibility,
            [layerName]: value,
          },
        }));
      },
      fetchProjectSpecificLayers: async () => {
        const projectData = useProjectOverlayStore.getState().projectData;
        if (!projectData) {
          set({
            projectSpecificLayers: {
              projectId: null,
              status: "success",
              layers: null,
            },
          });
          return;
        }
        if (projectData.id === get().projectSpecificLayers.projectId) {
          return;
        }
        set({
          projectSpecificLayers: {
            projectId: projectData.id,
            status: "loading",
            layers: null,
          },
        });
        const layers = await fetchProjectSpecificLayers(projectData.name);
        set({
          projectSpecificLayers: {
            projectId: projectData.id,
            status: "success",
            layers: (layers ?? []).map((layer) => ({
              ...layer,
              visible: get().toggledOnLayerIds.has(layer.name),
            })),
          },
        });
      },
      fetchCategorizedDynamicLayers: async () => {
        const layers = await fetchLayers();
        const dynamicLayers = layers.map((layer) => ({
          ...layer,
          visible: get().toggledOnLayerIds.has(layer.name),
        }));
        const categorizedDynamicLayers = groupBy(dynamicLayers, "category");
        set({ categorizedDynamicLayers });
      },
      setHistoricalSatelliteDate: (date, navigate) => {
        navigate?.((draft) => {
          draft.layers["historical-satellite"] = {
            date: date.format("YYYY-MM"),
          };
        });
        set((state) => ({
          historicalSatelliteState: {
            ...state.historicalSatelliteState,
            previousDate: state.historicalSatelliteState.currentDate,
            formattedPreviousDate:
              state.historicalSatelliteState.formattedCurrentDate,
            currentDate: date,
            formattedCurrentDate: date.format("YYYY-MM"),
          },
        }));
      },
    };
  }
);

export default useLayersOverlayStore;
