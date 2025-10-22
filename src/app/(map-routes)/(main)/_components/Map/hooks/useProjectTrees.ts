import { useEffect } from "react";
import useMapStore from "../store";
import { GeoJSONSource } from "mapbox-gl";
import useProjectOverlayStore from "../../ProjectOverlay/store";
import useRecord from "@/hooks/use-record";
import { AppGainforestOrganizationSite } from "@/../lexicon-api";
import { validateRecord } from "@/../lexicon-api/types/app/gainforest/organization/site";
import { MeasuredTreesGeoJSON } from "../../ProjectOverlay/store/types";
import getBlobUrl from "@/lib/atproto/getBlobUrl";
import { useQuery } from "@tanstack/react-query";
import { BlobRef } from "@atproto/api";

const useProjectTrees = () => {
  const mapRef = useMapStore((state) => state.mapRef);
  const currentView = useMapStore((state) => state.currentView);
  const projectId = useProjectOverlayStore((state) => state.projectId);
  const activeSiteId = useProjectOverlayStore((state) => state.activeSiteId);
  const { data: site } = useRecord<AppGainforestOrganizationSite.Record>(
    "app.gainforest.organization.site",
    projectId ?? undefined,
    activeSiteId ?? undefined,
    validateRecord
  );
  const treesBlobRef = site?.trees as BlobRef | undefined;
  const treesBlobCid = treesBlobRef?.ref;
  const { data } = useQuery({
    queryKey: ["measured-trees", treesBlobCid],
    queryFn: async () => {
      if (!treesBlobCid) throw new Error("No trees blob CID found");
      const blobUrl = getBlobUrl(projectId ?? "", treesBlobCid);
      const response = await fetch(blobUrl);
      const data = await response.json();
      return data as MeasuredTreesGeoJSON;
    },
  });

  useEffect(() => {
    if (currentView !== "project") return;
    const map = mapRef?.current;
    if (!map || !data) return;

    (map.getSource("trees") as GeoJSONSource | undefined)?.setData(data);
  }, [mapRef, currentView, data]);
};

export default useProjectTrees;
