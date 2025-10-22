"use client";
import React, { useEffect } from "react";
import { Combobox } from "@/components/ui/combobox";
import useProjectOverlayStore from "./store";
import useNavigation from "../../_features/navigation/use-navigation";
import {
  AppGainforestOrganizationInfo,
  AppGainforestOrganizationSite,
} from "@/../lexicon-api";
import useMapStore from "../Map/store";
import { bbox } from "@turf/turf";
import useListRecords from "@/hooks/use-list-records";
import useDefaultSite from "./hooks/useDefaultSite";
import { validateRecord } from "@/../lexicon-api/types/app/gainforest/organization/site";
import { useQuery } from "@tanstack/react-query";
import { ProjectPolygonAPIResponse } from "./store/types";
import useRecords from "@/hooks/use-records";
import extractRKeyFromUri from "@/lib/atproto/extractRKeyFromUri";
import { AlertCircle, Loader2 } from "lucide-react";

const ProjectSitesSection = () => {
  const projectId = useProjectOverlayStore((state) => state.projectId);

  const navigate = useNavigation();
  const siteId = useProjectOverlayStore((state) => state.activeSiteId);
  const setSiteId = useProjectOverlayStore((state) => state.setSiteId);

  const { data: siteRecordsList, error: siteRecordsListError } = useListRecords(
    "app.gainforest.organization.site",
    projectId ?? undefined
  );
  const siteRecordsKeys =
    siteRecordsList?.map((site) => extractRKeyFromUri(site.uri)) ?? [];
  const siteRecordsResults = useRecords<AppGainforestOrganizationSite.Record>(
    "app.gainforest.organization.site",
    projectId ?? undefined,
    siteRecordsKeys,
    validateRecord
  );
  const { defaultSite } = useDefaultSite(projectId ?? undefined);
  const activeSiteIndex =
    siteRecordsKeys.findIndex(
      (rkey) => siteId?.toLowerCase() === rkey?.toLowerCase()
    ) ?? -1;
  const activeSiteRecord =
    activeSiteIndex !== -1 ?
      siteRecordsResults[activeSiteIndex].data
    : undefined;

  const handleProjectSiteChange = (siteId: string) => {
    setSiteId(siteId, navigate);
  };

  // Verify and set the site id after the site records list loads or changes
  useEffect(() => {
    if (!siteRecordsList) {
      return;
    }
    const siteToSet = siteRecordsList.find(
      (site) => site.cid.toLowerCase() === siteId?.toLowerCase()
    );
    setSiteId(siteToSet ? siteToSet.cid : null, navigate);
  }, [siteRecordsList, siteId, navigate]);

  // Set the default site id if no site id is set
  useEffect(() => {
    if (!siteId && defaultSite) {
      // Check if the default site is in the site records list or not, to prevent re-renders
      if (siteRecordsList) {
        const siteToSet = siteRecordsList.find(
          (site) => site.uri.toLowerCase() === defaultSite.site.toLowerCase()
        );
        if (!siteToSet) return;
      }
      setSiteId(defaultSite.site, navigate);
    }
  }, [defaultSite, siteRecordsList, siteId, navigate]);

  // Fetch the shapefile for the active site
  const {
    data: shapefile,
    error: shapefileError,
    isPending: isShapefilePending,
    isPlaceholderData: isPlaceholderShapefileData,
  } = useQuery({
    queryKey: ["site-shapefile", activeSiteRecord?.shapefile],
    queryFn: async () => {
      const response = await fetch(activeSiteRecord?.shapefile ?? "");
      const data = await response.json();
      return data as ProjectPolygonAPIResponse;
    },
    enabled: !!activeSiteRecord?.shapefile,
  });

  useEffect(() => {
    if (!shapefile || isPlaceholderShapefileData) {
      // @TODO: zoom out in case of no site id
      return;
    }

    const boundingBox = bbox(shapefile).slice(0, 4) as [
      number,
      number,
      number,
      number,
    ];
    useMapStore.getState().setMapBounds(boundingBox);
    // Clear the map bounds params from the url:
    navigate?.((draft) => {
      if (draft.map.bounds !== null) {
        draft.map.bounds = null;
      }
    });
    useMapStore.getState().setHighlightedPolygon(shapefile);
  }, [shapefile, isPlaceholderShapefileData]);

  if (siteRecordsListError) return <div>Error loading project sites</div>;
  if (!siteRecordsList) return <div>Loading project sites...</div>;

  return (
    <section className="flex items-center gap-2">
      <span className="text-muted-foreground font-bold">
        Project Site{siteRecordsKeys?.length > 1 ? "s" : ""}
      </span>
      {siteRecordsKeys?.length > 1 ?
        <Combobox
          options={siteRecordsKeys.map((rkey, index) => ({
            label: siteRecordsResults.at(index)?.data?.name ?? "Loading...",
            value: rkey,
          }))}
          value={siteId ?? undefined}
          onChange={handleProjectSiteChange}
          className="flex-1 max-w-[300px]"
          searchIn="label"
        />
      : <span className="text-muted-foreground flex-1 bg-accent px-2 py-1 rounded-md">
          {siteRecordsKeys[0]}
        </span>
      }
      {isShapefilePending ||
        (isPlaceholderShapefileData && (
          <span className="text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
          </span>
        ))}
      {shapefileError && (
        <span className="text-muted-foreground">
          <AlertCircle className="size-4" />
        </span>
      )}
    </section>
  );
};

const ProjectObjectivesSection = ({ objectives }: { objectives: string[] }) => {
  return (
    <section className="flex flex-col gap-0.5">
      <span className="font-bold">Objective</span>
      <div className="flex flex-wrap gap-2 mt-1">
        {objectives.map((objective) => (
          <span
            key={objective}
            className="px-2 py-1 bg-foreground/10 backdrop-blur-lg rounded-full text-sm"
          >
            {objective}
          </span>
        ))}
      </div>
    </section>
  );
};

const ProjectInfo = ({
  organization,
}: {
  organization: AppGainforestOrganizationInfo.Record;
}) => {
  return (
    <div className="flex flex-col gap-4">
      <ProjectSitesSection />
      <section className="flex flex-col gap-0.5">
        <span className="font-bold">Description</span>
        <p className="leading-snug">{organization.longDescription}</p>
      </section>
      <ProjectObjectivesSection objectives={organization.objectives} />
    </div>
  );
};

export default ProjectInfo;
