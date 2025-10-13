"use client";
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import Splash from "./Splash";
import Loading from "./loading";
import Header from "./Header";
import TabMapper from "./TabMapper";
import useProjectOverlayStore from "./store";
import useBlurAnimate from "../../_hooks/useBlurAnimate";
import ErrorMessage from "./ErrorMessage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import getRecord from "@/lib/atproto/getRecord";
import { validateRecord } from "@/../lexicon-api/types/app/gainforest/organization/info";
import { AppGainforestOrganizationInfo } from "@/../lexicon-api";

const ProjectOverlay = () => {
  const organizationDid = useProjectOverlayStore((state) => state.projectId);

  const queryKey = ["app.gainforest.organization.info", organizationDid];
  const queryClient = useQueryClient();
  const {
    data: info,
    isPending,
    error,
  } = useQuery({
    queryKey: queryKey,
    queryFn: async () => {
      const data = await getRecord(
        organizationDid ?? "",
        "app.gainforest.organization.info",
        "self",
        validateRecord
      );
      return data as AppGainforestOrganizationInfo.Record;
    },
    enabled: !!organizationDid,
  });

  useEffect(() => {
    return () => {
      queryClient.invalidateQueries({ queryKey });
    };
  }, [queryKey]);

  const { animate, onAnimationComplete } = useBlurAnimate(
    { opacity: 1, scale: 1, filter: "blur(0px)" },
    { opacity: 1, scale: 1, filter: "unset" }
  );

  const splashImageURL = null;

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
        {isPending ?
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
            <Splash imageURL={splashImageURL} projectDetails={info} />
            <Header organization={info} />
            <div className="flex flex-col gap-2 p-4 -translate-y-20 flex-1 -mb-20">
              <TabMapper organization={info} />
            </div>
          </div>
        }
      </div>
    </motion.div>
  );
};

export default ProjectOverlay;
