import { useEffect } from "react";
import useMapStore from "../store";
import { GeoJSONSource } from "mapbox-gl";
import useProjectOverlayStore from "../../ProjectOverlay/store";
import { MeasuredTreesGeoJSON } from "../../ProjectOverlay/store/types";
import getBlobUrl from "@/lib/atproto/getBlobUrl";
import { useQuery } from "@tanstack/react-query";
import { BlobRef } from "@atproto/api";
import { trpcApi } from "@/components/providers/TRPCProvider";
import { allowedPDSDomains } from "@/config/climateai-sdk";

const useProjectTrees = () => {
  const mapRef = useMapStore((state) => state.mapRef);
  const currentView = useMapStore((state) => state.currentView);
  const projectId = useProjectOverlayStore((state) => state.projectId);
  const activeSiteId = useProjectOverlayStore((state) => state.activeSiteAtUri);
  const { data: siteResponse } =
    trpcApi.hypercerts.site.get.useQuery(
      {
        did: projectId ?? "",
        rkey: activeSiteId ?? "",
        pdsDomain: allowedPDSDomains[0],
      },
      {
        enabled: !!projectId && !!activeSiteId,
      }
    );
  const site = siteResponse?.value;
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
