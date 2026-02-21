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

export const dynamic = "force-dynamic";

export type IndexedOrganization = {
  info: {
    name: string;
    country: string;
  } | null;
  mapPoint: { lat: number; lon: number } | null;
  did: string;
};

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
