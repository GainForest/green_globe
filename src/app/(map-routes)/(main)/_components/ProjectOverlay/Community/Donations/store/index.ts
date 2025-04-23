import { create } from "zustand";
import useProjectOverlayStore from "../../../store";
import { Payment, FiatPayment } from "./types";
import { fetchCryptoPayments, fetchFiatPayments } from "./utils";

type DataCatalog = {
  loading: {
    data: null;
    dataStatus: "loading";
  };
  error: {
    data: null;
    dataStatus: "error";
  };
  success: {
    data: (FiatPayment | Payment)[];
    dataStatus: "success";
  };
};

type DataVariant = DataCatalog[keyof DataCatalog];

type DonationsState = {
  projectId: string | null;
} & DataVariant;

type DonationsActions = {
  fetchData: () => Promise<void>;
};

const useDonationsStore = create<DonationsState & DonationsActions>(
  (set, get) => ({
    data: null,
    projectId: null,
    dataStatus: "loading",
    fetchData: async () => {
      const projectId = useProjectOverlayStore.getState().projectId;
      if (!projectId) return;

      if (projectId === get().projectId && get().dataStatus === "success") {
        return;
      }

      set({ projectId, dataStatus: "loading", data: null });

      try {
        const projectData = useProjectOverlayStore.getState().projectData;
        if (!projectData) {
          set({ data: null, dataStatus: "error" });
          return;
        }

        const [cryptoPayments, fiatPayments] = await Promise.all([
          fetchCryptoPayments(projectData),
          fetchFiatPayments(projectData),
        ]);

        if (projectId === get().projectId) {
          set({
            data: [...cryptoPayments, ...fiatPayments].sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime()
            ),
            dataStatus: "success",
          });
        }
      } catch (error) {
        console.error(error);
        set({ data: null, dataStatus: "error" });
      }
    },
  })
);

export default useDonationsStore;
