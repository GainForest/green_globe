"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, use } from "react";
import useStoreUrlSync from "../_features/navigation/use-store-url-sync";

function Project({ projectId }: { projectId: string }) {
  const queryParams = useSearchParams();

  useStoreUrlSync(queryParams, { projectId });

  return null;
}

export default function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);

  return (
    <Suspense>
      <Project projectId={projectId} />
    </Suspense>
  );
}
