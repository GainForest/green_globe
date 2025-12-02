import React, { useEffect, useRef } from "react";
import useMapStore from "../store";
import { addAllSourcesAndLayers } from "../utils";
import {
  addOrganizationPointClickHandlers,
  spinGlobe,
} from "@/app/(map-routes)/_utils/map";
import useProjectOverlayStore from "../../ProjectOverlay/store";
import useOverlayTabsStore from "@/app/(map-routes)/(main)/_components/Overlay/OverlayTabs/store";
import mapboxgl, { GeoJSONSource, Map as MapInterface } from "mapbox-gl";
import { MAP_CONFIG, MAP_FOG_CONFIG } from "../../../../../../config/map";
import useNavigation from "@/app/(map-routes)/(main)/_features/navigation/use-navigation";
import useIndexedOrganizations from "@/app/(map-routes)/(main)/_hooks/useIndexedOrganizations";

const useMapbox = (mapContainerRef: React.RefObject<HTMLDivElement | null>) => {
  const mapRef = useRef<MapInterface | null>(null);
  const setMapRef = useMapStore((state) => state.setMapRef);

  const navigate = useNavigation();

  const mapLoaded = useMapStore((state) => state.mapLoaded);
  const setMapLoaded = useMapStore((state) => state.setMapLoaded);

  const setCurrentView = useMapStore((state) => state.setCurrentView);
  const setOverlayTab = useOverlayTabsStore((actions) => actions.setActiveTab);
  const setActiveProjectId = useProjectOverlayStore(
    (actions) => actions.setProjectId
  );

  const { organizations } = useIndexedOrganizations();

  const handleOrganizationPointClick = (organizationId: string) => {
    setCurrentView("project");
    setOverlayTab("project", navigate);
    setTimeout(() => {
      setActiveProjectId(organizationId, navigate);
    }, 400);
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

  // Add project markers when the organizations load or change
  useEffect(() => {
    if (organizations && mapRef.current) {
      const map = mapRef.current;
      const organizationsFeatureArray = organizations.map((organization) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [
            organization.mapPoint.lon,
            organization.mapPoint.lat,
          ] as [number, number],
        },
        properties: {
          name: organization.info.name,
          country: organization.info.country,
          did: organization.did,
        },
      }));
      const source = map.getSource("projectMarkerSource") as GeoJSONSource;
      source?.setData({
        type: "FeatureCollection",
        features: organizationsFeatureArray,
      });
      addOrganizationPointClickHandlers(map, handleOrganizationPointClick);
    }
  }, [organizations, mapLoaded]);
};

export default useMapbox;
