import { GeoJSONSource, Map, Popup, MapMouseEvent } from "mapbox-gl";
import { ProjectSitePoints } from "../_types/map";

export const spinGlobe = (map: Map, spinEnabled: boolean) => {
  const secondsPerRevolution = 120;
  // Above zoom level 5, do not rotate.
  const maxSpinZoom = 5;
  // Rotate at intermediate speeds between zoom levels 3 and 5.
  const slowSpinZoom = 3;

  const userInteracting = false;

  if (map) {
    const zoom = map.getZoom();
    if (spinEnabled && !userInteracting && zoom < maxSpinZoom) {
      let distancePerSecond = 360 / secondsPerRevolution;
      if (zoom > slowSpinZoom) {
        // Slow spinning at higher zooms
        const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
        distancePerSecond *= zoomDif;
      }
      const center = map.getCenter();
      center.lng -= distancePerSecond;
      // Smoothly animate the map over one second.
      // When this animation is complete, it calls a 'moveend' event.
      map.easeTo({ center, duration: 1000, easing: (n) => n });
    }
  }
};

export const fetchProjectSites = async (): Promise<ProjectSitePoints> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_AWS_STORAGE}/shapefiles/gainforest-all-shapefiles.geojson`
    );
    const projects: ProjectSitePoints = await response.json();
    return projects;
  } catch (error) {
    console.error("Error fetching projects", error);
    return { type: "FeatureCollection", features: [] };
  }
};

export const setProjectMarkers = async (map: Map) => {
  try {
    const projectSites = await fetchProjectSites();

    const source = map.getSource("projectMarkerSource") as GeoJSONSource;
    source?.setData(projectSites);
  } catch (error) {
    console.error("Error setting project markers", error);
  }
};

export const addProjectMarkerHandlers = (
  map: Map,
  onClick: (projectId: string) => void
) => {
  const popup = new Popup({
    closeButton: false,
    closeOnClick: false,
  });

  map.on("mousemove", "projectMarkerLayer", (e: MapMouseEvent) => {
    // Change the cursor style as a UI indicator.
    map.getCanvas().style.cursor = "pointer";
    const features = e.features as ProjectSitePoints["features"] | undefined;
    if (!features || features.length === 0) return;

    // Copy coordinates array.
    const coordinates = features[0].geometry.coordinates.slice() as [
      number,
      number
    ];
    const description = features[0].properties.name;

    // Ensure that if the map is zoomed out such that multiple
    // copies of the feature are visible, the popup appears
    // over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    // Populate the popup and set its coordinates
    // based on the feature found.
    popup
      .setOffset({ bottom: [0, -20] })
      .setLngLat(coordinates)
      .setHTML(description)
      .addTo(map);
  });

  map.on("click", "projectMarkerLayer", (e: MapMouseEvent) => {
    const features = e.features as ProjectSitePoints["features"] | undefined;
    if (!features || features.length === 0) return;
    const projectId = features[0].properties.projectId;
    onClick(projectId);
  });

  map.on("mouseleave", "projectMarkerLayer", () => {
    map.getCanvas().style.cursor = "";
    popup.remove();
  });
};
