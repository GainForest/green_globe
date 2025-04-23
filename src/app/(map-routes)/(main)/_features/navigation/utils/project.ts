import useProjectOverlayStore, {
  PROJECT_OVERLAY_TABS,
} from "@/app/(map-routes)/(main)/_components/ProjectOverlay/store";
import { generateQueryStringFromDiff, verifyKeyType } from ".";
import { ProjectNavigationState } from "../store";
import useBiodiversityStore from "@/app/(map-routes)/(main)/_components/ProjectOverlay/Biodiversity/store";
import useBiodiversityPredictionsStore from "@/app/(map-routes)/(main)/_components/ProjectOverlay/Biodiversity/Predictions/store";
import useCommunityStore from "@/app/(map-routes)/(main)/_components/ProjectOverlay/Community/store";

export const generateQueryStringFromProject = (
  project: ProjectNavigationState | null
) => {
  if (project === null) {
    return "";
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { "project-id": projectId, ...rest } = project;
  return generateQueryStringFromDiff(
    rest,
    {
      views: ["info"],
    },
    "project"
  );
};

export const generateViewsArrayFromDedicatedStores = () => {
  const view0 = useProjectOverlayStore.getState().activeTab;
  const views: string[] = [view0];
  if (view0 !== "biodiversity" && view0 !== "community") {
    return views;
  }

  if (view0 === "biodiversity") {
    const tab = useBiodiversityStore.getState().activeTab;
    views.push(tab);
    if (tab === "predictions") {
      const subTab = useBiodiversityPredictionsStore.getState().page;
      if (subTab) {
        views.push(subTab);
      }
    }
    return views;
  }

  if (view0 === "community") {
    const tab = useCommunityStore.getState().activeTab;
    views.push(tab);
    return views;
  }

  return views;
};

export const updateDedicatedStoresFromViews = (views: string[]) => {
  const view0 = views.length > 0 ? views[0] : null;
  if (!view0) return;

  const isValidProjectOverlayTab = verifyKeyType(view0, PROJECT_OVERLAY_TABS);
  if (!isValidProjectOverlayTab) return;
  useProjectOverlayStore.getState().setActiveTab(view0);

  if (view0 !== "biodiversity") return;

  const view1 = views.length > 1 ? views[1] : null;
  if (!view1) return;
  const isValidBiodiversityTab = verifyKeyType(view1, [
    "predictions",
    "observations",
  ] as const);
  if (!isValidBiodiversityTab) return;
  useBiodiversityStore.getState().setActiveTab(view1);
};
