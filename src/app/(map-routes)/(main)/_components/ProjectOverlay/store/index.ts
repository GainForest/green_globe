import { create } from "zustand";
import useNavigation from "@/app/(map-routes)/(main)/_features/navigation/use-navigation";

export const PROJECT_OVERLAY_TABS = [
  "info",
  "ask-ai",
  "biodiversity",
  "media",
  "remote-sensing-analysis",
  "community",
  "logbook",
  "edit",
] as const;

export type ProjectOverlayState = {
  projectId: string | null;
  activeSiteAtUri: string | null;
  activeTab: (typeof PROJECT_OVERLAY_TABS)[number];
  isMaximized: boolean;
};

export type ProjectOverlayActions = {
  setProjectId: (
    projectId: ProjectOverlayState["projectId"],
    navigate?: ReturnType<typeof useNavigation>,
    zoomToSite?: boolean
  ) => void;
  setActiveSiteAtUri: (
    siteAtUri: string | null,
    navigate?: ReturnType<typeof useNavigation>
  ) => void;
  setActiveTab: (
    tab: ProjectOverlayState["activeTab"],
    navigate?: ReturnType<typeof useNavigation>
  ) => void;
  resetState: () => void;
  setIsMaximized: (isMaximized: ProjectOverlayState["isMaximized"]) => void;
};

const initialState: ProjectOverlayState = {
  projectId: null,
  activeSiteAtUri: null,
  activeTab: "info",
  isMaximized: false,
};

const useProjectOverlayStore = create<
  ProjectOverlayState & ProjectOverlayActions
>((set, get) => {
  return {
    ...initialState,
    setProjectId: (projectId, navigate) => {
      // Reset state if no id provided
      if (!projectId) {
        get().resetState();
        navigate?.({
          project: null,
        });
        return;
      }

      // Set project id and active site id
      set({
        projectId,
        activeSiteAtUri: null,
      });
      navigate?.({
        project: {
          "project-id": projectId,
          "site-id": null,
          views: ["info"],
        },
      });

      // Then fetch trees data (asynchronous operation)
      // @TEMP-FIX
      // try {
      //   let data: MeasuredTreesGeoJSON | null = null;
      //   if (
      //     projectId ===
      //     "49bbaba0d8980989ce9b3988a45c375a42206239d6bc930c2357035e670838e0"
      //   ) {
      //     const gfTreeFeatures = (await fetchMeasuredTreesShapefile(
      //       projectData.name
      //     )) as unknown as {
      //       type: "FeatureCollection";
      //       features: GFTreeFeature[];
      //     };
      //     data = {
      //       type: "FeatureCollection",
      //       features: gfTreeFeatures.features.map(
      //         convertFromGFTreeFeatureToNormalizedTreeFeature
      //       ),
      //     };
      //   } else {
      //     data = await fetchMeasuredTreesShapefile(projectData.name);
      //   }
      //   if (!isProjectStillActive(projectId)) return;
      //   set({
      //     treesAsync: {
      //       _status: "success",
      //       data,
      //     },
      //   });
      // } catch (error) {
      //   console.error("Error fetching measured trees shapefile", error);
      //   if (!isProjectStillActive(projectId)) return;
      //   set({
      //     treesAsync: {
      //       _status: "error",
      //       data: null,
      //     },
      //   });
      // }
    },
    setActiveSiteAtUri: (siteAtUri, navigate) => {
      const projectId = get().projectId;
      if (!projectId) return;
      set({ activeSiteAtUri: siteAtUri });
      navigate?.((draft) => {
        const project = draft.project;
        if (!project) {
          draft.project = {
            "project-id": projectId,
            "site-id": siteAtUri,
            views: [],
          };
        } else {
          project["site-id"] = siteAtUri;
        }
      });
    },
    setActiveTab: (tab, navigate) => {
      set({ activeTab: tab });
      navigate?.((draft) => {
        const project = draft.project;
        if (!project) return;
        project.views = [tab];
      });
    },
    setIsMaximized: (isMaximized) => {
      set({ isMaximized });
    },
    resetState: () => set(initialState),
  };
});

export default useProjectOverlayStore;
