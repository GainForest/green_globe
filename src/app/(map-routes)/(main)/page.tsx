"use client";

import { useSearchParams } from "next/navigation";
import useStoreUrlSync from "./_features/navigation/use-store-url-sync";

export default function Home() {
  const queryParams = useSearchParams();
  useStoreUrlSync(queryParams, {});
  return null;
}
