import { ReadonlyURLSearchParams } from "next/navigation";
import {
  DEFAULT_NAVIGATION_STATE,
  NavigationState,
  ProjectNavigationState,
  OverlayNavigationState,
  LayersNavigationState,
  SearchNavigationState,
  MapNavigationState,
} from "../store";
type NestedObject = {
  [key: string]:
    | string
    | number
    | boolean
    | null
    | NestedObject
    | Array<string | number | boolean | null>;
};

export const verifyKeyType = <T extends readonly string[]>(
  key: unknown,
  allowedKeys: T
): key is T[number] => {
  return typeof key === "string" && allowedKeys.includes(key);
};

export const generateQueryStringFromDiff = (
  current: NestedObject,
  base: NestedObject,
  parentKey: string = ""
): string => {
  const params: string[] = [];

  for (const [key, value] of Object.entries(current)) {
    const baseValue = base[key];
    const paramKey = parentKey ? `${parentKey}-${key}` : key;

    if (typeof value === "object") {
      if (value === null) {
        continue;
      }
      // For arrays, check if all values are equal
      if (Array.isArray(value)) {
        let allValuesEqual = true;
        if (!Array.isArray(baseValue)) {
          allValuesEqual = false;
        } else {
          if (value.length !== baseValue.length) {
            allValuesEqual = false;
          } else {
            allValuesEqual =
              JSON.stringify(value) === JSON.stringify(baseValue);
          }
        }
        if (!allValuesEqual) {
          params.push(`${paramKey}=${value.join(",")}`);
        }
        continue;
      }

      // For nested objects, always recurse regardless of baseValue type
      if (baseValue === null || typeof baseValue !== "object") {
        // Create empty object as base to compare against
        const nestedParams = generateQueryStringFromDiff(
          value as NestedObject,
          {} as NestedObject,
          paramKey
        );
        if (nestedParams) {
          params.push(nestedParams);
        }
      } else {
        const nestedParams = generateQueryStringFromDiff(
          value as NestedObject,
          baseValue as NestedObject,
          paramKey
        );
        if (nestedParams) {
          params.push(nestedParams);
        }
      }
    } else if (JSON.stringify(value) !== JSON.stringify(baseValue)) {
      params.push(`${paramKey}=${String(value)}`);
    }
  }

  return params.filter(Boolean).join("&");
};

export const generateNavigationStateFromURL = (
  url: string,
  params: ReadonlyURLSearchParams
): NavigationState => {
  const urlChunks = url.split("/").filter((str) => str.trim() !== "");

  // Overlay
  const overlayActiveTab = params.get("overlay-active-tab");
  const overlayDisplay = params.get("overlay-display");
  const overlay = {
    "active-tab": (overlayActiveTab ??
      DEFAULT_NAVIGATION_STATE.overlay[
        "active-tab"
      ]) as OverlayNavigationState["active-tab"],
    display: (overlayDisplay ??
      DEFAULT_NAVIGATION_STATE.overlay
        .display) as OverlayNavigationState["display"],
  } satisfies OverlayNavigationState;

  // Project
  let project: ProjectNavigationState | null = null;
  const projectId = urlChunks.length > 0 ? urlChunks[0] : null;
  if (projectId) {
    const projectSiteId = params.get("project-site-id");
    const projectViews = params.get("project-views");
    project = {
      "project-id": projectId,
      "site-id": projectSiteId,
      views: projectViews?.split(",") ?? [],
    } satisfies ProjectNavigationState;
  }

  // Layers
  const layersHistoricalSatelliteDate = params.get(
    "layers-historical-satellite-date"
  );
  const layersEnabledLayers = params.get("layers-enabled-layers");
  const layersLandcover = params.get("layers-landcover");
  const layers = {
    "historical-satellite": layersHistoricalSatelliteDate
      ? {
          date: layersHistoricalSatelliteDate,
        }
      : DEFAULT_NAVIGATION_STATE.layers["historical-satellite"],
    "enabled-layers":
      layersEnabledLayers?.split(",") ??
      DEFAULT_NAVIGATION_STATE.layers["enabled-layers"],
    landcover: layersLandcover
      ? layersLandcover === "true"
      : DEFAULT_NAVIGATION_STATE.layers["landcover"],
  } satisfies LayersNavigationState;

  // Search
  const searchQ = params.get("search-q");
  const search = {
    q: searchQ ?? DEFAULT_NAVIGATION_STATE.search.q,
  } satisfies SearchNavigationState;

  // Map
  const mapBounds = params.get("map-bounds");
  const map = {
    bounds: mapBounds
      ? (mapBounds.split(",").map(Number) as [number, number, number, number])
      : DEFAULT_NAVIGATION_STATE.map.bounds,
  } satisfies MapNavigationState;

  return {
    overlay,
    project,
    layers,
    search,
    map,
  };
};
