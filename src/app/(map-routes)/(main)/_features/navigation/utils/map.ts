import { generateQueryStringFromDiff } from ".";
import { DEFAULT_NAVIGATION_STATE, MapNavigationState } from "../store";

export const generateQueryStringFromMap = (map: MapNavigationState) => {
  return generateQueryStringFromDiff(map, DEFAULT_NAVIGATION_STATE.map, "map");
};
