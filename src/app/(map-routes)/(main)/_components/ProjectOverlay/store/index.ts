import { create } from "zustand";
import { AtprotoSite, Project } from "./types";
import {
  fetchMeasuredTreesShapefile,
  fetchSiteShapefile,
} from "./utils";
import useMapStore from "../../Map/store";
import bbox from "@turf/bbox";
import { MeasuredTreesGeoJSON } from "./types";
import { AsyncData } from "@/lib/types";
import {
  type GFTreeFeature,
  convertFromGFTreeFeatureToNormalizedTreeFeature,
} from "./ayyoweca-uganda";
import useNavigation from "@/app/(map-routes)/(main)/_features/navigation/use-navigation";
import ClimateAIAgent from "@/lib/atproto/agent";

// ---------------------------------------------------------------------------
// ATProto collections
// ---------------------------------------------------------------------------
const SITE_COLLECTION = "app.gainforest.organization.site";
const DEFAULT_SITE_COLLECTION = "app.gainforest.organization.defaultSite";
const DEFAULT_SITE_RKEY = "self";

// ---------------------------------------------------------------------------
// Raw PDS record shapes
// ---------------------------------------------------------------------------
type RawSiteValue = {
  name?: unknown;
  lat?: unknown;
  lon?: unknown;
  area?: unknown;
  shapefile?: unknown;
  trees?: unknown;
  createdAt?: unknown;
  [k: string]: unknown;
};

