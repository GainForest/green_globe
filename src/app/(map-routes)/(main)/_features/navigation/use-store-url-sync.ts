import { ReadonlyURLSearchParams } from "next/navigation";
import { useEffect } from "react";
import useProjectOverlayStore from "../../_components/ProjectOverlay/store";
import useOverlayTabsStore from "../../_components/Overlay/OverlayTabs/store";
import { generateNavigationStateFromURL } from "../../_features/navigation/utils";
import useNavigationStore from "../../_features/navigation/store";
import useLayersOverlayStore from "../../_components/LayersOverlay/store";
import dayjs from "dayjs";
import useSearchOverlayStore from "../../_components/SearchOverlay/store";
import { updateDedicatedStoresFromViews } from "../../_features/navigation/utils/project";
import useMapStore from "../../_components/Map/store";

const useStoreUrlSync = (
  queryParams: ReadonlyURLSearchParams,
  params: {
    projectId?: string;
  }
) => {
  const { projectId: projectIdParam } = params;

  // ⚠️⚠️⚠️ Make sure to update the dependencies, in case of changes to the props.
  useEffect(() => {
    const navigationState = generateNavigationStateFromURL(
      projectIdParam ? `/${projectIdParam}` : "",
      queryParams
    );
    useNavigationStore.getState().updateNavigationState(navigationState);

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
      const { projectId, setProjectId } = useProjectOverlayStore.getState();

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
    }

    // Layers
    const layers = useNavigationStore.getState().layers;
    const { setToggledOnLayerIds, setStaticLayerVisibility } =
      useLayersOverlayStore.getState();
    setToggledOnLayerIds(layers["enabled-layers"]);
    setStaticLayerVisibility("landcover", layers["landcover"]);
    const historicalSatelliteLayer = layers["historical-satellite"];
    if (historicalSatelliteLayer) {
      const historicalSatelliteState =
        useLayersOverlayStore.getState().historicalSatelliteState;
      const { minDate, maxDate } = historicalSatelliteState;
      const { date: historicalSatelliteDateString } = historicalSatelliteLayer;
      let isValidDate = false;
      try {
        const date = dayjs(historicalSatelliteDateString, "YYYY-MM");
        if (
          date.isValid() &&
          (date.isAfter(minDate) || date.isSame(minDate)) &&
          (date.isBefore(maxDate) || date.isSame(maxDate))
        ) {
          isValidDate = true;
        }
      } catch (error) {
        console.error(error);
        isValidDate = false;
      }
      if (isValidDate) {
        setStaticLayerVisibility("historicalSatellite", true);
        useLayersOverlayStore
          .getState()
          .setHistoricalSatelliteDate(
            dayjs(historicalSatelliteDateString, "YYYY-MM")
          );
      }
    }

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
  }, [projectIdParam, queryParams]);
};

export default useStoreUrlSync;
