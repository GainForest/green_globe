"use client";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { create } from "zustand";
import { useRef } from "react";
import { getEASConfig } from "@/config/eas";
import { linkEcocert } from "./utils";
import useEthersSigner from "@/app/_hooks/use-ethers-signer";
import tryCatch from "@/lib/try-catch";

export type EcocertLinkingData = {
  project_id: string;
  ecocert_id: string;
};

type EcocertLinkingStatusCatalog = {
  idle: {
    status: "idle";
  };
  loading: {
    status: "loading";
    message: string;
  };
  success: {
    status: "success";
    message: string;
    data: {
      attestationUid: string;
    };
  };
  cancelling: {
    status: "cancelling";
    message: string;
  };
  error: {
    status: "error";
    type?: "wallet-not-connected" | "chain-not-supported";
    message: string;
  };
};

type EcocertLinkingStatusKey = keyof EcocertLinkingStatusCatalog;
type EcocertLinkingStatus =
  EcocertLinkingStatusCatalog[EcocertLinkingStatusKey];

export type EcocertLinkingStoreState = {
  linkingData: EcocertLinkingData | null;
  linkingStatus: EcocertLinkingStatus;
};

export type EcocertLinkingStoreActions = {
  setLinkingData: (linkingData: EcocertLinkingData | null) => void;
  setLinkingStatus: (status: EcocertLinkingStatus) => void;
};

const useEcocertLinkingStore = create<
  EcocertLinkingStoreState & EcocertLinkingStoreActions
>((set) => ({
  linkingData: null,
  linkingStatus: {
    status: "idle",
  },
  setLinkingData: (linkingData) => {
    set({ linkingData });
  },
  setLinkingStatus: (linkingStatus) => set({ linkingStatus }),
}));

const useEcocertLinking = () => {
  const stateAndActions = useEcocertLinkingStore();
  const { linkingData, linkingStatus, setLinkingData, setLinkingStatus } =
    stateAndActions;

  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();

  const signer = useEthersSigner({
    chainId: chainId ? Number(chainId) : undefined,
  });

  const cancellationStatus = useRef({
    isCancelling: false,
    showError: false,
  });

  const onStop = (showError?: boolean) => {
    if (showError) {
      setLinkingStatus({
        status: "error",
        message: "The ecocert linking was cancelled.",
      });
    } else {
      setLinkingStatus({
        status: "idle",
      });
    }
    cancellationStatus.current = {
      isCancelling: false,
      showError: false,
    };
  };

  const isCancelling = () => {
    if (cancellationStatus.current.isCancelling) {
      onStop(cancellationStatus.current.showError);
      return true;
    } else {
      return false;
    }
  };

  const startLinking = async (newLinkingData?: EcocertLinkingData) => {
    if (linkingStatus.status === "loading") return;

    setLinkingStatus({
      status: "loading",
      message: "Initializing...",
    });
    if (isCancelling()) return;

    if (!isConnected || !address || !signer) {
      setLinkingStatus({
        status: "error",
        type: "wallet-not-connected",
        message: "Please connect your wallet to link an ecocert.",
      });
      return;
    }
    if (isCancelling()) return;

    if (!chainId) {
      setLinkingStatus({
        status: "error",
        type: "chain-not-supported",
        message: "Linking ecocerts are not supported on this chain.",
      });
      return;
    }
    if (isCancelling()) return;

    const easConfig = getEASConfig(Number(chainId));
    if (!easConfig) {
      setLinkingStatus({
        status: "error",
        type: "chain-not-supported",
        message: "Linking ecocerts are not supported on this chain.",
      });
      return;
    }
    if (isCancelling()) return;

    const dataToUse = newLinkingData ?? linkingData;
    if (!dataToUse) {
      setLinkingStatus({
        status: "error",
        message:
          "No data for linking the ecocert could be found. Please try again.",
      });
      return;
    }
    if (isCancelling()) return;

    setLinkingStatus({
      status: "loading",
      message: "Preparing the transaction...",
    });

    if (isCancelling()) return;
    const [tx, error] = await tryCatch(() => {
      return linkEcocert(signer, dataToUse, easConfig);
    });
    if (isCancelling()) return;

    if (error) {
      if (error.message === "unsupported-chain") {
        setLinkingStatus({
          status: "error",
          type: "chain-not-supported",
          message: "Linking ecocerts are not supported on this chain.",
        });
      } else if (error.message === "signer-not-found") {
        setLinkingStatus({
          status: "error",
          type: "wallet-not-connected",
          message: "Please connect your wallet to link an ecocert.",
        });
      } else {
        setLinkingStatus({
          status: "error",
          message: "The transaction was rejected.",
        });
      }
      return;
    }

    if (!tx) {
      setLinkingStatus({
        status: "error",
        message: "Something went wrong. Please try again.",
      });
      return;
    }

    console.log("txn", tx);
    if (isCancelling()) return;
    setLinkingStatus({
      status: "loading",
      message:
        "Please sign the transaction and wait for the transaction to be confirmed...",
    });
    const [txReceipt, txReceiptError] = await tryCatch(async () => {
      return await tx.wait();
    });
    if (isCancelling()) return;

    if (txReceiptError) {
      console.error(txReceiptError);
      setLinkingStatus({
        status: "error",
        message: "The transaction failed. Please try again.",
      });
      return;
    }

    setLinkingStatus({
      status: "success",
      message: "The ecocert was linked successfully.",
      data: {
        attestationUid: txReceipt,
      },
    });
  };

  const stopLinking = (showError?: boolean) => {
    if (cancellationStatus.current.isCancelling) return;

    cancellationStatus.current.isCancelling = true;
    cancellationStatus.current.showError = showError ?? false;

    if (linkingStatus.status !== "loading") {
      onStop();
      cancellationStatus.current = {
        isCancelling: false,
        showError: false,
      };
    } else {
      setLinkingStatus({
        status: "cancelling",
        message: "Cancelling...",
      });
    }
  };

  const storeStatesToReturn = {
    linkingData: linkingData,
    linkingStatus: linkingStatus,
  } satisfies EcocertLinkingStoreState;

  const storeActionsToReturn = {
    setLinkingData: setLinkingData,
  } satisfies Partial<EcocertLinkingStoreActions>;

  const reset = () => {
    setLinkingStatus({
      status: "idle",
    });
    cancellationStatus.current = {
      isCancelling: false,
      showError: false,
    };
  };

  return {
    ...storeStatesToReturn,
    ...storeActionsToReturn,
    startLinking,
    stopLinking,
    reset,
  };
};

export default useEcocertLinking;
