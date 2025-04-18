"use client";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { create } from "zustand";
import { useRef } from "react";
import { getEASConfig } from "@/config/eas";
import { createEcocertAttestation } from "./utils";
import useEthersSigner from "@/app/_hooks/use-ethers-signer";
import tryCatch from "@/lib/try-catch";

export type EcocertAttestationData = {
  project_id: string;
  ecocert_id: string;
};

type EcocertAttestationCreationStatusCatalog = {
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

type EcocertAttestationCreationStatusKey =
  keyof EcocertAttestationCreationStatusCatalog;
type EcocertAttestationCreationStatus =
  EcocertAttestationCreationStatusCatalog[EcocertAttestationCreationStatusKey];

export type EcocertAttestationStoreState = {
  attestationData: EcocertAttestationData | null;
  creationStatus: EcocertAttestationCreationStatus;
};

export type EcocertAttestationStoreActions = {
  setAttestationData: (attestation: EcocertAttestationData | null) => void;
  setCreationStatus: (status: EcocertAttestationCreationStatus) => void;
};

const useEcocertAttestationStore = create<
  EcocertAttestationStoreState & EcocertAttestationStoreActions
>((set) => ({
  attestationData: null,
  creationStatus: {
    status: "idle",
  },
  setAttestationData: (attestation) => set({ attestationData: attestation }),
  setCreationStatus: (status) => set({ creationStatus: status }),
}));

const useEcocertAttestationCreation = () => {
  const stateAndActions = useEcocertAttestationStore();
  const {
    attestationData,
    creationStatus,
    setAttestationData,
    setCreationStatus,
  } = stateAndActions;

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
      setCreationStatus({
        status: "error",
        message: "The ecocert attestation was cancelled.",
      });
    } else {
      setCreationStatus({
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

  const startAttestationCreation = async () => {
    if (creationStatus.status === "loading") return;

    setCreationStatus({
      status: "loading",
      message: "Initializing...",
    });
    if (isCancelling()) return;

    if (!isConnected || !address || !signer) {
      setCreationStatus({
        status: "error",
        type: "wallet-not-connected",
        message: "Please connect your wallet to create an ecocert attestation.",
      });
      return;
    }
    if (isCancelling()) return;

    if (!chainId) {
      setCreationStatus({
        status: "error",
        type: "chain-not-supported",
        message: "Ecocert attestations are not supported on this chain.",
      });
      return;
    }
    if (isCancelling()) return;

    const easConfig = getEASConfig(Number(chainId));
    if (!easConfig) {
      setCreationStatus({
        status: "error",
        type: "chain-not-supported",
        message: "Ecocert attestations are not supported on this chain.",
      });
      return;
    }
    if (isCancelling()) return;

    if (!attestationData) {
      setCreationStatus({
        status: "error",
        message: "No data for attestation could be found. Please try again.",
      });
      return;
    }
    if (isCancelling()) return;

    setCreationStatus({
      status: "loading",
      message: "Preparing the transaction...",
    });

    if (isCancelling()) return;
    const [tx, error] = await tryCatch(() => {
      return createEcocertAttestation(signer, attestationData, easConfig);
    });
    if (isCancelling()) return;

    if (error) {
      if (error.message === "unsupported-chain") {
        setCreationStatus({
          status: "error",
          type: "chain-not-supported",
          message: "Ecocert attestations are not supported on this chain.",
        });
      } else if (error.message === "signer-not-found") {
        setCreationStatus({
          status: "error",
          type: "wallet-not-connected",
          message:
            "Please connect your wallet to create an ecocert attestation.",
        });
      } else {
        setCreationStatus({
          status: "error",
          message: "The transaction was rejected.",
        });
      }
      return;
    }

    if (!tx) {
      setCreationStatus({
        status: "error",
        message: "Something went wrong. Please try again.",
      });
      return;
    }

    console.log("txn", tx);
    if (isCancelling()) return;
    setCreationStatus({
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
      setCreationStatus({
        status: "error",
        message: "The transaction failed. Please try again.",
      });
      return;
    }

    setCreationStatus({
      status: "success",
      message: "The ecocert was attested successfully.",
      data: {
        attestationUid: txReceipt,
      },
    });
  };

  const stopAttestationCreation = (showError?: boolean) => {
    if (cancellationStatus.current.isCancelling) return;

    cancellationStatus.current.isCancelling = true;
    cancellationStatus.current.showError = showError ?? false;

    if (creationStatus.status !== "loading") {
      onStop();
      cancellationStatus.current = {
        isCancelling: false,
        showError: false,
      };
    } else {
      setCreationStatus({
        status: "cancelling",
        message: "Cancelling...",
      });
    }
  };

  const storeStatesToReturn = {
    attestationData,
    creationStatus,
  } satisfies EcocertAttestationStoreState;

  const storeActionsToReturn = {
    setAttestationData,
  } satisfies Partial<EcocertAttestationStoreActions>;

  const reset = () => {
    setCreationStatus({
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
    startAttestationCreation,
    stopAttestationCreation,
    reset,
  };
};

export default useEcocertAttestationCreation;
