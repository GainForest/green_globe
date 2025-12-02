"use client";
import React, { useEffect } from "react";
import { Combobox } from "@/components/ui/combobox";
import useProjectOverlayStore from "./store";
import useNavigation from "../../_features/navigation/use-navigation";
import {
  AppGainforestOrganizationInfo,
  AppGainforestCommonDefs,
} from "climateai-sdk/lex-api";
import useMapStore from "../Map/store";
import { AllGeoJSON, bbox } from "@turf/turf";
import { GeoJsonObject } from "geojson";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Loader2 } from "lucide-react";
import { trpcApi } from "@/components/providers/TRPCProvider";
import { allowedPDSDomains } from "@/config/climateai-sdk";
import { getBlobUrl, validateGeojsonOrThrow } from "climateai-sdk/utilities";
import { $Typed } from "@atproto/api";

const ProjectSitesSection = () => {
  const projectId = useProjectOverlayStore((state) => state.projectId);

  const navigate = useNavigation();
  const activeSiteAtUri = useProjectOverlayStore(
    (state) => state.activeSiteAtUri
  );
  const setActiveSiteAtUri = useProjectOverlayStore(
    (state) => state.setActiveSiteAtUri
  );

  const { data: allSitesData, error: allSitesFetchError } =
    trpcApi.gainforest.organization.site.getAll.useQuery({
      did: projectId ?? "",
      pdsDomain: allowedPDSDomains[0],
    });

  const allSiteResponses = allSitesData?.sites;
  const defaultSiteResponse = allSitesData?.defaultSite ?? undefined;

  const activeSiteIndex =
    allSiteResponses?.findIndex((site) => site.uri === activeSiteAtUri) ?? -1;

  const activeSiteRecord =
    activeSiteIndex !== -1 ?
      allSiteResponses?.[activeSiteIndex].value
    : undefined;

  const handleProjectSiteChange = (siteId: string) => {
    setActiveSiteAtUri(siteId, navigate);
  };

  // Verify and set the site id after the site records list loads or changes
  useEffect(() => {
    if (!allSiteResponses) {
      return;
    }
    const siteToSet = allSiteResponses.find(
      (site) => site.uri === activeSiteAtUri
    );
    setActiveSiteAtUri(siteToSet ? siteToSet.uri : null, navigate);
  }, [allSiteResponses, activeSiteAtUri, navigate]);

  // Set the default site id if no site id is set
  useEffect(() => {
    if (!activeSiteAtUri && defaultSiteResponse) {
      // Check if the default site is in the site records list or not, to prevent re-renders
      if (allSiteResponses) {
        const siteToSet = allSiteResponses.find(
          (site) =>
            site.uri.toLowerCase() ===
            defaultSiteResponse.value.site.toLowerCase()
        );
        if (!siteToSet) return;
      }
      setActiveSiteAtUri(defaultSiteResponse.value.site, navigate);
    }
  }, [defaultSiteResponse, allSiteResponses, activeSiteAtUri, navigate]);

  // Fetch the shapefile for the active site
  const {
    data: shapefileGeojsonObject,
    error: shapefileError,
    isPending: isShapefilePending,
    isPlaceholderData: isPlaceholderShapefileData,
  } = useQuery({
    queryKey: ["site-shapefile", activeSiteRecord?.shapefile],
    queryFn: async () => {
      const shapefile = activeSiteRecord?.shapefile;
      const did = projectId ?? "";
      if (!did) throw new Error("Something went wrong.");
      if (shapefile === undefined) throw new Error("Site not found.");

      const shapefileUrl = getBlobUrl(
        did,
        shapefile as
          | $Typed<AppGainforestCommonDefs.Uri>
          | $Typed<AppGainforestCommonDefs.SmallBlob>,
        allowedPDSDomains[0]
      );
      const response = await fetch(shapefileUrl);
      const data = await response.json();
      const validatedData = validateGeojsonOrThrow(data);
      return validatedData;
    },
    enabled: !!activeSiteRecord?.shapefile,
  });

  useEffect(() => {
    if (!shapefileGeojsonObject || isPlaceholderShapefileData) {
      // @TODO: zoom out in case of no site id
      return;
    }

    const boundingBox = bbox(
      shapefileGeojsonObject satisfies GeoJsonObject as AllGeoJSON
    ).slice(0, 4) as [number, number, number, number];
    useMapStore.getState().setMapBounds(boundingBox);
    // Clear the map bounds params from the url:
    navigate?.((draft) => {
      if (draft.map.bounds !== null) {
        draft.map.bounds = null;
      }
    });
    useMapStore.getState().setHighlightedPolygon(shapefileGeojsonObject);
  }, [shapefileGeojsonObject, isPlaceholderShapefileData]);

  if (allSitesFetchError) return <div>Error loading project sites</div>;
  if (!allSiteResponses) return <div>Loading project sites...</div>;

  return (
    <section className="flex items-center gap-2">
      <span className="text-muted-foreground font-bold">
        Project Site{allSiteResponses?.length > 1 ? "s" : ""}
      </span>
      {allSiteResponses?.length > 1 ?
        <Combobox
          options={allSiteResponses.map((site) => ({
            label: site.value?.name ?? "Loading...",
            value: site.uri,
          }))}
          value={activeSiteAtUri ?? undefined}
          onChange={handleProjectSiteChange}
          className="flex-1 max-w-[300px]"
          searchIn="label"
        />
      : <span className="text-muted-foreground flex-1 bg-accent px-2 py-1 rounded-md">
          {allSiteResponses[0]?.value.name ?? "Loading..."}
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
