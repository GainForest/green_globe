"use client";

import { Suspense, use } from "react";
import { useSearchParams } from "next/navigation";
import HoveredTreeOverlay from "@/app/(map-routes)/(main)/_components/HoveredTreeOverlay";
import Map from "@/app/(map-routes)/(main)/_components/Map";
import TreeClusterOverlay from "@/app/(map-routes)/(main)/_components/Map/TreeClusterOverlay";
import TreesLoadingOverlay from "@/app/(map-routes)/(main)/_components/Map/TreesLoadingOverlay";
import useStoreUrlSync from "@/app/(map-routes)/(main)/_features/navigation/use-store-url-sync";
import { useGreenGlobePreviewMessageBridge } from "@/app/(map-routes)/(main)/_features/preview/use-green-globe-preview-message-bridge";

function EmbedProjectMap({ projectId }: { projectId: string }) {
  const queryParams = useSearchParams();
  const decodedProjectId = decodeURIComponent(projectId);

  useStoreUrlSync(queryParams, {
    projectId: decodedProjectId,
    embed: true,
  });
  useGreenGlobePreviewMessageBridge(decodedProjectId);

  return (
    <div className="relative flex h-screen w-full flex-col bg-background">
      <Map />
      <HoveredTreeOverlay />
      <TreesLoadingOverlay />
      <TreeClusterOverlay />
    </div>
  );
}

export default function EmbedProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);

  return (
    <Suspense>
      <EmbedProjectMap projectId={projectId} />
    </Suspense>
  );
}
