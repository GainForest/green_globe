import { create } from "zustand";
import { Feature } from "@/app/(map-routes)/_types/map";
import useNavigation from "@/app/(map-routes)/(main)/_features/navigation/use-navigation";
export type SearchOverlayState = {
  allProjects: Feature[];
  searchQuery: string;
};

export type SearchOverlayActions = {
  setSearchQuery: (
    searchQuery: string,
    navigate?: ReturnType<typeof useNavigation>
  ) => void;
  setAllProjects: (projects: Feature[]) => void;
};

const initialState: SearchOverlayState = {
  searchQuery: "",
  allProjects: [],
};

const useSearchOverlayStore = create<SearchOverlayState & SearchOverlayActions>(
  (set) => {
    return {
      ...initialState,
      setSearchQuery: (searchQuery, navigate) => {
        set({ searchQuery });
        navigate?.((draft) => {
          draft.search["q"] = searchQuery;
        });
      },
      setAllProjects: (projects) => set({ allProjects: projects }),
    };
  }
);

export default useSearchOverlayStore;
