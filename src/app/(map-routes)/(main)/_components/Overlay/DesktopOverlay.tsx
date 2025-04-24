import { Maximize2 } from "lucide-react";
import { Minimize2 } from "lucide-react";
import { Share2 } from "lucide-react";
import { motion } from "framer-motion";
import useOverlayTabsStore from "./OverlayTabs/store";
import useOverlayStore from "./store";
import useProjectOverlayStore from "../ProjectOverlay/store";
import OverlayContent from "../OverlayContent";
import UIBase from "@/components/ui/ui-base";
import OverlayTabs from "./OverlayTabs";
import Header from "./Header";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import ShareDialog from "../ShareDialog";

const OVERLAY_WIDTH = 500;

const DesktopOverlay = () => {
  const isOpen = useOverlayStore((state) => state.isOpen);
  const setIsOpen = useOverlayStore((state) => state.setIsOpen);

  const projectData = useProjectOverlayStore((state) => state.projectData);
  const isMaximized = useProjectOverlayStore((state) => state.isMaximized);
  const setIsMaximized = useProjectOverlayStore(
    (state) => state.setIsMaximized
  );

  const activeOverlayTab = useOverlayTabsStore((state) => state.activeTab);
  const computedSidebarWidth =
    isMaximized && activeOverlayTab === "project"
      ? "50vw"
      : `${OVERLAY_WIDTH}px`;
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
            <OverlayTabs />
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

export default DesktopOverlay;
