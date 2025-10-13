import Airtable from "airtable";
import { tryCatch } from "@/lib/tryCatch";
import { NextRequest } from "next/server";
import { Agent } from "@atproto/api";

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

const apiKey = process.env.AIRTABLE_GREEN_GLOBE_TOKEN;
const baseId = process.env.AIRTABLE_GREEN_GLOBE_ORGS_BASE_ID;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const info = searchParams.get("info") === "true";
  const mapPoint = searchParams.get("mapPoint") === "true";

  if (!apiKey || !baseId) {
    throw new Error("Missing Airtable API key or base ID");
  }

  const base = new Airtable({ apiKey: apiKey }).base(baseId);

  const [records, recordFetchError] = await tryCatch(
    base("Organizations")
      .select({
        maxRecords: 100,
        view: "Grid view",
        fields: ["DID"],
        filterByFormula: `{Status} = "Approved"`,
      })
      .all()
  );

  if (recordFetchError) {
    return new Response(JSON.stringify({ error: recordFetchError.message }), {
      status: 500,
    });
  }

  const organizationDIDs = records.map(
    (record) => record.fields.DID
  ) as string[];

  const [organizations, error] = await tryCatch(
    Promise.all(
      organizationDIDs.map(async (did) => {
        const [orgInfo] = await tryCatch(
          info
            ? getOrganizationInfo(did)
            : new Promise<null>((res) => res(null))
        );
        const [orgMapPoint] = await tryCatch(
          mapPoint
            ? getOrganizationCoordinates(did)
            : new Promise<null>((res) => res(null))
        );

        return {
          info: orgInfo,
          mapPoint: orgMapPoint,
          did: did,
        };
      })
    )
  );

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify(organizations), { status: 200 });
}

async function getOrganizationInfo(did: string) {
  const agent = new Agent("https://climateai.org");
  const data = await agent.com.atproto.repo.getRecord({
    repo: did,
    collection: "app.gainforest.organization.info",
    rkey: "self",
  });
  return data.success
    ? {
        name: data.data.value.displayName as string,
        country: data.data.value.country as string,
      }
    : null;
}

async function getOrganizationCoordinates(did: string) {
  const agent = new Agent("https://climateai.org");
  const data = await agent.com.atproto.repo.getRecord({
    repo: did,
    collection: "app.gainforest.organization.defaultSite",
    rkey: "self",
  });
  const siteAtURI = data.success ? (data.data.value.site as string) : null;
  if (!siteAtURI) return null;

  const siteCollectionId = siteAtURI.split(
    "app.gainforest.organization.site/"
  )[1];
  const siteData = await agent.com.atproto.repo.getRecord({
    repo: did,
    collection: "app.gainforest.organization.site",
    rkey: siteCollectionId,
  });

  if (!siteData.success) return null;
  const { lat, lon } = siteData.data.value;
  return { lat, lon } as { lat: number; lon: number };
}
