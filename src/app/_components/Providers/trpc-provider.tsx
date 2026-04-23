"use client";

import { useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "gainforest-sdk";
import { customTransformer } from "gainforest-sdk/utilities/transform";
import type { AllowedPDSDomain } from "@/config/gainforest-sdk";

export const trpcApi = createTRPCReact<AppRouter<AllowedPDSDomain>>();

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:8910";
}

export function TrpcProvider({ children }: { children: React.ReactNode }) {
  // Create a separate QueryClient for tRPC (the existing one is for non-tRPC queries)
  const queryClient = useMemo(() => new QueryClient(), []);

  const trpcClient = useMemo(
    () =>
      trpcApi.createClient({
        links: [
          loggerLink({
            enabled: () => process.env.NODE_ENV === "development",
          }),
          httpBatchLink({
            url: `${getBaseUrl()}/api/trpc`,
            transformer: customTransformer,
          }),
        ],
      }),
    [],
  );

  return (
    <trpcApi.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpcApi.Provider>
  );
}
