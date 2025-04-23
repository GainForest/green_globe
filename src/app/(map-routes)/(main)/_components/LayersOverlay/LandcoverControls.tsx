import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import React, { useEffect, useRef } from "react";
import useLayersOverlayStore from "./store";
import autoAnimate from "@formkit/auto-animate";
import useNavigation from "../../_features/navigation/use-navigation";

const LandcoverControls = () => {
  const thisLayerView = useLayersOverlayStore(
    (state) => state.staticLayersVisibility.landcover
  );
  const setStaticLayerVisibility = useLayersOverlayStore(
    (actions) => actions.setStaticLayerVisibility
  );
  const navigate = useNavigation();

  const handleToggle = (value: boolean) => {
    setStaticLayerVisibility("landcover", value, navigate);
  };

  // Land cover classification data
  const landcoverClasses = [
    { color: "#006400", label: "Tree cover" },
    { color: "#ffbb22", label: "Shrubland" },
    { color: "#ffff4c", label: "Grassland" },
    { color: "#f096ff", label: "Cropland" },
    { color: "#fa0000", label: "Built-up" },
    { color: "#b4b4b4", label: "Bare / sparse vegetation" },
    { color: "#f0f0f0", label: "Snow and ice" },
    { color: "#0064c8", label: "Permanent water bodies" },
    { color: "#0096a0", label: "Herbaceous wetland" },
    { color: "#00cf75", label: "Mangroves" },
    { color: "#fae6a0", label: "Moss and lichen" },
  ];

  const controllerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (controllerRef.current) {
      autoAnimate(controllerRef.current);
    }
  }, []);

  return (
    <div className="mb-6">
      <h3 className="text-sm text-muted-foreground font-semibold mb-1">
        Land Cover
      </h3>
      <div
        className="text-sm flex flex-col divide-y bg-neutral-50 dark:bg-neutral-950 border border-border rounded-xl"
        ref={controllerRef}
      >
        <div className="flex items-center justify-between p-4">
          <Label htmlFor="landcover">Global Land Cover (ESA 2021)</Label>
          <Switch
            id="landcover"
            checked={thisLayerView}
            onCheckedChange={handleToggle}
          />
        </div>
        {thisLayerView && (
          <div className="p-4">
            <p className="text-center text-balance mb-3">
              ESA WorldCover 2021 Land Cover Classification
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {landcoverClasses.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandcoverControls;
