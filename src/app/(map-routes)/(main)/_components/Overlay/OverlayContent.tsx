"use client";

import ProjectOverlay from "../ProjectOverlay";
import LayersOverlay from "../LayersOverlay";
import { AnimatePresence, motion } from "framer-motion";
import useOverlayTabsStore from "@/app/(map-routes)/(main)/_components/Overlay/OverlayTabs/store";
import SearchOverlay from "../SearchOverlay";
import usePanelsStore from "../Panels/store";
import { panelIdToComponent } from "../Panels/store";
const OverlayContent = () => {
  const appActiveTab = useOverlayTabsStore((state) => state.activeTab);
  const panelId = usePanelsStore((state) => state.panelId);
  let PanelComponent = null;

  let overlay = null;
  if (appActiveTab === "search") overlay = <SearchOverlay />;
  if (appActiveTab === "project") overlay = <ProjectOverlay />;
  if (appActiveTab === "layers") overlay = <LayersOverlay />;

  if (panelId) {
    PanelComponent = panelIdToComponent[panelId];
  }

  return (
    <AnimatePresence>
      {PanelComponent ? (
        <motion.div
          initial={{ opacity: 0, x: 100, filter: "blur(10px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, x: 100, filter: "blur(10px)" }}
        >
          <PanelComponent />
        </motion.div>
      ) : (
        overlay
      )}
    </AnimatePresence>
  );
};

export default OverlayContent;
