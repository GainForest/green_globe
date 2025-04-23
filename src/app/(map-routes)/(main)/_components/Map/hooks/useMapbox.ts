import React, { useEffect, useRef } from "react";
import useMapStore from "../store";
import { addAllSourcesAndLayers } from "../utils";
import {
  addProjectMarkerHandlers,
  setProjectMarkers,
  spinGlobe,
} from "@/app/(map-routes)/_utils/map";
import useProjectOverlayStore from "../../ProjectOverlay/store";
import useOverlayTabsStore from "@/app/(map-routes)/(main)/_components/Overlay/OverlayTabs/store";
import mapboxgl, { Map as MapInterface } from "mapbox-gl";
import { MAP_CONFIG, MAP_FOG_CONFIG } from "../../../../../../config/map";
import useNavigation from "@/app/(map-routes)/(main)/_features/navigation/use-navigation";

const useMapbox = (mapContainerRef: React.RefObject<HTMLDivElement | null>) => {
  const mapRef = useRef<MapInterface | null>(null);
  const setMapRef = useMapStore((state) => state.setMapRef);

  const navigate = useNavigation();

  const setMapLoaded = useMapStore((state) => state.setMapLoaded);

  const setCurrentView = useMapStore((state) => state.setCurrentView);
  const setOverlayTab = useOverlayTabsStore((actions) => actions.setActiveTab);
  const setActiveProjectId = useProjectOverlayStore(
    (actions) => actions.setProjectId
  );

  const handleProjectMarkerClick = (projectId: string) => {
    setCurrentView("project");
    setOverlayTab("project", navigate);
    setTimeout(() => {
      setActiveProjectId(projectId, navigate);
    }, 250);
  };

  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOXGL_ACCESSTOKEN;
    if (mapContainerRef.current === null) return;

    const map = new MapInterface({
      ...MAP_CONFIG,
      container: mapContainerRef.current,
    });
    mapRef.current = map;
    setMapRef(mapRef);

    // Start the spin
    let shouldSpin = true;
    const startSpin = () => {
      shouldSpin = true;
      spinGlobe(map, shouldSpin);
    };
    const continueSpin = () => {
      spinGlobe(map, shouldSpin);
    };
    const stopSpin = () => {
      shouldSpin = false;
    };

    startSpin();

    // Spin again once the animation is complete
    map.on("moveend", continueSpin);
    // Stop spinning when the user clicks the map
    map.on("mousedown", stopSpin);
    // Stop spinning when the user touches the map
    map.on("touchstart", stopSpin);

    const onLoad = () => {
      map.setFog(MAP_FOG_CONFIG);
      addAllSourcesAndLayers(map);
      setProjectMarkers(map).then(() => {
        addProjectMarkerHandlers(map, handleProjectMarkerClick);
      });
      setMapLoaded(true);
    };

    map.on("load", onLoad);

    return () => {
      map.off("load", onLoad);
      map.off("moveend", continueSpin);
      map.off("mousedown", stopSpin);
      map.off("touchstart", stopSpin);
    };
  }, []);
};

export default useMapbox;
