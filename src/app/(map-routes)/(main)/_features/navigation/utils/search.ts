import { generateQueryStringFromDiff } from ".";
import { DEFAULT_NAVIGATION_STATE } from "../store";
import { SearchNavigationState } from "../store";

export const generateQueryStringFromSearch = (
  search: SearchNavigationState
) => {
  return generateQueryStringFromDiff(
    search,
    DEFAULT_NAVIGATION_STATE.search,
    "search"
  );
};
