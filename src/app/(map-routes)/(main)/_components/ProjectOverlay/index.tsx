"use client";
import React from "react";
import { motion } from "framer-motion";
import CoverImage from "./CoverImage";
import Loading from "./loading";
import Header from "./Header";
import TabMapper from "./TabMapper";
import useProjectOverlayStore from "./store";
import useBlurAnimate from "../../_hooks/useBlurAnimate";
import ErrorMessage from "./ErrorMessage";
import { trpcApi } from "@/components/providers/TRPCProvider";
import { allowedPDSDomains } from "@/config/climateai-sdk";

const ProjectOverlay = () => {
  const organizationDid = useProjectOverlayStore((state) => state.projectId);

  const {
    data: info,
    isPending,
    error,
    isPlaceholderData,
  } = trpcApi.gainforest.organization.info.get.useQuery({
    did: organizationDid ?? "",
    pdsDomain: allowedPDSDomains[0],
  });

  const { animate, onAnimationComplete } = useBlurAnimate(
    { opacity: 1, scale: 1, filter: "blur(0px)" },
    { opacity: 1, scale: 1, filter: "unset" }
  );

  // This should never happen
  if (!organizationDid) return null;

  return (
    <motion.div
      id="project-overlay"
      initial={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
      animate={animate}
      exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
      onAnimationComplete={onAnimationComplete}
      className="relative h-full w-full"
    >
      <div className="absolute inset-0 scrollable overflow-y-auto overflow-x-hidden scrollbar-variant-1 flex flex-col">
        {isPending || isPlaceholderData ?
          <Loading />
        : error || !info ?
          <div className="p-4">
            <ErrorMessage
              message={
                <p className="flex flex-col items-center text-center">
                  <span className="text-lg font-bold">
                    Failed to load project.
                  </span>
                  <span>Please check URL and retry.</span>
                </p>
              }
            />
          </div>
        : <div className="w-full relative flex flex-col flex-1">
            <CoverImage
              organization={info.value}
              did={organizationDid}
              pdsDomain={allowedPDSDomains[0]}
            />
            <Header organization={info.value} />
            <div className="flex flex-col gap-2 p-4 -translate-y-20 flex-1 -mb-20">
              <TabMapper organization={info.value} />
            </div>
          </div>
        }
      </div>
    </motion.div>
  );
};

export default ProjectOverlay;
