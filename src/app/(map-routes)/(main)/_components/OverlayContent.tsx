"use client";

import ProjectOverlay from "./ProjectOverlay";
import LayersOverlay from "./LayersOverlay";
import { AnimatePresence } from "framer-motion";
import useOverlayTabsStore from "@/app/(map-routes)/(main)/_components/Overlay/OverlayTabs/store";
import SearchOverlay from "./SearchOverlay";
const OverlayContent = () => {
  const appActiveTab = useOverlayTabsStore((state) => state.activeTab);

  let overlay = null;
  if (appActiveTab === "search") overlay = <SearchOverlay />;
  if (appActiveTab === "project") overlay = <ProjectOverlay />;
  if (appActiveTab === "layers") overlay = <LayersOverlay />;

  return <AnimatePresence>{overlay}</AnimatePresence>;
};

export default OverlayContent;
