import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import React, { useEffect, useRef } from "react";
import useLayersOverlayStore from "./store";
import autoAnimate from "@formkit/auto-animate";
import dayjs from "dayjs";
import useNavigation from "../../_features/navigation/use-navigation";
const HistoricalSatelliteControls = () => {
  const thisLayerView = useLayersOverlayStore(
    (state) => state.staticLayersVisibility.historicalSatellite
  );
  const setStaticLayerVisibility = useLayersOverlayStore(
    (actions) => actions.setStaticLayerVisibility
  );
  const navigate = useNavigation();
  const handleToggle = (value: boolean) => {
    setStaticLayerVisibility("historicalSatellite", value, navigate);
  };

  const historicalSatelliteState = useLayersOverlayStore(
    (state) => state.historicalSatelliteState
  );
  const setHistoricalSatelliteDate = useLayersOverlayStore(
    (actions) => actions.setHistoricalSatelliteDate
  );

  const { minDate, maxDate, formattedCurrentDate, currentDate } =
    historicalSatelliteState;
  const monthsBetween = maxDate.diff(minDate, "month");

  const controllerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (controllerRef.current) {
      autoAnimate(controllerRef.current);
    }
  }, []);

  return (
    <div className="mb-6">
      <h3 className="text-sm text-muted-foreground font-semibold mb-1">
        Monthly Satellite Layer
      </h3>
      <div
        className="text-sm flex flex-col divide-y bg-neutral-50 dark:bg-neutral-950 border border-border rounded-xl"
        ref={controllerRef}
      >
        <div className="flex items-center justify-between p-4">
          <Label htmlFor="historical-satellite">Historical Satellite</Label>
          <Switch
            id="historical-satellite"
            checked={thisLayerView}
            onCheckedChange={handleToggle}
          />
        </div>
        {thisLayerView && (
          <div className="flex flex-col gap-3 p-4 items-center">
            <span className="text-center text-balance">
              Historical Satellite data for Tropical Regions only
            </span>
            <Slider
              min={0}
              max={monthsBetween}
              defaultValue={[
                monthsBetween - maxDate.diff(currentDate, "month"),
              ]}
              step={1}
              onValueChange={(value) => {
                const monthsSinceMin = value[0];
                const newDate = minDate.add(monthsSinceMin, "month");
                setHistoricalSatelliteDate(newDate, navigate);
              }}
            />
            <span className="font-bold text-center">
              {dayjs(formattedCurrentDate, "YYYY-MM").format("MMMM YYYY")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoricalSatelliteControls;
