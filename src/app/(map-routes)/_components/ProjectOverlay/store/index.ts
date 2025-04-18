import { create } from "zustand";
import { Project, SiteAsset } from "./types";
import {
  fetchMeasuredTreesShapefile,
  fetchProjectData,
  fetchProjectPolygon,
} from "./utils";
import useMapStore from "../../Map/store";
import bbox from "@turf/bbox";
import { MeasuredTreesGeoJSON } from "./types";
import { AsyncData } from "@/lib/types";
import {
  type GFTreeFeature,
  convertFromGFTreeFeatureToNormalizedTreeFeature,
} from "./ayyoweca-uganda";
import useNavigation from "@/app/(map-routes)/_features/navigation/use-navigation";
type ProjectSiteOption = {
  value: string;
  label: string;
};

type ProjectStateCatalog = {
  loading: {
    projectData: null;
    projectDataStatus: "loading";
    allSitesOptions: null;
    siteId: null;
    activeSite: null;
    treesAsync: null;
  };
  success: {
    projectData: Project;
    projectDataStatus: "success";
    allSitesOptions: ProjectSiteOption[];
    siteId: string | null;
    activeSite: SiteAsset | null;
    treesAsync: AsyncData<MeasuredTreesGeoJSON | null>;
  };
  error: {
    projectData: null;
    projectDataStatus: "error";
    allSitesOptions: null;
    siteId: null;
    activeSite: null;
    treesAsync: null;
  };
};

type ProjectState = ProjectStateCatalog[keyof ProjectStateCatalog];

export const PROJECT_OVERLAY_TABS = [
  "info",
  "ask-ai",
  "biodiversity",
  "media",
  "remote-sensing-analysis",
  "community",
  "logbook",
  "edit",
  "ecocerts",
] as const;

export type ProjectOverlayState = {
  projectId: string | undefined;
  activeTab: (typeof PROJECT_OVERLAY_TABS)[number];
  isMaximized: boolean;
} & ProjectState;

export type ProjectOverlayActions = {
  setProjectId: (
    projectId: ProjectOverlayState["projectId"],
    navigate?: ReturnType<typeof useNavigation>,
    zoomToSite?: boolean
  ) => void;
  setSiteId: (
    siteId: string | null,
    navigate?: ReturnType<typeof useNavigation>
  ) => void;
  activateSite: (
    zoomToSite?: boolean,
    navigate?: ReturnType<typeof useNavigation>
  ) => void;
  setActiveTab: (
    tab: ProjectOverlayState["activeTab"],
    navigate?: ReturnType<typeof useNavigation>
  ) => void;
  resetState: () => void;
  setIsMaximized: (isMaximized: ProjectOverlayState["isMaximized"]) => void;
};

const initialProjectState: ProjectState = {
  projectDataStatus: "loading",
  projectData: null,
  treesAsync: null,
  allSitesOptions: null,
  siteId: null,
  activeSite: null,
};

const initialState: ProjectOverlayState = {
  projectId: undefined,
  ...initialProjectState,
  activeTab: "info",
  isMaximized: false,
};

const useProjectOverlayStore = create<
  ProjectOverlayState & ProjectOverlayActions
>((set, get) => {
  const isProjectStillActive = (id: string) => get().projectId === id;

  const getAllSiteAssets = (projectData: Project) => {
    return projectData.assets.filter((asset) => {
      if (asset.classification !== "Shapefiles") return false;
      if (asset.shapefile === null) return false;
      const shapefile = asset.shapefile;
      return Boolean(shapefile.shortName && !shapefile.isReference);
    }) as SiteAsset[];
  };

  return {
    ...initialState,
    setProjectId: async (projectId, navigate, zoomToSite) => {
      console.log("setProjectId", projectId, navigate, zoomToSite);
      // Reset state if no id provided
      if (!projectId) {
        get().resetState();
        navigate?.({
          project: null,
        });
        return;
      }

      // Set initial loading state
      set({
        projectId,
        ...initialProjectState,
      });
      navigate?.({
        project: {
          "project-id": projectId,
          "site-id": null,
          views: ["info"],
        },
      });

      const projectData = await fetchProjectData(projectId);

      if (!isProjectStillActive(projectId)) return;

      if (!projectData) {
        set({
          projectDataStatus: "error",
          projectData: null,
        });
        return;
      }

      // Compute project site options
      const projectSites = getAllSiteAssets(projectData);
      const defaultSite = projectSites.find((site) => site.shapefile.default);

      const allSitesOptions = projectSites.map((site) => ({
        value: site.id,
        label: site.shapefile.shortName,
      }));

      set({
        projectDataStatus: "success",
        projectData: projectData,
        allSitesOptions: allSitesOptions,
        treesAsync: {
          _status: "loading",
          data: null,
        },
      });

      if (allSitesOptions.length > 0) {
        const siteId = get().siteId;
        if (
          siteId === null ||
          allSitesOptions.find((site) => site.value === siteId) === undefined
        ) {
          const defaultSiteId = defaultSite?.id;
          const siteIdToActivate = defaultSiteId ?? allSitesOptions[0].value;
          get().setSiteId(siteIdToActivate, navigate);
        }
      } else {
        get().setSiteId(null, navigate);
      }
      get().activateSite(zoomToSite ?? true, navigate);

      // Then fetch trees data (asynchronous operation)
      try {
        let data: MeasuredTreesGeoJSON | null = null;
        if (
          projectId ===
          "49bbaba0d8980989ce9b3988a45c375a42206239d6bc930c2357035e670838e0"
        ) {
          const gfTreeFeatures = (await fetchMeasuredTreesShapefile(
            projectData.name
          )) as unknown as {
            type: "FeatureCollection";
            features: GFTreeFeature[];
          };
          data = {
            type: "FeatureCollection",
            features: gfTreeFeatures.features.map(
              convertFromGFTreeFeatureToNormalizedTreeFeature
            ),
          };
        } else {
          data = await fetchMeasuredTreesShapefile(projectData.name);
        }
        if (!isProjectStillActive(projectId)) return;
        set({
          treesAsync: {
            _status: "success",
            data,
          },
        });
      } catch (error) {
        console.error("Error fetching measured trees shapefile", error);
        if (!isProjectStillActive(projectId)) return;
        set({
          treesAsync: {
            _status: "error",
            data: null,
          },
        });
      }
    },
    setSiteId: (siteId, navigate) => {
      const projectId = get().projectId;
      if (!projectId) return;
      set({ siteId });
      navigate?.((draft) => {
        const project = draft.project;
        if (!project) {
          draft.project = {
            "project-id": projectId,
            "site-id": siteId,
            views: [],
          };
        } else {
          project["site-id"] = siteId;
        }
      });
    },
    activateSite: (zoomToSite, navigate) => {
      const projectData = get().projectData;
      if (!projectData) return;
      const projectSites = getAllSiteAssets(projectData);
      const selectedSite = projectSites.find(
        (site) => site.id === get().siteId
      );
      if (!selectedSite) return;

      useMapStore.getState().setCurrentView("project");
      fetchProjectPolygon(selectedSite.awsCID).then((data) => {
        if (data === null) return;
        const boundingBox = bbox(data).slice(0, 4) as [
          number,
          number,
          number,
          number
        ];
        if (zoomToSite) {
          useMapStore.getState().setMapBounds(boundingBox);
        }
        navigate?.((draft) => {
          if (draft.map.bounds !== null) {
            draft.map.bounds = null;
          }
        });
        useMapStore.getState().setHighlightedPolygon(data);
      });

      set({ activeSite: selectedSite });
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
