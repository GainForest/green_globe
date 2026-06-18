"use client";
import React, { useEffect, useRef } from "react";
import "@/app/(map-routes)/_styles/map.css";
import { GlobeController } from "@/app/(map-routes)/_utils/GlobeController";
import {
  fetchProjectSites,
  organizationPointsToGlobeMarkers,
} from "@/app/(map-routes)/_utils/map";
import { useRouter } from "next/navigation";
import useMapStore from "./store";
import useOverlayStore from "../Overlay/store";
import useShapeData from "./hooks/useShapeData";
import { Feature } from "geojson";
import {
  addShapefileSourceAndLayers,
  removeShapefileLayers,
} from "./sources-and-layers/shapefile";

const Map = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<GlobeController | null>(null);
  const { setMap, setMapLoaded } = useMapStore();
  const { mapControls } = useOverlayStore();

  const router = useRouter();
  const asyncShapeData = useShapeData();

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      if (!mapContainerRef.current) return;

      const controller = await GlobeController.create(mapContainerRef.current, {
        onProjectMarkerClick: (projectId) => {
          router.push(`/${projectId}?overlay-active-tab=project`);
        },
      });

      if (cancelled) {
        controller.destroy();
        return;
      }

      controllerRef.current = controller;
      setMap(controller);
      setMapLoaded(true);

      const projectSites = await fetchProjectSites();
      if (!cancelled) {
        controller.setProjectMarkers(organizationPointsToGlobeMarkers(projectSites));
        controller.setProjectMarkersVisible(
          useOverlayStore.getState().mapControls.showProjectMarkers,
        );
      }
    };

    void initialize();

    return () => {
      cancelled = true;
      controllerRef.current?.destroy();
      controllerRef.current = null;
      setMap(null);
      setMapLoaded(false);
    };
  }, [router, setMap, setMapLoaded]);

  useEffect(() => {
    const globe = controllerRef.current;
    if (!globe) return;

    globe.setProjectMarkersVisible(mapControls.showProjectMarkers);
  }, [mapControls.showProjectMarkers]);

  useEffect(() => {
    const globe = controllerRef.current;
    if (
      !globe ||
      asyncShapeData._status !== "success" ||
      !asyncShapeData.data
    ) {
      return;
    }

    const data = asyncShapeData.data;
    let features: Feature[] = [];
    if (data.type === "FeatureCollection") {
      features = data.features;
    } else if (
      data.type === "Feature" &&
      data.geometry.type === "MultiPolygon"
    ) {
      features = [
        {
          type: "Feature",
          properties: data.properties || {},
          geometry: data.geometry,
        },
      ];
    } else {
      console.error("Unsupported GeoJSON type:", data.type);
      return;
    }

    addShapefileSourceAndLayers(globe, features);

    return () => {
      removeShapefileLayers(globe);
    };
  }, [asyncShapeData._status, asyncShapeData.data]);

  return (
    <div
      style={{ height: "100%" }}
      ref={mapContainerRef}
      className="map-container flex-1"
      data-testid="map-root"
    />
  );
};

export default Map;
