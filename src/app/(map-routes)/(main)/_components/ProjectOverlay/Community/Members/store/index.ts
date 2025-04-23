import { create } from "zustand";
import { CommunityMember } from "./types";
import useProjectOverlayStore from "@/app/(map-routes)/(main)/_components/ProjectOverlay/store";
import { fetchCommunityMembers } from "./utils";
type Data = {
  members: CommunityMember[];
};

type DataCatalog = {
  loading: {
    data: null;
    dataStatus: "loading";
  };
  success: {
    data: Data;
    dataStatus: "success";
  };
  error: {
    data: null;
    dataStatus: "error";
  };
};

type DataVariant = DataCatalog[keyof DataCatalog];

export type CommunityMembersState = {
  projectId: string | null;
} & DataVariant;

export type CommunityMembersActions = {
  fetchData: () => Promise<void>;
};

const useCommunityMembersStore = create<
  CommunityMembersState & CommunityMembersActions
>((set, get) => ({
  data: null,
  projectId: null,
  dataStatus: "loading",
  fetchData: async () => {
    const projectId = useProjectOverlayStore.getState().projectId;
    if (!projectId) return;

    // Do not fetch data if the projectId is the same and the data is already loaded
    if (projectId === get().projectId && get().dataStatus === "success") {
      return;
    }

    set({ projectId, dataStatus: "loading", data: null });
    try {
      const membersPromise = fetchCommunityMembers(projectId);
      const allPromises = [membersPromise];
      const [members] = await Promise.all(allPromises);

      if (projectId === get().projectId) {
        set({ data: { members: members || [] }, dataStatus: "success" });
      }
    } catch (error) {
      console.error(error);
      set({ data: null, dataStatus: "error" });
    }
  },
}));

export default useCommunityMembersStore;
