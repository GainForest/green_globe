"use client";
import React, { useEffect, useRef } from "react";
import "@/app/(map-routes)/_styles/map.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAP_FOG_CONFIG } from "@/config/map";
import { MAP_CONFIG } from "@/config/map";
import mapboxgl, { Map as MapInterface } from "mapbox-gl";
import {
  addProjectMarkerHandlers,
  setProjectMarkers,
  spinGlobe,
} from "@/app/(map-routes)/_utils/map";
import { useRouter } from "next/navigation";
import { addProjectMarkersSourceAndLayer } from "@/app/(map-routes)/(main)/_components/Map/sources-and-layers/project-markers";
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
  const mapRef = useRef<MapInterface | null>(null);
  const { setMap, setMapLoaded } = useMapStore();
  const { mapControls } = useOverlayStore();

  const router = useRouter();
  const handleProjectMarkerClick = (projectId: string) => {
    router.push(`/${projectId}?overlay-active-tab=project`);
  };

  const asyncShapeData = useShapeData();

  useEffect(() => {
    if (
      !mapRef.current ||
      asyncShapeData._status !== "success" ||
      !asyncShapeData.data
    )
      return;
    const map = mapRef.current;

    const data = asyncShapeData.data;
    // Handle both FeatureCollection and MultiPolygon types
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

    addShapefileSourceAndLayers(map, features);

    return () => {
      removeShapefileLayers(map);
    };
  }, [asyncShapeData._status, asyncShapeData.data]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const layer = map.getLayer("projectMarkerLayer");
    if (!layer) return;

    if (mapControls.showProjectMarkers) {
      map.setLayoutProperty("projectMarkerLayer", "visibility", "visible");
    } else {
      map.setLayoutProperty("projectMarkerLayer", "visibility", "none");
    }
  }, [mapControls.showProjectMarkers]);

  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOXGL_ACCESSTOKEN;
    if (mapContainerRef.current === null) return;

    const map = new MapInterface({
      ...MAP_CONFIG,
      container: mapContainerRef.current,
    });
    mapRef.current = map;
    setMap(map);

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
      addProjectMarkersSourceAndLayer(map);
      map.setLayoutProperty(
        "projectMarkerLayer",
        "visibility",
        mapControls.showProjectMarkers ? "visible" : "none"
      );
      map.setFog(MAP_FOG_CONFIG);
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

  return (
    <div
      style={{ height: "100%" }}
      ref={mapContainerRef}
      className="map-container flex-1"
    ></div>
  );
};

export default Map;
