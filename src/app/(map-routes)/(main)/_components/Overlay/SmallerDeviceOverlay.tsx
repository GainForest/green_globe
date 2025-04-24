import UIBase from "@/components/ui/ui-base";
import { motion } from "framer-motion";
import React from "react";
import Header from "./Header";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import OverlayTabs from "./OverlayTabs";
import OverlayContent from "../OverlayContent";
import { cn } from "@/lib/utils";

const HeaderWhenFullHeight = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="sticky top-0 z-[25] p-2 bg-background/90 backdrop-blur-lg flex flex-col gap-2 border-b border-b-border">
      <div className="pb-0 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft size={16} />
        </Button>
        <Header showBrandName={false} />
      </div>
      <OverlayTabs />
    </div>
  );
};

const SmallerDeviceOverlay = () => {
  const [totalDisplacement, setTotalDisplacement] = React.useState(0);
  const [startY, setStartY] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isFullHeight, setIsFullHeight] = React.useState(false);

  const handleStart = (y: number) => {
    setStartY(y);
    setIsDragging(true);
  };

  const handleMove = (y: number) => {
    if (!isDragging) return;

    const deltaY = y - startY;
    const newDisplacement = Math.min(
      0,
      Math.max(-window.innerHeight + 100, totalDisplacement + deltaY)
    );

    setTotalDisplacement(newDisplacement);
    setStartY(y);
  };

  const handleEnd = () => {
    if (totalDisplacement <= -window.innerHeight + 200) {
      setIsFullHeight(true);
    } else {
      setIsFullHeight(false);
    }
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientY);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientY);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  return (
    <>
      {!isFullHeight && (
        <motion.div className="fixed -top-1 -left-1 -right-1 z-10">
          <UIBase innerClassName="p-3 rounded-none" className="rounded-none">
            <Header />
          </UIBase>
        </motion.div>
      )}
      <div
        className="fixed left-0 right-0 z-10 flex flex-col items-center"
        style={{
          top: isFullHeight
            ? "0"
            : `calc(100% - 4.2rem + ${totalDisplacement}px)`,
        }}
      >
        <UIBase
          className={cn(
            "w-full max-w-xl",
            isFullHeight ? "border-none max-w-full" : ""
          )}
          innerClassName={cn(
            "flex flex-col h-screen overflow-y-auto p-0",
            isFullHeight ? "border-none" : ""
          )}
        >
          {isFullHeight ? (
            <HeaderWhenFullHeight
              onBack={() => {
                setIsFullHeight(false);
                setTotalDisplacement(0);
              }}
            />
          ) : (
            <div
              className="w-full flex flex-col border-b border-b-border p-1 sticky top-0 bg-background/90 backdrop-blur-lg z-[20]"
              {...{
                onTouchStart: handleTouchStart,
                onTouchMove: handleTouchMove,
                onTouchEnd: handleEnd,
                onMouseDown: handleMouseDown,
                onMouseMove: handleMouseMove,
                onMouseUp: handleMouseUp,
                onMouseLeave: handleMouseUp,
              }}
              style={{
                cursor: isDragging ? "grabbing" : "grab",
                touchAction: "none",
              }}
            >
              <div className="w-full flex items-center justify-center mt-1">
                <button
                  className="h-auto w-full p-1 flex items-center justify-center -mt-1"
                  onClick={() => {
                    setIsFullHeight(true);
                  }}
                >
                  <div className="h-1 w-8 rounded-full bg-foreground/20" />
                </button>
              </div>
              <div className="p-1">
                <OverlayTabs
                  onTabClick={() => {
                    setIsFullHeight(true);
                  }}
                />
              </div>
            </div>
          )}
          <div className="w-full flex-1">
            <OverlayContent />
          </div>
        </UIBase>
      </div>
    </>
  );
};

export default SmallerDeviceOverlay;
