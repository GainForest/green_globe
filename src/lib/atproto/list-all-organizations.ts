import { gainforestSdk } from "@/config/gainforest-sdk.server";
import { allowedPDSDomains } from "@/config/gainforest-sdk";
import ClimateAIAgent from "@/lib/atproto/agent";

export type IndexedOrganization = {
  did: string;
  name?: string;
  country?: string;
  lat?: number;
  lon?: number;
};

/**
 * Enumerates all organizations on the climateai.org PDS and fetches their
 * info and/or coordinates via the SDK server caller.
 *
 * Replaces the Airtable-based organization index. Only organizations with
 * visibility 'Public' are returned. Repos that lack an org info record
 * (test accounts, etc.) are silently skipped.
 */
export async function listAllOrganizations(options?: {
  includeInfo?: boolean;
  includeCoordinates?: boolean;
}): Promise<IndexedOrganization[]> {
  const pdsDomain = allowedPDSDomains[0]; // 'climateai.org'

  // Step 1: List all repos on the PDS with cursor-based pagination
  const repos: { did: string }[] = [];
  let cursor: string | undefined = undefined;

  do {
    const reposResponse = await ClimateAIAgent.com.atproto.sync.listRepos({
      limit: 500,
      cursor,
    });
    repos.push(...reposResponse.data.repos);
    cursor = reposResponse.data.cursor;
  } while (cursor);

  // Step 2: For each repo, fetch org info and/or coordinates via SDK server caller
  const apiCaller = gainforestSdk.getServerCaller();

  const results = await Promise.all(
    repos.map(async (repo): Promise<IndexedOrganization | null> => {
      try {
        const org: IndexedOrganization = { did: repo.did };

        if (options?.includeInfo) {
          // Fetch org info via SDK — throws if record doesn't exist
          const infoResponse = await apiCaller.gainforest.organization.info.get(
            {
              did: repo.did,
              pdsDomain,
            }
          );
          const info = infoResponse.value;

          // Filter: only include Public orgs
          if (info.visibility !== "Public") return null;

          org.name = info.displayName;
          org.country = info.country;
        }

        if (options?.includeCoordinates) {
          try {
            const coordinates = await getOrganizationCoordinates(repo.did);
            if (coordinates) {
              org.lat = coordinates.lat;
              org.lon = coordinates.lon;
            }
          } catch {
            // No default location — skip coordinates silently
          }
        }

        return org;
      } catch {
        // Repo has no org info record (test accounts, etc.) — skip silently
        return null;
      }
    })
  );

  return results.filter((r): r is IndexedOrganization => r !== null);
}

/**
 * Resolves the default site coordinates for an organization.
 *
 * Replicates the logic from /api/list-organizations/route.ts:
 *   getRecord(defaultSite) → parse AT-URI → getRecord(site) → extract lat/lon
 *
 * Uses the ClimateAIAgent directly since the SDK's hypercerts.location.*
 * methods target app.certified.location, while the existing PDS data stores
 * coordinates in app.gainforest.organization.site with direct lat/lon fields.
 */
async function getOrganizationCoordinates(
  did: string
): Promise<{ lat: number; lon: number } | null> {
  const defaultSiteData = await ClimateAIAgent.com.atproto.repo.getRecord({
    repo: did,
    collection: "app.gainforest.organization.defaultSite",
    rkey: "self",
  });

  const siteAtURI = defaultSiteData.success
    ? (defaultSiteData.data.value as { site?: string }).site
    : null;

  if (!siteAtURI) return null;

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
