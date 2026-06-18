import type { GlobeHtmlDatum } from "./globe-data";
import { OrganizationPoints } from "../_types/map";

export const fetchProjectSites = async (): Promise<OrganizationPoints> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_AWS_STORAGE}/shapefiles/gainforest-all-shapefiles.geojson`,
    );
    const projects: OrganizationPoints = await response.json();
    return projects;
  } catch (error) {
    console.error("Error fetching projects", error);
    return { type: "FeatureCollection", features: [] };
  }
};

export const organizationPointsToGlobeMarkers = (
  projectSites: OrganizationPoints,
): GlobeHtmlDatum[] =>
  projectSites.features.map((feature) => ({
    id: feature.properties.did,
    kind: "project-marker",
    lng: feature.geometry.coordinates[0],
    lat: feature.geometry.coordinates[1],
    label: feature.properties.name,
    did: feature.properties.did,
  }));
