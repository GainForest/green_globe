import ClimateAIAgent from "@/lib/atproto/agent";
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
 * (1 call for all orgs instead of N×getRecord). Falls back to the PDS for
 * coordinates since defaultSite.site AT-URIs still reference organization.site.
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
    for (const edge of defaultSiteResponse.appGainforestOrganizationDefaultSite
      .edges) {
      if (edge.node.site) {
        defaultSiteMap.set(edge.node.did, edge.node.site);
      }
    }
  }

  // Step 4: Resolve coordinates for each org (PDS calls for site records)
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
            const coordinates =
              await resolveCoordinatesFromSiteURI(info.did, siteAtURI);
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

/**
 * Resolves coordinates from a site AT-URI.
 *
 * The defaultSite.site field currently contains AT-URIs pointing to
 * app.gainforest.organization.site records on the PDS. These records
 * have direct lat/lon fields.
 *
 * TODO: Once defaultSite.site AT-URIs are updated to point to
 * app.certified.location records, update this function to parse
 * GeoJSON blobs instead.
 */
async function resolveCoordinatesFromSiteURI(
  did: string,
  siteAtURI: string
): Promise<{ lat: number; lon: number } | null> {
  // Parse the AT-URI to extract the rkey after the collection segment
  const siteCollectionId = siteAtURI.split(
    "app.gainforest.organization.site/"
  )[1];

  if (!siteCollectionId) return null;

  const siteData = await ClimateAIAgent.com.atproto.repo.getRecord({
    repo: did,
    collection: "app.gainforest.organization.site",
    rkey: siteCollectionId,
  });

  if (!siteData.success) return null;

  const { lat, lon } = siteData.data.value as { lat?: number; lon?: number };
  if (lat === undefined || lon === undefined) return null;

  return { lat, lon };
}
