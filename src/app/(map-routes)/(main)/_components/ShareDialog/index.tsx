"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import React, { Suspense, useCallback, useState } from "react";
import useProjectOverlayStore from "../ProjectOverlay/store";
import { Check, Copy, LocateFixed, LucideProps, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import useMapStore from "../Map/store";
import { usePathname, useSearchParams } from "next/navigation";
const ShareOption = ({
  title,
  description,
  Icon,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  Icon: React.FC<LucideProps>;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) => {
  return (
    <Button
      onClick={() => onCheckedChange(!checked)}
      variant="outline"
      className={cn(
        "flex items-start justify-start h-auto w-full text-left p-4 gap-4",
        checked ? "border-primary bg-muted/50" : ""
      )}
    >
      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/5">
        <Icon size={16} className="text-muted-foreground" />
      </div>
      <div className="flex-1 flex flex-col text-wrap">
        <b className="text-base">{title}</b>
        <p className="text-sm text-muted-foreground text-pretty">
          {description}
        </p>
      </div>
    </Button>
  );
};

const ShareDialogWithoutSuspense = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const project = useProjectOverlayStore((state) => state.projectData);
  const getMapBounds = useMapStore((state) => state.getMapBounds);

  const [shouldShareOtherConfigs, setShouldShareOtherConfigs] = useState(true);
  const [sharingOption, setSharingOption] = useState<"bounds" | "project">(
    "bounds"
  );
  const [isCopied, setIsCopied] = useState(false);

  const copy = (text: string) => {
    if (isCopied) return;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 1500);
  };

  const generateShareUrl = useCallback((): string => {
    const generatedParams = new URLSearchParams();
    const searchParamsArray = Array.from(searchParams.entries());
    // Overlay
    searchParamsArray.forEach(([key, value]) => {
      if (key.startsWith("overlay")) {
        generatedParams.set(key, value);
      }
    });

    // Layers
    if (shouldShareOtherConfigs) {
      searchParamsArray.forEach(([key, value]) => {
        if (key.startsWith("layer")) {
          generatedParams.set(key, value);
        }
      });
    }

    // Project
    if (project) {
      if (shouldShareOtherConfigs) {
        searchParamsArray.forEach(([key, value]) => {
          if (key.startsWith("project")) {
            generatedParams.set(key, value);
          }
        });
      } else {
        if (searchParams.get("project-site-id")) {
          generatedParams.set(
            "project-site-id",
            searchParams.get("project-site-id")!
          );
        }
      }
    }

    // Search
    searchParamsArray.forEach(([key, value]) => {
      if (key.startsWith("search")) {
        generatedParams.set(key, value);
      }
    });

    // Bounds
    if (sharingOption === "bounds") {
      const bounds = getMapBounds();
      if (bounds) {
        generatedParams.set("map-bounds", bounds.join(","));
      }
    }

    return `${window.location.origin}${pathname}?${generatedParams.toString()}`;
  }, [searchParams, pathname, shouldShareOtherConfigs, project, sharingOption]);

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share</DialogTitle>
          <DialogDescription>Share the map with others</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 my-6">
          {project ? (
            <div className="flex flex-col gap-2">
              <ShareOption
                title="Share visible map area"
                description="Share the exact area and zoom level currently displayed on your screen."
                Icon={LocateFixed}
                checked={sharingOption === "bounds"}
                onCheckedChange={() => setSharingOption("bounds")}
              />
              <ShareOption
                title="Share the project"
                description="Share the current project with its default location and zoom level"
                Icon={MapPin}
                checked={sharingOption === "project"}
                onCheckedChange={() => setSharingOption("project")}
              />
            </div>
          ) : (
            <div className="bg-muted rounded-lg p-4 flex flex-col items-center gap-2">
              <LocateFixed
                className="text-muted-foreground opacity-50"
                size={40}
              />
              <div className="flex flex-col items-center">
                <b>You are sharing the visible map area.</b>
                <p className="text-sm text-center text-balance text-muted-foreground">
                  You are sharing the exact area and zoom level currently
                  displayed on your screen.
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Switch
              checked={shouldShareOtherConfigs}
              onCheckedChange={setShouldShareOtherConfigs}
              id="share-other-configs-switch"
            />
            <Label htmlFor="share-other-configs-switch" className="text-sm">
              Share layer settings {project && "and project views"}
            </Label>
          </div>
        </div>
        <DialogFooter>
          <DialogClose>
            <Button variant="outline">Close</Button>
          </DialogClose>
          <Button
            onClick={() => {
              copy(generateShareUrl());
            }}
          >
            {isCopied ? <Check /> : <Copy />}
            {isCopied ? "Copied" : "Copy URL"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ShareDialog = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense>
      <ShareDialogWithoutSuspense>{children}</ShareDialogWithoutSuspense>
    </Suspense>
  );
};

export default ShareDialog;
