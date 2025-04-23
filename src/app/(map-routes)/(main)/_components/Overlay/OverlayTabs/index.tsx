"use client";

import { Layers, LucideProps, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import React, { useMemo } from "react";
import useOverlayTabsStore, { OverlayTabsState } from "./store";
import useProjectOverlayStore from "../../ProjectOverlay/store";
import useHoveredTreeOverlayStore from "../../HoveredTreeOverlay/store";
import { SlidingTabs, Underlay, Tab } from "@/components/ui/sliding-tabs";
import useNavigation from "@/app/(map-routes)/(main)/_features/navigation/use-navigation";

type TabButton = {
  icon: React.FC<LucideProps>;
  label: string;
  shouldBeDisabled: boolean;
  key: Exclude<OverlayTabsState["activeTab"], undefined>;
};

const OverlayTabs = () => {
  const activeTab = useOverlayTabsStore((state) => state.activeTab);
  const setActiveTab = useOverlayTabsStore((state) => state.setActiveTab);
  const activeProjectId = useProjectOverlayStore((state) => state.projectId);
  const hoveredTree = useHoveredTreeOverlayStore(
    (state) => state.treeInformation
  );
  const navigate = useNavigation();

  const buttons: TabButton[] = useMemo(
    () => [
      {
        icon: Search,
        label: "Search",
        shouldBeDisabled: false,
        key: "search",
      },
      {
        icon: Layers,
        label: "Layers",
        shouldBeDisabled: false,
        key: "layers",
      },
      {
        icon: MapPin,
        label: "Project",
        shouldBeDisabled: activeProjectId === undefined,
        key: "project",
      },
    ],
    [activeProjectId, hoveredTree]
  );

  return (
    <SlidingTabs
      activeKey={activeTab}
      onTabChange={(key) =>
        setActiveTab(key as OverlayTabsState["activeTab"], navigate)
      }
    >
      <Underlay />

      {buttons.map((button, index) => (
        <React.Fragment key={button.key}>
          <Tab tabKey={button.key} asChild>
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setActiveTab(button.key, navigate)}
              disabled={button.shouldBeDisabled}
            >
              <button.icon /> {button.label}
            </Button>
          </Tab>

          {index !== buttons.length - 1 && (
            <div className="h-5 w-[2px] bg-border rounded-full" />
          )}
        </React.Fragment>
      ))}
    </SlidingTabs>
  );
};

export default OverlayTabs;
