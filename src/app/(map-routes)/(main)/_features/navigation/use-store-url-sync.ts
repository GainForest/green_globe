import { ReadonlyURLSearchParams } from "next/navigation";
import { useEffect } from "react";
import useProjectOverlayStore from "../../_components/ProjectOverlay/store";
import useOverlayTabsStore from "../../_components/Overlay/OverlayTabs/store";
import { generateNavigationStateFromURL } from "../../_features/navigation/utils";
import useNavigationStore from "../../_features/navigation/store";
import useLayersOverlayStore from "../../_components/LayersOverlay/store";
import useSearchOverlayStore from "../../_components/SearchOverlay/store";
import { updateDedicatedStoresFromViews } from "../../_features/navigation/utils/project";
import useMapStore from "../../_components/Map/store";
import usePreviewStore from "../preview/store";

const GREEN_GLOBE_PREVIEW_FOCUS_MESSAGE_TYPE =
  "gainforest.greenGlobePreview.focusTree";

type GreenGlobePreviewFocusMessage = {
  type: typeof GREEN_GLOBE_PREVIEW_FOCUS_MESSAGE_TYPE;
  datasetRef?: unknown;
  treeUri?: unknown;
};

const isPreviewFocusMessage = (
  value: unknown,
): value is GreenGlobePreviewFocusMessage => {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === GREEN_GLOBE_PREVIEW_FOCUS_MESSAGE_TYPE
  );
};

const normalizeNullableString = (value: unknown): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const useStoreUrlSync = (
  queryParams: ReadonlyURLSearchParams,
  params: {
    projectId?: string;
    embed?: boolean;
  }
) => {
  const { projectId: projectIdParam, embed = false } = params;

  // ⚠️⚠️⚠️ Make sure to update the dependencies, in case of changes to the props.
  useEffect(() => {
    const nextPreviewState = {
      embedMode: embed,
      treeUri: queryParams.get("tree-uri"),
      datasetRef: queryParams.get("dataset-ref"),
    };
    const previousPreviewState = usePreviewStore.getState();
    const previewChanged =
      previousPreviewState.embedMode !== nextPreviewState.embedMode ||
      previousPreviewState.treeUri !== nextPreviewState.treeUri ||
      previousPreviewState.datasetRef !== nextPreviewState.datasetRef;

    const navigationState = generateNavigationStateFromURL(
      projectIdParam ? `/${projectIdParam}` : "",
      queryParams
    );
    useNavigationStore.getState().updateNavigationState(navigationState);
    usePreviewStore.getState().setPreviewState(nextPreviewState);

    // Overlay
    const overlay = useNavigationStore.getState().overlay;
    const { activeTab, setActiveTab, display, setDisplay } =
      useOverlayTabsStore.getState();
    if (overlay["active-tab"] !== activeTab) {
      setActiveTab(overlay["active-tab"]);
    }
    if (overlay["display"] !== display) {
      setDisplay(overlay["display"]);
    }

    // Project
    const project = useNavigationStore.getState().project;
    let map = useNavigationStore.getState().map;
    if (project) {
      const { projectId, setProjectId, refreshTrees } = useProjectOverlayStore.getState();

      // Project & Map bounds
      if (project["project-id"] !== projectId) {
        setProjectId(
          project["project-id"],
          undefined,
          map["bounds"] === null || map["bounds"].length !== 4
        );
      }

      const { siteId, setSiteId } = useProjectOverlayStore.getState();
      if (project["site-id"] !== siteId) {
        setSiteId(project["site-id"]);
      }

      updateDedicatedStoresFromViews(project["views"]);

      if (previewChanged && project["project-id"] === projectId) {
        refreshTrees();
      }
    }

    // Layers
    const layers = useNavigationStore.getState().layers;
    const { setToggledOnLayerIds, setStaticLayerVisibility } =
      useLayersOverlayStore.getState();
    setToggledOnLayerIds(layers["enabled-layers"]);
    setStaticLayerVisibility("landcover", layers["landcover"]);

    // Search
    const search = useNavigationStore.getState().search;
    const { searchQuery, setSearchQuery } = useSearchOverlayStore.getState();
    if (search["q"] !== null && search["q"] !== searchQuery) {
      setSearchQuery(search["q"]);
    }

    // Map
    // Map bounds are also being handled above in the project handling
    map = useNavigationStore.getState().map;
    const { setMapBounds } = useMapStore.getState();
    if (map["bounds"] !== null && map["bounds"].length === 4) {
      setMapBounds(map["bounds"]);
    }

  }, [embed, projectIdParam, queryParams]);

  useEffect(() => {
    if (!embed) {
      return;
    }

    const handlePreviewFocusMessage = (event: MessageEvent) => {
      if (!isPreviewFocusMessage(event.data)) {
        return;
      }

      const previousPreviewState = usePreviewStore.getState();
      const nextDatasetRef = normalizeNullableString(event.data.datasetRef);
      const nextTreeUri = normalizeNullableString(event.data.treeUri);
      const nextPreviewState = {
        embedMode: true,
        datasetRef:
          nextDatasetRef === undefined
            ? previousPreviewState.datasetRef
            : nextDatasetRef,
        treeUri:
          nextTreeUri === undefined ? previousPreviewState.treeUri : nextTreeUri,
      };

      const datasetChanged =
        previousPreviewState.datasetRef !== nextPreviewState.datasetRef;
      const previewChanged =
        previousPreviewState.embedMode !== nextPreviewState.embedMode ||
        previousPreviewState.treeUri !== nextPreviewState.treeUri ||
        datasetChanged;

      if (!previewChanged) {
        return;
      }

      usePreviewStore.getState().setPreviewState(nextPreviewState);

      if (datasetChanged) {
        useProjectOverlayStore.getState().refreshTrees();
      }
    };

    window.addEventListener("message", handlePreviewFocusMessage);
    return () => {
      window.removeEventListener("message", handlePreviewFocusMessage);
    };
  }, [embed]);
};

export default useStoreUrlSync;
