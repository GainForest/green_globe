"use client";

import { useSearchParams } from "next/navigation";
import useStoreUrlSync from "./_features/navigation/use-store-url-sync";
import { Suspense } from "react";

function Home() {
  const queryParams = useSearchParams();
  useStoreUrlSync(queryParams, {});
  return null;
}

export default function HomePage() {
  return (
    <Suspense>
      <Home />
    </Suspense>
  );
}
