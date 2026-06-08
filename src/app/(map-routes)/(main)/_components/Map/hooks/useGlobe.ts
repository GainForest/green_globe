import React, { useEffect, useRef } from "react";
import { GlobeController } from "@/app/(map-routes)/_utils/GlobeController";
import type { GlobeHtmlDatum } from "@/app/(map-routes)/_utils/globe-data";
import useNavigation from "@/app/(map-routes)/(main)/_features/navigation/use-navigation";
import useIndexedOrganizations from "@/app/(map-routes)/(main)/_hooks/useIndexedOrganizations";
import useMapStore from "../store";
import useProjectOverlayStore from "../../ProjectOverlay/store";

const useGlobe = (mapContainerRef: React.RefObject<HTMLDivElement | null>) => {
  const controllerRef = useRef<GlobeController | null>(null);
  const setMapRef = useMapStore((state) => state.setMapRef);
  const setMapLoaded = useMapStore((state) => state.setMapLoaded);
  const setCurrentView = useMapStore((state) => state.setCurrentView);
  const setActiveProjectId = useProjectOverlayStore(
    (actions) => actions.setProjectId,
  );
  const navigate = useNavigation();
  const navigateRef = useRef(navigate);
  const { organizations } = useIndexedOrganizations();

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      if (!mapContainerRef.current) return;

      const controller = await GlobeController.create(mapContainerRef.current, {
        onProjectMarkerClick: (organizationId) => {
          setCurrentView("project");
          setActiveProjectId(organizationId, navigateRef.current);
        },
      });

      if (cancelled) {
        controller.destroy();
        return;
      }

      controllerRef.current = controller;
      setMapRef(controllerRef);
      setMapLoaded(true);
    };

    void initialize();

    return () => {
      cancelled = true;
      controllerRef.current?.destroy();
      controllerRef.current = null;
      setMapRef(null);
      setMapLoaded(false);
    };
  }, [mapContainerRef, setActiveProjectId, setCurrentView, setMapLoaded, setMapRef]);

  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller || !organizations) return;

    const markers: GlobeHtmlDatum[] = organizations.map((organization) => ({
      id: organization.did,
      kind: "project-marker",
      lat: organization.mapPoint.lat,
      lng: organization.mapPoint.lon,
      label: organization.info.name,
      did: organization.did,
    }));

    controller.setProjectMarkers(markers);
  }, [organizations]);
};

export default useGlobe;
