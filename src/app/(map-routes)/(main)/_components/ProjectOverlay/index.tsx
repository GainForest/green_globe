"use client";
import React from "react";
import { motion } from "framer-motion";
import Splash from "./Splash";
import Loading from "./loading";
import Header from "./Header";
import TabMapper from "./TabMapper";
import useProjectOverlayStore from "./store";
import { getProjectSplashImageURLFromProject } from "./store/utils";
import useBlurAnimate from "../../_hooks/useBlurAnimate";
import ErrorMessage from "./ErrorMessage";
const ProjectOverlay = () => {
  const projectDataStatus = useProjectOverlayStore(
    (state) => state.projectDataStatus
  );
  const projectData = useProjectOverlayStore((state) => state.projectData);
  const { animate, onAnimationComplete } = useBlurAnimate(
    { opacity: 1, scale: 1, filter: "blur(0px)" },
    { opacity: 1, scale: 1, filter: "unset" }
  );

  const splashImageURL = projectData
    ? getProjectSplashImageURLFromProject(projectData)
    : null;

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
        {projectDataStatus === "loading" ? (
          <Loading />
        ) : projectDataStatus === "error" || projectData === null ? (
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
        ) : (
          <div className="w-full relative flex flex-col flex-1">
            <Splash imageURL={splashImageURL} projectDetails={projectData} />
            <Header projectData={projectData} />
            <div className="flex flex-col gap-2 p-4 -translate-y-20 flex-1 -mb-20">
              <TabMapper projectData={projectData} />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProjectOverlay;
