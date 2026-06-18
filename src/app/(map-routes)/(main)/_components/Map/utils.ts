import {
  getTreeDateOfMeasurement,
  getTreeDBH,
  getTreeHeight,
  getTreePhotos,
  getTreeRootCollarDiameter,
  getTreeSpeciesName,
} from "./sources-and-layers/measured-trees";
import type { NormalizedTreeFeature } from "../ProjectOverlay/store/types";
import type { HoveredTreeOverlayState } from "../HoveredTreeOverlay/store";

export const getTreeInformationFromFeature = (
  hoveredTreeFeature: NormalizedTreeFeature | undefined,
  activeProjectId: string,
): HoveredTreeOverlayState["treeInformation"] | null => {
  if (!hoveredTreeFeature?.properties) return null;

  const treeSpecies = getTreeSpeciesName(hoveredTreeFeature.properties);
  const treeCommonName = hoveredTreeFeature.properties?.commonName;
  const treeHeight = getTreeHeight(hoveredTreeFeature.properties);
  const treeDBH = getTreeDBH(hoveredTreeFeature.properties);
  const treeRootCollarDiameter = getTreeRootCollarDiameter(
    hoveredTreeFeature.properties,
  );
  const dateOfMeasurement = getTreeDateOfMeasurement(
    hoveredTreeFeature.properties,
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
    treeID,
  );

  return {
    treeUri: hoveredTreeFeature.properties.occurrenceUri,
    treeSpecies,
    treeCommonName,
    treeHeight,
    treeDBH,
    treeRootCollarDiameter,
    treePhotos,
    dateOfMeasurement,
  };
};
