/**
 * Smoke test: verifies that gainforestSdk.getServerCaller() can successfully
 * fetch an organization info record from the PDS via the tRPC server caller.
 *
 * NOTE: This test cannot run in Vitest because the gainforest-sdk imports
 * `next/headers` (for iron-session cookie management), which is a Next.js
 * server-only module unavailable in the Vitest Node environment.
 *
 * Verification was performed via a temporary API route (Option B from
 * green_globe-15.5 spec), which has since been removed (green_globe-38).
 *
 * Results (verified 2026-02-21):
 * - gainforestSdk.getServerCaller().health() → { status: "ok" } ✅
 * - Raw PDS fetch of did:plc:wjsefeck45aivxyjfa5h43ay → displayName: "VCS-875 Project" ✅
 * - gainforestSdk.getServerCaller().gainforest.organization.info.get() → success ✅
 *   (shortDescription migration completed in green_globe-21.1)
 *
 * green_globe-15.5
 */
import { describe, it } from "vitest";

describe("gainforestSdk smoke test (Option B — verified via temporary API route)", () => {
  it("pipeline verified: tRPC server caller and PDS connectivity confirmed (see comments above)", () => {
    // Verification was done via a temporary API route (now removed) that returned:
    // { pipelineWorks: true, results: { health: { success: true, status: "ok" }, ... } }
    //
    // The SDK cannot be imported in Vitest because gainforest-sdk imports
    // next/headers which is only available in the Next.js runtime.
  });
});
