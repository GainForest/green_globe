import { generateQueryStringFromDiff } from ".";
import { DEFAULT_NAVIGATION_STATE, OverlayNavigationState } from "../store";

export const generateQueryStringFromOverlay = (
  overlay: OverlayNavigationState
) => {
  return generateQueryStringFromDiff(
    overlay,
    DEFAULT_NAVIGATION_STATE.overlay,
    "overlay"
  );
};
