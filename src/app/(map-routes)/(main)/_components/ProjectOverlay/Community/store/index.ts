import { create } from "zustand";

type CommunityState = {
  activeTab: "members" | "donations";
};

type CommunityActions = {
  setActiveTab: (tab: CommunityState["activeTab"]) => void;
};

const useCommunityStore = create<CommunityState & CommunityActions>((set) => ({
  activeTab: "members",
  setActiveTab: (tab) => set({ activeTab: tab }),
}));

export default useCommunityStore;
