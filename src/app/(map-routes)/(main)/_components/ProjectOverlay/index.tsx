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
import { PDS_ENDPOINT } from "@/config/atproto";
import { BlobRef } from "@atproto/api";
import useOrganizationInfo from "./hooks/useOrganizationInfo";

const ProjectOverlay = () => {
  const organizationDid = useProjectOverlayStore((state) => state.projectId);

  const { organizationInfo, organizationInfoError } = useOrganizationInfo(
    organizationDid ?? undefined
  );

  const { animate, onAnimationComplete } = useBlurAnimate(
    { opacity: 1, scale: 1, filter: "blur(0px)" },
    { opacity: 1, scale: 1, filter: "unset" }
  );

  const coverImage = organizationInfo?.coverImage;
  const coverImageCID = coverImage ? (coverImage as BlobRef).ref : null;
  const coverImageUrl =
    coverImageCID ?
      `${PDS_ENDPOINT}/xrpc/com.atProto.sync.getBlob?did=${organizationDid}&cid=${coverImageCID}`
    : "/assets/placeholders/cover-image.png";

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
        {organizationInfo === undefined ?
          <Loading />
        : organizationInfoError ?
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
              imageURL={coverImageUrl}
              projectDetails={organizationInfo}
            />
            <Header organization={organizationInfo} />
            <div className="flex flex-col gap-2 p-4 -translate-y-20 flex-1 -mb-20">
              <TabMapper organization={organizationInfo} />
            </div>
          </div>
        }
      </div>
    </motion.div>
  );
};

export default ProjectOverlay;
