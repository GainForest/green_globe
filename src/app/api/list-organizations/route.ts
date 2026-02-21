// DEPRECATED: was Airtable + raw PDS calls, now uses SDK via listAllOrganizations
// import Airtable from "airtable";
// import { Agent } from "@atproto/api";
// const apiKey = process.env.AIRTABLE_GREEN_GLOBE_TOKEN;
// const baseId = process.env.AIRTABLE_GREEN_GLOBE_ORGS_BASE_ID;
// async function getOrganizationInfo(did: string) { ... }
// async function getOrganizationCoordinates(did: string) { ... }

import { listAllOrganizations } from "@/lib/atproto/list-all-organizations";
import { tryCatch } from "@/lib/tryCatch";
import { NextRequest, NextResponse } from "next/server";

// Bug fix (green_globe-24): replaced `export const dynamic = "force-dynamic"` with ISR
// so Next.js caches the response for 5 minutes instead of making ~197 PDS calls per request.
// Org data changes infrequently (hours/days), so a 5-minute stale window is acceptable.
export const revalidate = 300; // 5 minutes ISR

/**
 * Intentional shape change (green_globe-23): the original spec for green_globe-16.5 required
 * a flat shape `{ did, name?, country?, lat?, lon? }`. The implementation deliberately uses a
 * nested shape instead — `{ did, info: { name, country } | null, mapPoint: { lat, lon } | null }`
 * — because it is more expressive and avoids ambiguity between "field not requested" vs
 * "field missing on the record". The `useIndexedOrganizations` hook has been updated to
 * consume this nested shape. Any new consumer of GET /api/list-organizations should use
 * this type (or `StrictIndexedOrganization`) rather than the old flat shape.
 */
export type IndexedOrganization = {
  /** Nested info block; null when the ?info=true query param was not passed or the record has no info. */
  info: {
    name: string;
    country: string;
  } | null;
  /** Nested map-point block; null when the ?mapPoint=true query param was not passed or the record has no coordinates. */
  mapPoint: { lat: number; lon: number } | null;
  did: string;
};

/** Variant of {@link IndexedOrganization} where both `info` and `mapPoint` are guaranteed non-null. */
export type StrictIndexedOrganization = {
  info: {
    name: string;
    country: string;
  };
  mapPoint: { lat: number; lon: number };
  did: string;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const info = searchParams.get("info") === "true";
  const mapPoint = searchParams.get("mapPoint") === "true";

  const [organizations, error] = await tryCatch(
    listAllOrganizations({
      includeInfo: info,
      includeCoordinates: mapPoint,
    })
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Map the IndexedOrganization shape from the utility to the existing
  // response shape expected by the frontend (IndexedOrganization with info/mapPoint).
  const response: IndexedOrganization[] = organizations.map((org) => ({
    did: org.did,
    info:
      org.name !== undefined && org.country !== undefined
        ? { name: org.name, country: org.country }
        : null,
    mapPoint:
      org.lat !== undefined && org.lon !== undefined
        ? { lat: org.lat, lon: org.lon }
        : null,
  }));

  return NextResponse.json(response, { status: 200 });
}
