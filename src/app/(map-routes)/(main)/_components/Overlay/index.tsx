"use client";

import UIBase from "@/components/ui/ui-base";
import React from "react";
import OverlayTabs from "./OverlayTabs";
import OverlayContent from "./OverlayContent";
import Header from "./Header";
import { ChevronLeft, Maximize2, Minimize2, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import useSidebarStore from "./store";
import { cn } from "@/lib/utils";
import useProjectOverlayStore from "../ProjectOverlay/store";
import useOverlayTabsStore from "./OverlayTabs/store";
import { Button } from "@/components/ui/button";
import ShareDialog from "../ShareDialog";
import usePanelsStore from "../Panels/store";

const SIDEBAR_WIDTH = 500;

const Sidebar = () => {
  const isOpen = useSidebarStore((state) => state.isOpen);
  const setIsOpen = useSidebarStore((state) => state.setIsOpen);

  const panelId = usePanelsStore((state) => state.panelId);
  const backButtonText = usePanelsStore((state) => state.backButtonText);
  const onBackButtonClick = usePanelsStore((state) => state.onBackButtonClick);

  const projectData = useProjectOverlayStore((state) => state.projectData);
  const isMaximized = useProjectOverlayStore((state) => state.isMaximized);
  const setIsMaximized = useProjectOverlayStore(
    (state) => state.setIsMaximized
  );

  const activeOverlayTab = useOverlayTabsStore((state) => state.activeTab);
  const computedSidebarWidth =
    isMaximized && activeOverlayTab === "project"
      ? "50vw"
      : `${SIDEBAR_WIDTH}px`;

  return (
    <motion.div
      className="fixed top-2 left-2 bottom-2 flex items-start gap-2"
      initial={{ opacity: 0, x: `-${computedSidebarWidth}` }}
      animate={{ opacity: 1, x: isOpen ? 0 : `-${computedSidebarWidth}` }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="h-full p-0"
        animate={{
          width: computedSidebarWidth,
        }}
      >
        <UIBase
          className="w-full h-full p-0"
          innerClassName="flex flex-col w-full h-full p-0 overflow-scroll"
        >
          <div className="sticky top-0 flex flex-col gap-4 p-4 border-b border-b-border bg-background/50 backdrop-blur-lg shadow-lg z-10">
            <Header />
            {panelId ? (
              <div className="flex items-center justify-start">
                <Button variant="ghost" onClick={() => onBackButtonClick()}>
                  <ChevronLeft size={16} /> {backButtonText ?? "Back"}
                </Button>
              </div>
            ) : (
              <OverlayTabs />
            )}
          </div>
          <div className="w-full flex-1">
            <OverlayContent />
          </div>
        </UIBase>
      </motion.div>
      <UIBase innerClassName="p-0.5 flex flex-col gap-0.5">
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
          <ChevronLeft
            size={16}
            className={cn(
              "transition-all duration-300",
              isOpen ? "" : "rotate-180"
            )}
          />
        </Button>
        {isOpen && activeOverlayTab === "project" && projectData && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMaximized(!isMaximized)}
          >
            {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </Button>
        )}
        <div className="flex items-center justify-center">
          <div className="h-0.5 w-[60%] rounded-full bg-border"></div>
        </div>
        <ShareDialog>
          <Button variant="ghost" size="icon">
            <Share2 size={16} />
          </Button>
        </ShareDialog>
      </UIBase>
    </motion.div>
  );
};

export default Sidebar;
