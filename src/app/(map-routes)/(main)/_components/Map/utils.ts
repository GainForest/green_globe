import { Map, MapMouseEvent } from "mapbox-gl";
import { addHistoricalSatelliteSourceAndLayers } from "./sources-and-layers/historical-satellite";
import {
  addAllSitesSourceAndLayer,
  addHighlightedSiteSourceAndLayer,
} from "./sources-and-layers/project-sites";
import {
  addMeasuredTreesSourceAndLayer,
  getTreeDateOfMeasurement,
  getTreeDBH,
  getTreeHeight,
  getTreePhotos,
  getTreeSpeciesName,
} from "./sources-and-layers/measured-trees";
import { addProjectMarkersSourceAndLayer } from "./sources-and-layers/project-markers";
import { NormalizedTreeFeature } from "../ProjectOverlay/store/types";
import { addLandcoverSourceAndLayer } from "./sources-and-layers/historical-satellite";
import { HoveredTreeOverlayState } from "../HoveredTreeOverlay/store";

export const addAllSourcesAndLayers = (map: Map) => {
  addHistoricalSatelliteSourceAndLayers(map);
  addLandcoverSourceAndLayer(map);
  addAllSitesSourceAndLayer(map);
  addHighlightedSiteSourceAndLayer(map);
  addMeasuredTreesSourceAndLayer(map);
  addProjectMarkersSourceAndLayer(map);
};

export const getTreeInformation = (
  e: MapMouseEvent,
  activeProjectId: string
): HoveredTreeOverlayState["treeInformation"] | null => {
  const features = e?.features;
  if (!features || features.length === 0) return null;

  const hoveredTreeFeature = features.find((feature) => {
    if (!feature.properties) return false;
    return (
      "type" in feature.properties &&
      feature.properties.type === "measured-tree"
    );
  }) as NormalizedTreeFeature | undefined;

  if (!hoveredTreeFeature) return null;

  const treeSpecies = getTreeSpeciesName(hoveredTreeFeature.properties);
  const treeCommonName = hoveredTreeFeature.properties?.commonName;
  const treeHeight = getTreeHeight(hoveredTreeFeature.properties);
  const treeDBH = getTreeDBH(hoveredTreeFeature.properties);
  const dateOfMeasurement = getTreeDateOfMeasurement(
    hoveredTreeFeature.properties
  );

  const fcdTreePhoto =
    hoveredTreeFeature.properties?.["FCD-tree_records-tree_photo"];

  const treeID =
    fcdTreePhoto?.split("?id=")?.[1] ||
    hoveredTreeFeature.properties?.ID ||
    "unknown";

  const treePhotos = getTreePhotos(
    hoveredTreeFeature.properties,
    activeProjectId,
    treeID
  );

  return {
    treeSpecies,
    treeCommonName,
    treeHeight,
    treeDBH,
    treePhotos,
    dateOfMeasurement,
  };
};
