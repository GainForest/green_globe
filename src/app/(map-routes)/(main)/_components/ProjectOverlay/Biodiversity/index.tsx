"use client";
import React, { useEffect, useRef } from "react";
import useBiodiversityStore from "./store";
import { Button } from "@/components/ui/button";
import { SlidingTabs, Underlay, Tab } from "@/components/ui/sliding-tabs";
import Predictions from "./Predictions";
import Observations from "./Observations";
import autoAnimate from "@formkit/auto-animate";
import useNavigation from "@/app/(map-routes)/(main)/_features/navigation/use-navigation";
const Biodiversity = () => {
  const activeTab = useBiodiversityStore((state) => state.activeTab);
  const setActiveTab = useBiodiversityStore((state) => state.setActiveTab);
  const navigate = useNavigation();
  const tabRendererRef = useRef<HTMLDivElement>(null);

  // Ensure we have an active tab on initial render

  useEffect(() => {
    if (tabRendererRef.current) {
      autoAnimate(tabRendererRef.current);
    }
  }, [activeTab]);

  return (
    <div className="flex flex-col gap-4">
      <SlidingTabs activeKey={activeTab} className="gap-2">
        <Underlay />
        <Tab tabKey="predictions" asChild>
          <Button
            variant="ghost"
            className="relative z-10 flex-1 disabled:opacity-100"
            onClick={() => setActiveTab("predictions", navigate)}
            disabled={activeTab === "predictions"}
          >
            Predictions
          </Button>
        </Tab>
        <Tab tabKey="observations" asChild>
          <Button
            variant="ghost"
            className="relative z-10 flex-1 disabled:opacity-100"
            onClick={() => setActiveTab("observations", navigate)}
            disabled={activeTab === "observations"}
          >
            Observations
          </Button>
        </Tab>
      </SlidingTabs>
      <section ref={tabRendererRef}>
        {activeTab === "predictions" && <Predictions />}
        {activeTab === "observations" && <Observations />}
      </section>
    </div>
  );
};

export default Biodiversity;
