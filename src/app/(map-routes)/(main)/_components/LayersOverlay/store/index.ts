import { create } from "zustand";
import { fetchLayers, fetchProjectSpecificLayers } from "./utils";
import type { DynamicLayer } from "./types";
import { groupBy } from "@/lib/utils";
import useProjectOverlayStore from "../../ProjectOverlay/store";
import useNavigation from "@/app/(map-routes)/(main)/_features/navigation/use-navigation";

export type LayersOverlayState = {
  toggledOnLayerIds: Set<string>;
  staticLayersVisibility: {
    landcover: boolean;
  };
  categorizedDynamicLayers: Record<string, DynamicLayer[]>[];
  projectSpecificLayers: {
    projectId: string | null;
    status: "loading" | "success";
    layers: DynamicLayer[] | null;
  };
};

export type LayersOverlayActions = {
  setToggledOnLayerIds: (
    layers: string[],
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
    landcover: false,
  },
  categorizedDynamicLayers: [],
  projectSpecificLayers: {
    projectId: null,
    status: "loading",
    layers: null,
  },
};

const useLayersOverlayStore = create<LayersOverlayState & LayersOverlayActions>(
  (set, get) => {
    return {
      ...initialState,

      setToggledOnLayerIds: (layers, navigate) => {
        // Bail out when the toggled set hasn't actually changed.
        // useStoreUrlSync calls this on every URL change; without this guard
        // the .map() calls below create new object references every time,
        // causing cascading re-renders across all layers-store subscribers.
        const current = get().toggledOnLayerIds;
        if (
          layers.length === current.size &&
          layers.every((l) => current.has(l))
        ) {
          return;
        }

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
        }
        set((state) => ({
          staticLayersVisibility: {
            ...state.staticLayersVisibility,
            [layerName]: value,
          },
        }));
      },
      fetchProjectSpecificLayers: async () => {
        const overlayState = useProjectOverlayStore.getState();
        const { projectId: did, projectSlug } = overlayState;
        if (!did || !projectSlug) {
          set({
            projectSpecificLayers: {
              projectId: null,
              status: "success",
              layers: null,
            },
          });
          return;
        }
        if (did === get().projectSpecificLayers.projectId) {
          return;
        }
        const currentLayers = get().projectSpecificLayers.layers;
        set({
          projectSpecificLayers: {
            projectId: did,
            status: "loading",
            layers: currentLayers?.map((l) => ({ ...l, visible: false })) ?? null,
          },
        });
        // Try ATProto first (by DID); fall back to S3 (by slug) when no records exist
        const layers = await fetchProjectSpecificLayers(did, projectSlug);
        set({
          projectSpecificLayers: {
            projectId: did,
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
    };
  }
);

export default useLayersOverlayStore;
