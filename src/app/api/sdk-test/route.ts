/**
 * Temporary smoke-test route for green_globe-15.5.
 *
 * Verifies that gainforestSdk.getServerCaller() can successfully call tRPC
 * procedures via the server caller pipeline.
 *
 * Usage: GET /api/sdk-test
 *
 * Findings:
 * - The tRPC pipeline (context creation, PDS connection, record fetch) works.
 * - gainforest.organization.info.get fails with UNPROCESSABLE_CONTENT because
 *   existing PDS records have `shortDescription` as a plain string, but the
 *   SDK's lexicon (v0.1.1) expects a richtext object
 *   ({ $type: 'app.gainforest.common.defs#richtext', text: string }).
 *   This is a data/schema migration issue to address separately.
 *
 * NOTE: This file is intentionally temporary (green_globe-15.5).
 */
import { NextResponse } from "next/server";
import { Agent } from "@atproto/api";
import { gainforestSdk } from "@/config/gainforest-sdk.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// VCS-875 — confirmed present in tmp/migration-run-complete.json
const TEST_DID = "did:plc:wjsefeck45aivxyjfa5h43ay";
const PDS_DOMAIN = "climateai.org" as const;

export async function GET() {
  const results: Record<string, unknown> = {};

  // ── Step 1: Verify tRPC health endpoint via server caller ────────────────
  try {
    const apiCaller = gainforestSdk.getServerCaller();
    const health = await apiCaller.health();
    results.health = { success: true, status: health.status };
  } catch (err) {
    results.health = {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // ── Step 2: Verify PDS connectivity via raw agent (baseline) ─────────────
  try {
    const agent = new Agent("https://climateai.org");
    const raw = await agent.com.atproto.repo.getRecord({
      repo: TEST_DID,
      collection: "app.gainforest.organization.info",
      rkey: "self",
    });
    results.rawPdsFetch = {
      success: true,
      displayName: (raw.data.value as { displayName?: string }).displayName,
      shortDescriptionType: typeof (
        raw.data.value as { shortDescription?: unknown }
      ).shortDescription,
    };
  } catch (err) {
    results.rawPdsFetch = {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // ── Step 3: Attempt gainforest.organization.info.get via SDK ─────────────
  // Expected to fail with UNPROCESSABLE_CONTENT because existing PDS records
  // have shortDescription as a plain string, but the SDK lexicon expects a
  // richtext object. This documents the schema mismatch for follow-up work.
  try {
    const apiCaller = gainforestSdk.getServerCaller();
    const response = await apiCaller.gainforest.organization.info.get({
      did: TEST_DID,
      pdsDomain: PDS_DOMAIN,
    });
    results.sdkOrgInfoGet = {
      success: true,
      displayName: response.value.displayName,
      country: response.value.country,
      uri: response.uri,
    };
  } catch (err) {
    // Document the schema mismatch — this is expected with current data
    results.sdkOrgInfoGet = {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      note: "Schema mismatch: PDS records have shortDescription as string; SDK lexicon expects richtext object. Data migration needed.",
    };
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  const pipelineWorks =
    (results.health as { success?: boolean })?.success === true &&
    (results.rawPdsFetch as { success?: boolean })?.success === true;

  return NextResponse.json(
    {
      pipelineWorks,
      did: TEST_DID,
      pdsDomain: PDS_DOMAIN,
      results,
    },
    { status: pipelineWorks ? 200 : 500 },
  );
}
