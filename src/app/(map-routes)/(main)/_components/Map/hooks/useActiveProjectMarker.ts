import { useEffect } from "react";
import { featureCollectionToMarkerPosition } from "@/app/(map-routes)/_utils/globe-data";
import useIndexedOrganizations from "@/app/(map-routes)/(main)/_hooks/useIndexedOrganizations";
import useProjectOverlayStore from "../../ProjectOverlay/store";
import useMapStore from "../store";

const useActiveProjectMarker = () => {
  const highlightedPolygon = useMapStore((state) => state.highlightedPolygon);
  const mapRef = useMapStore((state) => state.mapRef);
  const mapLoaded = useMapStore((state) => state.mapLoaded);
  const projectId = useProjectOverlayStore((state) => state.projectId);
  const { organizations } = useIndexedOrganizations();

  useEffect(() => {
    const globe = mapRef?.current;
    if (!mapLoaded || !globe) return;

    if (!projectId || !highlightedPolygon) {
      globe.setActiveProjectMarker(null);
      return;
    }

    const markerPosition = featureCollectionToMarkerPosition(
      highlightedPolygon as unknown as GeoJSON.FeatureCollection,
    );

    if (!markerPosition) {
      globe.setActiveProjectMarker(null);
      return;
    }

    const organization = organizations?.find(
      (candidate) => candidate.did === projectId,
    );

    globe.setActiveProjectMarker({
      id: projectId,
      kind: "project-marker",
      lat: markerPosition.lat,
      lng: markerPosition.lng,
      label: organization?.info.name ?? "Selected project",
      did: projectId,
    });
  }, [highlightedPolygon, mapLoaded, mapRef, organizations, projectId]);
};

export default useActiveProjectMarker;
