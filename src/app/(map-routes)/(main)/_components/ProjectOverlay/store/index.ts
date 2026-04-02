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
import { fetchMeasuredTreeOccurrences } from "../../../_hooks/use-organization-measured-trees";
import { hyperindexClient } from "@/lib/hyperindex/client";
import {
  DEFAULT_SITE_BY_DID,
  LOCATIONS_BY_DID,
} from "@/lib/hyperindex/queries";
import type {
  Connection,
  HiCertifiedLocation,
  HiOrganizationDefaultSite,
} from "@/lib/hyperindex/types";

// ---------------------------------------------------------------------------
// ATProto collections
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type LocationsResponse = {
  appCertifiedLocation: Connection<HiCertifiedLocation>;
};

type DefaultSiteResponse = {
  appGainforestOrganizationDefaultSite: Connection<HiOrganizationDefaultSite>;
};

const normalizeCertifiedLocation = (location: HiCertifiedLocation): AtprotoSite => ({
  uri: location.uri,
  rkey: location.rkey,
  name:
    typeof location.name === "string" && location.name.trim().length > 0
      ? location.name
      : location.rkey,
  lat: "",
  lon: "",
  area: "",
  shapefile:
    "blob" in location.location ? { blob: location.location.blob } : location.location.uri,
  trees: undefined,
  createdAt: location.createdAt,
});

const fetchAllAtprotoSites = async (did: string): Promise<AtprotoSite[]> => {
  const response: LocationsResponse = await hyperindexClient.request(
    LOCATIONS_BY_DID,
    {
      did,
      first: 100,
    }
  );

  return response.appCertifiedLocation.edges.map((edge) =>
    normalizeCertifiedLocation(edge.node)
  );
};

const fetchDefaultSiteUri = async (did: string): Promise<string | null> => {
  const response: DefaultSiteResponse = await hyperindexClient.request(
    DEFAULT_SITE_BY_DID,
    { did }
  );

  const defaultSite = response.appGainforestOrganizationDefaultSite.edges[0]?.node;
  return typeof defaultSite?.site === "string" ? defaultSite.site : null;
};

/** PDS truncates handles to 18 chars. Map truncated slugs to their full S3 names. */
const SLUG_OVERRIDES: Record<string, string> = {
  'oceanus-conservati': 'oceanus-conservation',
  'centre-for-sustain': 'centre-for-sustainability-ph',
  'albertine-rural-re': 'albertine-rural-restoration-alert',
  'million-trees-proj': 'million-trees-project',
  'youth-leading-envi': 'youth-leading-environmental-change',
  'la-cotinga-biologi': 'la-cotinga-biological-station',
  'reserva-natural-mo': 'reserva-natural-monte-alegre',
  'pandu-alam-lestari': 'pandu-alam-lestari-foundation',
  'forrest-forest-reg': 'forrest-forest-regeneration-and-environmental-sustainability-trust',
  'community-based-en': 'community-based-environmental-conservation',
  'defensores-del-cha': 'defensores-del-chaco',
  'south-rift-associa': 'south-rift-association-of-landowners',
  'bees-and-trees-uga': 'bees-and-trees-uganda',
  'northern-rangeland': 'northern-rangelands-trust',
  'masungi-georeserve': 'masungi',
  'green-ambassadors': 'green-ambassador',
  'nature-and-people': 'nature-and-people-as-one',
  'xprize-rainfor-21p': 'xprize-rainforest-finals',
};

const fetchOrganizationSlug = async (did: string): Promise<string | null> => {
  try {
    const response = await ClimateAIAgent.com.atproto.repo.describeRepo({
      repo: did,
    });
    const handle = response.data.handle ?? null;
    if (!handle) return null;
    const rawSlug = handle.split('.')[0] ?? null;
    if (!rawSlug) return null;
    return SLUG_OVERRIDES[rawSlug] ?? rawSlug;
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

      // Fetch measured trees for this site.
      // Priority:
      //   1. dwc.occurrence records (migrated orgs) — via fetchMeasuredTreeOccurrences
      //   2. ATProto blob / S3 fallback (non-migrated orgs) — via fetchMeasuredTreesShapefile
      const slug = projectSlug ?? "";
      const treesRef = selectedSite.trees;

      const isAyyowecaUganda =
        projectId ===
        "49bbaba0d8980989ce9b3988a45c375a42206239d6bc930c2357035e670838e0";

      (async () => {
        try {
          // Path 1: Try dwc.occurrence records first (migrated orgs)
          const occurrenceData = await fetchMeasuredTreeOccurrences(projectId);
          if (!isProjectStillActive(projectId)) return;

          if (occurrenceData !== null) {
            // Org has been migrated — use occurrence data directly
            set({ treesAsync: { _status: "success", data: occurrenceData } });
            return;
          }

          // Path 2: Fall back to legacy GeoJSON blob / S3 path (non-migrated orgs)
          const rawData = await fetchMeasuredTreesShapefile(
            slug,
            treesRef,
            projectId
          );
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
        } catch (error) {
          console.error("Error fetching measured trees", error);
          if (!isProjectStillActive(projectId)) return;
          set({ treesAsync: { _status: "error", data: null } });
        }
      })();
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
