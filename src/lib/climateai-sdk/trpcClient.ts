import { createTRPCClient } from "climateai-sdk/client";
import type { AllowedPDSDomain } from "@/config/climateai-sdk";

const trpcClient = createTRPCClient<AllowedPDSDomain>("/api/trpc");

export default trpcClient;
