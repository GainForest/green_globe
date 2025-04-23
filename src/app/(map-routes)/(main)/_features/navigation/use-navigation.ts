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
    const currentState = useNavigationStore.getState();

    // Create new state using Immer without updating the store
    const newState =
      typeof state === "function"
        ? produce(currentState, state)
        : produce(currentState, (draft) => {
            Object.assign(draft, state);
          });

    const { overlay, layers, search, project, map } = newState;

    const overlayQueryString = generateQueryStringFromOverlay(overlay);
    const layersQueryString = generateQueryStringFromLayers(layers);
    const searchQueryString = generateQueryStringFromSearch(search);
    const projectQueryString = generateQueryStringFromProject(project);
    const mapQueryString = generateQueryStringFromMap(map);

    const queryString = [
      overlayQueryString,
      layersQueryString,
      searchQueryString,
      projectQueryString,
      mapQueryString,
    ]
      .filter((str) => str.trim() !== "")
      .join("&");

    if (project === null) {
      router.push(`/?${queryString}`);
    } else {
      router.push(`/${project["project-id"]}?${queryString}`);
    }
  };

  return navigate;
};

export default useNavigation;
