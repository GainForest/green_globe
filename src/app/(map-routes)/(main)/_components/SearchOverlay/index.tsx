import React, { useMemo } from "react";
import useBlurAnimate from "../../_hooks/useBlurAnimate";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import useSearchOverlayStore from "./store";
import { countryToEmoji } from "@/lib/country-emojis";
import { Button } from "@/components/ui/button";
import useProjectOverlayStore from "../ProjectOverlay/store";
import useMapStore from "../Map/store";
import { ChevronRight, CircleAlert, Loader2, X } from "lucide-react";
import useOverlayTabsStore from "../Overlay/OverlayTabs/store";
import { cn } from "@/lib/utils";
import useNavigation from "@/app/(map-routes)/(main)/_features/navigation/use-navigation";
import useIndexedOrganizations from "../../_hooks/useIndexedOrganizations";

const SearchOverlay = () => {
  const { animate, onAnimationComplete } = useBlurAnimate(
    { opacity: 1, scale: 1, filter: "blur(0px)" },
    { opacity: 1, scale: 1, filter: "unset" }
  );
  const navigate = useNavigation();

  const setCurrentMapView = useMapStore((state) => state.setCurrentView);
  const setActiveTab = useOverlayTabsStore((state) => state.setActiveTab);

  const projectId = useProjectOverlayStore((state) => state.projectId);
  const setProjectId = useProjectOverlayStore((state) => state.setProjectId);

  const projectDataStatus = useProjectOverlayStore(
    (state) => state.projectDataStatus
  );

  const searchQuery = useSearchOverlayStore((state) => state.searchQuery);
  const setSearchQuery = useSearchOverlayStore((state) => state.setSearchQuery);

  const { organizations } = useIndexedOrganizations();

  const filteredOrganizations = useMemo(() => {
    if (!organizations) return undefined;
    return organizations?.filter((organization) => {
      const lcSearchQuery = searchQuery.toLowerCase();
      const info = organization.info;
      if (!info) return false;
      const countryDetails =
        Object.keys(countryToEmoji).includes(info.country) ?
          countryToEmoji[info.country as keyof typeof countryToEmoji]
        : null;
      const countryName = countryDetails?.name;
      return (
        info.name.toLowerCase().includes(lcSearchQuery) ||
        countryName?.toLowerCase().includes(lcSearchQuery)
      );
    });
  }, [organizations, searchQuery]);

  const handleOrganizationClick = (organizationId: string) => {
    setProjectId(organizationId, navigate);
    setTimeout(() => {
      setActiveTab("project", navigate);
    }, 400);
    setCurrentMapView("project");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
      animate={animate}
      exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
      onAnimationComplete={onAnimationComplete}
      className=""
    >
      <div className="scrollable overflow-y-auto overflow-x-hidden scrollbar-variant-1 p-4">
        <div className="flex items-center relative">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value, navigate)}
            placeholder="Search projects"
            className="rounded-xl bg-foreground/10 h-10"
          />
          {searchQuery.length > 0 && (
            <button
              onClick={() => setSearchQuery("", navigate)}
              className="absolute right-2 h-6 w-6 p-1 rounded-full bg-background/40 flex items-center justify-center"
            >
              <X />
            </button>
          )}
        </div>
        {filteredOrganizations === undefined && (
          <div className="mt-4 flex flex-col gap-1">
            {new Array(6).fill(null).map((_, index) => (
              <div
                key={index}
                className="w-full h-20 flex flex-col gap-2 p-4 bg-foreground/10 animate-pulse rounded-sm"
                style={{
                  animationDelay: `${index * 200}ms`,
                  borderTopLeftRadius: index === 0 ? "1rem" : undefined,
                  borderTopRightRadius: index === 0 ? "1rem" : undefined,
                  borderBottomLeftRadius: index === 5 ? "1rem" : undefined,
                  borderBottomRightRadius: index === 5 ? "1rem" : undefined,
                }}
              >
                <div className="h-6 w-40 bg-foreground/10 animate-pulse rounded-sm"></div>
                <div className="h-6 w-20 bg-foreground/10 animate-pulse rounded-sm"></div>
              </div>
            ))}
          </div>
        )}

        {filteredOrganizations && filteredOrganizations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(10px)" }}
            className="flex flex-col divide-y bg-neutral-50 dark:bg-neutral-950 border border-border rounded-xl mt-4 overflow-hidden"
          >
            {filteredOrganizations.map((organization) => {
              const info = organization.info;
              if (!info) return null;
              const countryDetails =
                Object.keys(countryToEmoji).includes(info.country) ?
                  countryToEmoji[info.country as keyof typeof countryToEmoji]
                : null;

              const isCurrentProject = projectId === organization.did;
              return (
                <div className="flex relative" key={organization.did}>
                  <button
                    //   className="rounded-none"
                    className={cn(
                      "flex-1 justify-start h-auto rounded-none p-3 text-left whitespace-normal bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-950 hover:dark:bg-neutral-900",
                      isCurrentProject ?
                        "bg-neutral-100 dark:bg-neutral-900"
                      : ""
                    )}
                    onClick={() => handleOrganizationClick(organization.did)}
                  >
                    <div className="flex flex-col gap-2 items-start">
                      <span className="font-bold">{info.name}</span>
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">
                        <span className="px-2 py-1 bg-foreground/10 backdrop-blur-lg rounded-full text-sm">
                          {countryDetails?.emoji}
                          &nbsp;&nbsp;
                          {countryDetails?.name}
                        </span>
                      </span>
                    </div>
                  </button>
                  {isCurrentProject && (
                    <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center p-2">
                      <Button
                        variant={"outline"}
                        size={"icon"}
                        onClick={() => setActiveTab("project", navigate)}
                        disabled={projectDataStatus !== "success"}
                        className="text-muted-foreground"
                      >
                        {projectDataStatus === "loading" ?
                          <Loader2 className="animate-spin" />
                        : projectDataStatus === "error" ?
                          <CircleAlert />
                        : projectDataStatus === "success" ?
                          <ChevronRight />
                        : null}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
        {filteredOrganizations && filteredOrganizations.length === 0 && (
          <div className="bg-foreground/[0.025] p-4 rounded-xl mt-4 flex flex-col items-center justify-center gap-4">
            <CircleAlert
              className="text-muted-foreground opacity-50"
              size={40}
            />
            <div className="flex flex-col items-center">
              <span className="font-bold text-muted-foreground">
                No projects found
              </span>
              <span className="text-sm text-muted-foreground">
                Try searching for a different project
              </span>
            </div>
            <Button
              variant={"secondary"}
              onClick={() => setSearchQuery("", navigate)}
            >
              Clear search
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SearchOverlay;
