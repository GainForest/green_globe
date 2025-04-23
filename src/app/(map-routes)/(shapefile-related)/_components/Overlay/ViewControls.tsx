import React from "react";
import useOverlayStore from "./store";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
const ViewControls = () => {
  const { controlsConfig, setControlsConfig } = useOverlayStore();
  if (controlsConfig.mode !== "view") return null;
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor="geojson-url" className="text-sm text-muted-foreground">
        Enter a GeoJSON URL
      </Label>
      <Input
        id="geojson-url"
        type="text"
        placeholder="https://example.com/geojson.json"
        value={controlsConfig.source.value}
        onChange={(e) => {
          setControlsConfig({
            mode: "view",
            source: {
              type: "url",
              value: e.target.value,
              dataFormat: "geojson",
            },
          });
        }}
      />
    </div>
  );
};

export default ViewControls;
