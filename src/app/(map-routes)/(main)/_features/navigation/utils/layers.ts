import { generateQueryStringFromDiff } from ".";
import { DEFAULT_NAVIGATION_STATE, LayersNavigationState } from "../store";

export const generateQueryStringFromLayers = (
  layers: LayersNavigationState
) => {
  return generateQueryStringFromDiff(
    layers,
    DEFAULT_NAVIGATION_STATE.layers,
    "layers"
  );
};
