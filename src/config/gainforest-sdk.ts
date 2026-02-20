import { SupportedPDSDomain } from "gainforest-sdk";
import { createTRPCClient } from "gainforest-sdk/client";

export const allowedPDSDomains = [
  "climateai.org",
] satisfies SupportedPDSDomain[];
export type AllowedPDSDomain = (typeof allowedPDSDomains)[number];

export const trpcClient = createTRPCClient<AllowedPDSDomain>("/api/trpc");
