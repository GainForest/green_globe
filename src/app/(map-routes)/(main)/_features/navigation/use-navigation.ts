import useNavigationStore, { NavigationState } from "./store";
import { useRouter } from "next/navigation";
import { generateQueryStringFromOverlay } from "./utils/overlay";
import { generateQueryStringFromLayers } from "./utils/layers";
import { generateQueryStringFromSearch } from "./utils/search";
import { generateQueryStringFromProject } from "./utils/project";
import { generateQueryStringFromMap } from "./utils/map";
import { produce } from "immer";

const useNavigation = () => {
  const router = useRouter();

  const navigate = (
    state: Partial<NavigationState> | ((draft: NavigationState) => void)
  ) => {
    const { overlay, layers, search, project, map } = useNavigationStore.getState();
    const currentState: NavigationState = {
      overlay,
      layers,
      search,
      project,
      map,
    };

    const newState =
      typeof state === "function" ?
        produce(currentState, state)
      : produce(currentState, (draft) => {
          Object.assign(draft, state);
        });

    useNavigationStore.getState().updateNavigationState(newState);

    const {
      overlay: nextOverlay,
      layers: nextLayers,
      search: nextSearch,
      project: nextProject,
      map: nextMap,
    } = newState;

    const overlayQueryString = generateQueryStringFromOverlay(nextOverlay);
    const layersQueryString = generateQueryStringFromLayers(nextLayers);
    const searchQueryString = generateQueryStringFromSearch(nextSearch);
    const projectQueryString = generateQueryStringFromProject(nextProject);
    const mapQueryString = generateQueryStringFromMap(nextMap);

    const queryString = [
      overlayQueryString,
      layersQueryString,
      searchQueryString,
      projectQueryString,
      mapQueryString,
    ]
      .filter((str) => str.trim() !== "")
      .join("&");

    if (nextProject === null) {
      router.push(`/?${queryString}`);
    } else {
      router.push(`/${nextProject["project-id"]}?${queryString}`);
    }
  };

  return navigate;
};

export default useNavigation;
