"use client";
import { spinGlobe } from "@/app/(map-routes)/_utils/map";
import mapboxgl, { Map } from "mapbox-gl";
import { useEffect, useRef } from "react";
import { MAP_CONFIG, MAP_FOG_CONFIG } from "@/config/map";
import MapboxDraw from "@mapbox/mapbox-gl-draw";

const MapDraw = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const mapRef = useRef<Map | null>(null);

  const initializeDraw = (map: Map) => {
    const draw = new MapboxDraw({
      displayControlsDefault: true,
      controls: {
        polygon: true,
        trash: true,
      },
      defaultMode: "draw_polygon",
    });
    map.addControl(draw, "top-right");

    map.on("draw.create", (e) => console.log(e));
    map.on("draw.delete", (e) => console.log(e));
    map.on("draw.update", (e) => console.log(e));
  };

  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOXGL_ACCESSTOKEN;
    if (mapContainerRef.current === null) return;

    const map = new Map({
      ...MAP_CONFIG,
      container: mapContainerRef.current,
    });
    mapRef.current = map;

    initializeDraw(map);

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

export default MapDraw;
