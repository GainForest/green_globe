"use client";

import { useSearchParams } from "next/navigation";
import { use } from "react";
import useStoreUrlSync from "../_features/navigation/use-store-url-sync";

export default function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const queryParams = useSearchParams();

  useStoreUrlSync(queryParams, { projectId });

  return null;
}