type RawSiteRecord = {
  uri: string;
  cid: string;
  value: RawSiteValue;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const extractRkey = (uri: string): string => {
  const parts = uri.split("/");
  return parts[parts.length - 1] ?? uri;
};

const normalizeAtprotoSite = (raw: RawSiteRecord): AtprotoSite => ({
  uri: raw.uri,
  rkey: extractRkey(raw.uri),
  name: typeof raw.value.name === "string" ? raw.value.name : "",
  lat: typeof raw.value.lat === "string" ? raw.value.lat : "",
  lon: typeof raw.value.lon === "string" ? raw.value.lon : "",
  area: typeof raw.value.area === "string" ? raw.value.area : "",
  shapefile: raw.value.shapefile ?? null,
  trees: raw.value.trees,
  createdAt:
    typeof raw.value.createdAt === "string" ? raw.value.createdAt : undefined,
});

const fetchAllAtprotoSites = async (did: string): Promise<AtprotoSite[]> => {
  const records: AtprotoSite[] = [];
  let cursor: string | undefined;

  do {
    const response = await ClimateAIAgent.com.atproto.repo.listRecords({
      repo: did,
      collection: SITE_COLLECTION,
      limit: 100,
      cursor,
    });

    const page = response.data.records as RawSiteRecord[] | undefined;
    if (page?.length) {
      records.push(...page.map(normalizeAtprotoSite));
    }

    cursor = response.data.cursor ?? undefined;
  } while (cursor);

  return records;
};

const fetchDefaultSiteUri = async (did: string): Promise<string | null> => {
  try {
    const response = await ClimateAIAgent.com.atproto.repo.getRecord({
      repo: did,
      collection: DEFAULT_SITE_COLLECTION,
      rkey: DEFAULT_SITE_RKEY,
    });
    const value = response.data.value as { site?: unknown } | undefined;
    if (typeof value?.site === "string") {
      return value.site;
    }
    return null;
  } catch {
    return null;
  }
};

const fetchOrganizationSlug = async (did: string): Promise<string | null> => {
  try {
    const response = await ClimateAIAgent.com.atproto.repo.describeRepo({
      repo: did,
    });
    const handle = response.data.handle ?? null;
    if (!handle) return null;
    return handle.split(".")[0] ?? null;
  } catch {
    return null;
  }
};

/**
 * Build a minimal Project-compatible object from ATProto data so that
 * downstream stores (BiodiversityPredictions, LayersOverlay) continue to work
 * until task 17.4 migrates them.
 *
 *   project.id   → DID (used as cache key)
 *   project.name → slug (used for S3 path construction)
 */
const buildCompatProject = (did: string, slug: string): Project => ({
  id: did,
  name: slug,
  country: "",
  dataDownloadUrl: "",
  dataDownloadInfo: "",
  description: "",
  longDescription: "",
  stripeUrl: "",
  discordId: null,
  lat: 0,
  lon: 0,
  area: 0,
  assets: [],
  communityMembers: [],
  Wallet: null,
});

// ---------------------------------------------------------------------------
// Store types
// ---------------------------------------------------------------------------
type ProjectSiteOption = {
  value: string; // site URI (AT-URI)
  label: string; // site name
};

type ProjectStateCatalog = {
  loading: {
    projectData: null;
    projectDataStatus: "loading";
    allSitesOptions: null;
    siteId: null;
    activeSite: null;
    treesAsync: null;
    projectSlug: null;
    atprotoSites: null;
  };
  success: {
    projectData: Project;
    projectDataStatus: "success";
    allSitesOptions: ProjectSiteOption[];
    siteId: string | null;
    activeSite: AtprotoSite | null;
    treesAsync: AsyncData<MeasuredTreesGeoJSON | null>;
    projectSlug: string;
    atprotoSites: AtprotoSite[];
  };
  error: {
    projectData: null;
    projectDataStatus: "error";
    allSitesOptions: null;
    siteId: null;
    activeSite: null;
    treesAsync: null;
    projectSlug: null;
    atprotoSites: null;
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
  projectSlug: null,
  atprotoSites: null,
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

  return {
    ...initialState,
    setProjectId: async (projectId, navigate, zoomToSite) => {
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

      // Fetch ATProto data in parallel: sites + default site + handle/slug
      let sites: AtprotoSite[];
      let defaultSiteUri: string | null;
      let slug: string | null;

      try {
        [sites, defaultSiteUri, slug] = await Promise.all([
          fetchAllAtprotoSites(projectId),
          fetchDefaultSiteUri(projectId),
          fetchOrganizationSlug(projectId),
        ]);
      } catch (error) {
        console.error("Error fetching ATProto project data", error);
        if (!isProjectStillActive(projectId)) return;
        set({
          projectDataStatus: "error",
          projectData: null,
        });
        return;
      }

      if (!isProjectStillActive(projectId)) return;

      // Require at least a slug to proceed
      if (!slug) {
        set({
          projectDataStatus: "error",
          projectData: null,
        });
        return;
      }

      // Build site options from ATProto site records
      const allSitesOptions: ProjectSiteOption[] = sites.map((site) => ({
        value: site.uri,
        label: site.name || site.rkey,
      }));

      // Build backward-compat Project object for downstream stores
      const projectData = buildCompatProject(projectId, slug);

      set({
        projectDataStatus: "success",
        projectData,
        allSitesOptions,
        atprotoSites: sites,
        projectSlug: slug,
        treesAsync: { _status: "loading", data: null },
      });

      // Determine which site to activate
      if (allSitesOptions.length > 0) {
        const currentSiteId = get().siteId;
        const siteStillValid =
          currentSiteId !== null &&
          allSitesOptions.some((s) => s.value === currentSiteId);

        if (!siteStillValid) {
          // Prefer the defaultSite record, then fall back to first option
          const defaultOption = defaultSiteUri
            ? allSitesOptions.find((s) => s.value === defaultSiteUri)
            : undefined;
          const siteIdToActivate =
            defaultOption?.value ?? allSitesOptions[0].value;
          get().setSiteId(siteIdToActivate, navigate);
        }
      } else {
        get().setSiteId(null, navigate);
      }
      get().activateSite(zoomToSite ?? true, navigate);
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
      const { atprotoSites, siteId, projectId, projectSlug } = get();
      if (!atprotoSites || !projectId) return;

      const selectedSite = atprotoSites.find((site) => site.uri === siteId);
      if (!selectedSite) return;

      useMapStore.getState().setCurrentView("project");

      fetchSiteShapefile(projectId, selectedSite.shapefile).then((data) => {
        if (data === null) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const boundingBox = bbox(data as any).slice(0, 4) as [
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
        // Cast to ProjectPolygonAPIResponse for Map store compatibility
        // (both are GeoJSON FeatureCollections at runtime)
        useMapStore
          .getState()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .setHighlightedPolygon(data as any);
      });

      set({
        activeSite: selectedSite,
        treesAsync: { _status: "loading", data: null },
      });

      // Fetch measured trees for this site — prefer ATProto blob, fall back to S3
      const slug = projectSlug ?? "";
      const treesRef = selectedSite.trees;

      const isAyyowecaUganda =
        projectId ===
        "49bbaba0d8980989ce9b3988a45c375a42206239d6bc930c2357035e670838e0";

      fetchMeasuredTreesShapefile(slug, treesRef, projectId)
        .then(async (rawData) => {
          if (!isProjectStillActive(projectId)) return;

          let data: MeasuredTreesGeoJSON | null = rawData;

          if (isAyyowecaUganda && rawData !== null) {
            // The Ayyoweca Uganda project uses a different GeoJSON schema
            const gfTreeFeatures = rawData as unknown as {
              type: "FeatureCollection";
              features: GFTreeFeature[];
            };
            data = {
              type: "FeatureCollection",
              features: gfTreeFeatures.features.map(
                convertFromGFTreeFeatureToNormalizedTreeFeature
              ),
            };
          }

          set({ treesAsync: { _status: "success", data } });
        })
        .catch((error) => {
          console.error("Error fetching measured trees shapefile", error);
          if (!isProjectStillActive(projectId)) return;
          set({ treesAsync: { _status: "error", data: null } });
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
