"use client";
import UIBase from "@/components/ui/ui-base";
import { LayoutGroup, motion } from "framer-motion";
import React from "react";
import Image from "next/image";
import {
  Leaf,
  Maximize2,
  Minimize2,
  MoveHorizontal,
  MoveVertical,
} from "lucide-react";
import useHoveredTreeOverlayStore from "./store";
import useOverlayStore from "../Overlay/store";
import { cn } from "@/lib/utils";
import useBlurAnimate from "../../_hooks/useBlurAnimate";
const HoveredTreeOverlay = () => {
  const { animate, onAnimationComplete } = useBlurAnimate(
    { opacity: 1, scale: 1, filter: "blur(0px)" },
    { opacity: 1, scale: 1, filter: "unset" }
  );
  const overlaySize = useOverlayStore((state) => state.size);
  const hoveredTree = useHoveredTreeOverlayStore(
    (state) => state.treeInformation
  );
  const isExpanded = useHoveredTreeOverlayStore((state) => state.isExpanded);
  const setIsExpanded = useHoveredTreeOverlayStore(
    (state) => state.setIsExpanded
  );

  if (!hoveredTree) return null;

  return (
    <LayoutGroup>
      {isExpanded ? (
        <motion.div
          layoutId="hovered-tree-overlay"
          initial={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
          animate={animate}
          exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
          onAnimationComplete={onAnimationComplete}
          className={cn(
            "fixed right-2 w-[25%] max-w-[280px] min-w-[180px]",
            overlaySize === "desktop" ? "top-2" : "top-16"
          )}
        >
          <UIBase innerClassName="p-0 overflow-hidden relative">
            <Image
              src={hoveredTree.treePhotos[0]}
              width={400}
              height={400}
              alt="Hovered Tree"
              className="w-full h-auto object-cover object-center [mask-image:linear-gradient(to_bottom,black_40%,transparent_100%)]"
            />
            <div className="px-4 pb-2 flex flex-col gap-2 -mt-12">
              <div className="flex flex-col gap-1 items-start">
                <span className="bg-muted/70 backdrop-blur-lg text-muted-foreground text-sm px-3 py-1 rounded-full flex items-center gap-2">
                  <Leaf size={16} />
                  <span>
                    {hoveredTree.treeSpecies
                      ? "Species"
                      : hoveredTree.treeCommonName
                      ? "Common Name"
                      : "Species"}
                  </span>
                </span>
                <h1 className="text-xl font-bold">
                  {hoveredTree.treeSpecies ??
                    hoveredTree.treeCommonName ??
                    "Unknown"}
                </h1>
              </div>
              <div className="flex items-center justify-stretch gap-2">
                <div className="flex-1 flex flex-col bg-muted rounded-xl p-2 gap-1">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <MoveVertical size={12} />
                    Height
                  </span>
                  <span className="font-bold text-lg">
                    {hoveredTree.treeHeight}
                  </span>
                </div>
                <div className="flex-1 flex flex-col bg-muted rounded-xl p-2 gap-1">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <MoveHorizontal size={12} />
                    Width
                  </span>
                  <span className="font-bold text-lg">
                    {hoveredTree.treeDBH}
                  </span>
                </div>
              </div>
              <span className="w-full text-center text-balance text-muted-foreground text-sm">
                <span>Measured:</span>{" "}
                <span>{hoveredTree.dateOfMeasurement}</span>
              </span>
            </div>
            <button
              className="absolute top-1 left-1 right-1 p-1 flex items-center justify-between gap-2 rounded-full bg-black/80 backdrop-blur-lg"
              onClick={() => setIsExpanded(false)}
            >
              <div className="rounded-full p-1.5 flex items-center justify-center bg-white/20 text-white">
                <Minimize2 size={14} />
              </div>
              <span className="text-neutral-300 text-sm font-bold mr-2">
                Hovered Tree
              </span>
            </button>
          </UIBase>
        </motion.div>
      ) : (
        <motion.div
          layoutId="hovered-tree-overlay"
          initial={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
          animate={animate}
          exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
          onAnimationComplete={onAnimationComplete}
          className={cn(
            "fixed right-2 flex flex-col items-end gap-2",
            overlaySize === "desktop" ? "top-2" : "top-16"
          )}
        >
          <UIBase innerClassName="w-28 p-0 overflow-hidden">
            <button
              className="flex flex-col items-center gap-1 group"
              onClick={() => setIsExpanded(true)}
            >
              <div className="w-28 h-28 relative">
                <Image
                  src={hoveredTree.treePhotos[0]}
                  width={200}
                  height={200}
                  alt="Hovered Tree"
                  className="w-28 h-28 object-cover object-center rounded-xl group-hover:blur-lg group-hover:brightness-75 transition-all duration-300"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="rounded-full p-2 flex items-center justify-center bg-neutral-500/70 text-white shadow-sm">
                    <Maximize2 size={20} />
                  </div>
                </div>
              </div>
              <span className="font-bold text-xs text-center p-1 leading-tight text-balance">
                {hoveredTree.treeSpecies ??
                  hoveredTree.treeCommonName ??
                  "Unknown"}
              </span>
            </button>
          </UIBase>
        </motion.div>
      )}
    </LayoutGroup>
  );
};

export default HoveredTreeOverlay;
