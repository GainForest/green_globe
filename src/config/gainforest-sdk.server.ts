import { GainForestSDK } from "gainforest-sdk";
import type { ATProtoSDK } from "@hypercerts-org/sdk-core";
import { allowedPDSDomains } from "./gainforest-sdk";

// TODO: Integrate with the existing BrowserOAuthClient / ATProto OAuth when
// OAuth integration is tackled (green_globe-15 epic). For now the SDK is
// initialised without a real ATProtoSDK instance so that read-only tRPC
// operations work without authentication.
export const gainforestSdk = new GainForestSDK(
  allowedPDSDomains,
  null as unknown as ATProtoSDK,
);
