import ClimateAIAgent from "@/lib/atproto/agent";
import { PDS_ENDPOINT } from "@/config/atproto";
import { APPROVED_ORGANIZATION_DIDS } from "@/config/approved-organizations";
import { hyperindexClient } from "@/lib/hyperindex/client";
import {
  ALL_ORGANIZATION_INFOS,
  ALL_DEFAULT_SITES,
} from "@/lib/hyperindex/queries";
import type {
  Connection,
  HiOrganizationInfo,
  HiOrganizationDefaultSite,
} from "@/lib/hyperindex/types";
import { centroid } from "@turf/turf";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";

export type IndexedOrganization = {
  did: string;
  name?: string;
  country?: string;
  lat?: number;
  lon?: number;
};

/**
 * Fetches all approved, public organizations and optionally their coordinates.
 *
 * Uses Hyperindex GraphQL API as the primary data source for organization info
 * and defaultSite pointers (2 calls for all orgs). Coordinates are resolved
 * from the default site's location record on the PDS.
 *
 * Only organizations with visibility 'Public' that appear in the
 * APPROVED_ORGANIZATION_DIDS allowlist are returned.
 */
export async function listAllOrganizations(options?: {
  includeInfo?: boolean;
  includeCoordinates?: boolean;
}): Promise<IndexedOrganization[]> {
  // Step 1: Fetch all public org info records from Hyperindex (1 call)
  const infoResponse = await hyperindexClient.request<{
    appGainforestOrganizationInfo: Connection<HiOrganizationInfo>;
  }>(ALL_ORGANIZATION_INFOS, { first: 100 });

  const allInfos = infoResponse.appGainforestOrganizationInfo.edges;

  // Step 2: Filter to approved DIDs and build organization records
  const approvedInfos = allInfos.filter((edge) =>
    APPROVED_ORGANIZATION_DIDS.has(edge.node.did)
  );

  // Step 3: If coordinates are needed, fetch all defaultSite records in one call
  // and build a DID → site-AT-URI lookup map
  let defaultSiteMap: Map<string, string> | null = null;

  if (options?.includeCoordinates) {
    const defaultSiteResponse = await hyperindexClient.request<{
      appGainforestOrganizationDefaultSite: Connection<HiOrganizationDefaultSite>;
    }>(ALL_DEFAULT_SITES, { first: 100 });

    defaultSiteMap = new Map();
    for (const edge of defaultSiteResponse
      .appGainforestOrganizationDefaultSite.edges) {
      if (edge.node.site) {
        defaultSiteMap.set(edge.node.did, edge.node.site);
      }
    }
  }

  // Step 4: Resolve coordinates for each org
  const results = await Promise.all(
    approvedInfos.map(async (edge): Promise<IndexedOrganization | null> => {
      const info = edge.node;
      const org: IndexedOrganization = { did: info.did };

      if (options?.includeInfo) {
        org.name = info.displayName;
        org.country = info.country;
      }

      if (options?.includeCoordinates && defaultSiteMap) {
        try {
          const siteAtURI = defaultSiteMap.get(info.did);
          if (siteAtURI) {
            const coordinates = await resolveCoordinates(info.did, siteAtURI);
            if (coordinates) {
              org.lat = coordinates.lat;
              org.lon = coordinates.lon;
            }
          }
        } catch {
          // No default location — skip coordinates silently
        }
      }

      return org;
    })
  );

  return results.filter((r): r is IndexedOrganization => r !== null);
}

// ── Coordinate resolution ──────────────────────────────────────────────────────

/**
 * Resolves coordinates from a site AT-URI.
 *
 * Handles both:
 * - app.certified.location — downloads GeoJSON blob, computes centroid
 * - app.gainforest.organization.site (legacy) — uses direct lat/lon fields
 */
async function resolveCoordinates(
  did: string,
  siteAtURI: string
): Promise<{ lat: number; lon: number } | null> {
  if (siteAtURI.includes("app.certified.location")) {
    return resolveFromCertifiedLocation(did, siteAtURI);
  }
  if (siteAtURI.includes("app.gainforest.organization.site")) {
    return resolveFromLegacySite(did, siteAtURI);
  }
  return null;
}

/**
 * Resolves coordinates from an app.certified.location record.
 *
 * Fetches the record to get the GeoJSON blob CID, downloads the blob,
 * parses the GeoJSON, and computes the centroid.
 */
async function resolveFromCertifiedLocation(
  did: string,
  atURI: string
): Promise<{ lat: number; lon: number } | null> {
  const rkey = atURI.split("/").pop();
  if (!rkey) return null;

  // Fetch the location record from PDS
  const record = await ClimateAIAgent.com.atproto.repo.getRecord({
    repo: did,
    collection: "app.certified.location",
    rkey,
  });

  if (!record.success) return null;

  const location = (record.data.value as Record<string, unknown>)
    .location as Record<string, unknown> | undefined;
  if (!location) return null;

  // Extract blob CID from the location field
  const blob = location.blob as
    | { ref?: { $link?: string }; mimeType?: string }
    | undefined;
  const cid = blob?.ref?.$link;
  if (!cid) return null;

  // Download the GeoJSON blob
  const blobUrl = `${PDS_ENDPOINT}/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${cid}`;
  const blobResponse = await fetch(blobUrl);
  if (!blobResponse.ok) return null;

  const geojson = (await blobResponse.json()) as FeatureCollection<
    Geometry,
    GeoJsonProperties
  >;

  // Compute centroid
  try {
    const center = centroid(geojson);
    const [lon, lat] = center.geometry.coordinates;
    return { lat, lon };
  } catch {
    return null;
  }
}

/**
 * Resolves coordinates from a legacy app.gainforest.organization.site record.
 * These records have direct lat/lon string fields.
 *
 * Only used for the ~3 remaining orgs whose defaultSite hasn't been migrated.
 */
async function resolveFromLegacySite(
  did: string,
  atURI: string
): Promise<{ lat: number; lon: number } | null> {
  const rkey = atURI.split("app.gainforest.organization.site/")[1];
  if (!rkey) return null;

  const siteData = await ClimateAIAgent.com.atproto.repo.getRecord({
    repo: did,
    collection: "app.gainforest.organization.site",
    rkey,
  });

  if (!siteData.success) return null;

  const value = siteData.data.value as {
    lat?: string | number;
    lon?: string | number;
  };
  const lat = Number(value.lat);
  const lon = Number(value.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return { lat, lon };
}
