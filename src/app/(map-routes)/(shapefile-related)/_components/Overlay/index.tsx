"use client";

import UIBase from "@/components/ui/ui-base";
import Header from "./Header";
import React from "react";
import useOverlayStore from "./store";
import ViewControls from "./ViewControls";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
const OVERLAY_WIDTH = 400;

const Overlay = () => {
  const { visibility, controlsConfig, mapControls, setMapControls } =
    useOverlayStore();

  if (!visibility) return null;
  return (
    <UIBase
      className="fixed top-2 left-2"
      innerClassName="flex flex-col gap-4"
      style={{ width: `${OVERLAY_WIDTH}px` }}
    >
      <Header />
      <div className="p-1 flex flex-col gap-4">
        {controlsConfig.mode === "view" ? <ViewControls /> : null}
        <div className="flex items-center gap-2">
          <Switch
            id="show-project-markers"
            checked={mapControls.showProjectMarkers}
            onCheckedChange={(checked) =>
              setMapControls({ showProjectMarkers: checked })
            }
          />
          <Label
            htmlFor="show-project-markers"
            className="text-sm text-muted-foreground"
          >
            Show Project Markers
          </Label>
        </div>
      </div>
    </UIBase>
  );
};

export default Overlay;
