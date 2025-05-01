"use client";

import { Button } from "@/components/ui/button";
import { CircleAlert, GalleryVerticalEnd, RotateCcw } from "lucide-react";
import React from "react";
import usePanelsStore from "../../Panels/store";
import { useQuery } from "@tanstack/react-query";
import useProjectOverlayStore from "../store";
import { fetchEcocertsByProject } from "@/graphql/eas/queries/ecocerts-by-project";
import { motion } from "framer-motion";
import EcocertSkeleton from "./EcocertSkeleton";
import EcocertsList from "./EcocertsList";
import LinkEcocertButton from "./LinkEcocertButton";

const Ecocerts = () => {
  const setPanelId = usePanelsStore((state) => state.setPanelId);
  const setBackButtonText = usePanelsStore((state) => state.setBackButtonText);
  const projectId = useProjectOverlayStore((state) => state.projectId);

  const {
    data: ecocertLinkings,
    isLoading: ecocertLinkingsLoading,
    error: ecocertLinkingsFetchError,
    refetch,
  } = useQuery({
    queryKey: ["ecocert-attestations-by-project", projectId],
    queryFn: async () => {
      if (!projectId)
        throw new Error(
          "Project could not be found. Please select a project first."
        );
      const attestations = await fetchEcocertsByProject(projectId);
      if (attestations === null)
        throw new Error("Ecocerts for this project could not be fetched.");
      return attestations;
    },
  });

  const handleLinkEcocertButtonClick = () => {
    setPanelId("ecocert-linking");
    setBackButtonText("Ecocerts");
  };

  // Loading State:
  if (ecocertLinkingsLoading) {
    <motion.div
      className="flex flex-col gap-2"
      initial={{ opacity: 0, filter: "blur(10px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      exit={{
        opacity: 0,
        filter: "blur(10px)",
      }}
    >
      {new Array(4).fill(0).map((_, index) => {
        return <EcocertSkeleton key={index} index={index} />;
      })}
    </motion.div>;
  }

  // Error State:
  if (ecocertLinkingsFetchError || ecocertLinkings === undefined) {
    return (
      <motion.div
        className="flex flex-col gap-2"
        initial={{ opacity: 0, filter: "blur(10px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        exit={{
          opacity: 0,
          filter: "blur(10px)",
        }}
      >
        <div className="p-4 text-center text-balance">
          <div className="flex items-center justify-center mb-1">
            <CircleAlert className="opacity-50" size={32} />
          </div>
          <span className="text-foreground font-bold text-lg">
            {"Unable to fetch ecocerts."}
          </span>
          <br />
          <span className="text-sm text-muted-foreground">
            We could not fetch ecocerts linked to this project. Please try
            again.
          </span>
          <Button size={"sm"} onClick={() => refetch()}>
            <RotateCcw size={16} />
            Retry
          </Button>
        </div>
      </motion.div>
    );
  }

  if (ecocertLinkings.length > 0) {
    return (
      <EcocertsList
        ecocertAttestations={ecocertLinkings}
        onLinkEcocertButtonClick={handleLinkEcocertButtonClick}
      />
    );
  }

  return (
    <div className="w-full flex flex-col items-center p-4 gap-4">
      <GalleryVerticalEnd
        size={80}
        className="text-muted-foreground opacity-50"
      />
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center">
          <span className="font-bold text-lg text-center text-balance">
            No Ecocerts found.
          </span>
          <span className="text-sm text-muted-foreground text-center text-balance">
            There are no Ecocerts associated with this project.
          </span>
        </div>
        <LinkEcocertButton onClick={handleLinkEcocertButtonClick} />
      </div>
    </div>
  );
};

export default Ecocerts;
