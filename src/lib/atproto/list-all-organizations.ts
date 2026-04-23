import ClimateAIAgent from "@/lib/atproto/agent";
import { PDS_ENDPOINT } from "@/config/atproto";
import { hyperindexClient } from "@/lib/hyperindex/client";
import {
  ALL_ORGANIZATION_INFOS,
  ALL_DEFAULT_SITES,
  CERTIFIED_LOCATION_BY_URI,
} from "@/lib/hyperindex/queries";
import type {
  Connection,
  Edge,
  HiOrganizationInfo,
  HiOrganizationDefaultSite,
  HiCertifiedLocation,
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
 * Uses Hyperindex GraphQL API as the primary data source:
 * - 1 call for all org info records
 * - paginated calls for all defaultSite pointers
 * - 1 call per org for certified location lookup by AT-URI
 * - 1 PDS call per org to download the GeoJSON blob (binary content)
 *
 * Only organizations with visibility 'Public' are returned — this filter is
 * applied at the Hyperindex query layer via `ALL_ORGANIZATION_INFOS`.
 */
export async function listAllOrganizations(options?: {
  includeInfo?: boolean;
  includeCoordinates?: boolean;
}): Promise<IndexedOrganization[]> {
  // Fetch all public org info records from Hyperindex.
  // Hyperindex caps at 100 per page, so we paginate to get all records.
  const orgInfos = await fetchAllOrgInfos();

  // If coordinates are needed, fetch defaultSite pointers and
  // build location lookup maps — all from Hyperindex.
  let coordinateMap: Map<string, { lat: number; lon: number }> | null = null;

  if (options?.includeCoordinates) {
    coordinateMap = await buildCoordinateMap(orgInfos.map((e) => e.node.did));
  }

  // Assemble results.
  const results: IndexedOrganization[] = [];

  for (const edge of orgInfos) {
    const info = edge.node;
    const org: IndexedOrganization = { did: info.did };

    if (options?.includeInfo) {
      org.name = info.displayName;
      org.country = info.country;
    }

    if (coordinateMap) {
      const coords = coordinateMap.get(info.did);
      if (coords) {
        org.lat = coords.lat;
        org.lon = coords.lon;
      }
    }

    results.push(org);
  }

  return results;
}

// ── Paginated Hyperindex fetchers ───────────────────────────────────────────────

/**
 * Fetches all public org info records from Hyperindex, paginating through
 * all pages (Hyperindex caps at 100 per page).
 */
async function fetchAllOrgInfos(): Promise<Edge<HiOrganizationInfo>[]> {
  const allEdges: Edge<HiOrganizationInfo>[] = [];
  let cursor: string | null = null;

  do {
    const response: { appGainforestOrganizationInfo: Connection<HiOrganizationInfo> } =
      await hyperindexClient.request(ALL_ORGANIZATION_INFOS, {
        first: 100,
        after: cursor,
      });

    const connection = response.appGainforestOrganizationInfo;
    allEdges.push(...connection.edges);

    if (connection.pageInfo.hasNextPage) {
      cursor = connection.pageInfo.endCursor;
    } else {
      break;
    }
  } while (cursor);

  return allEdges;
}

/**
 * Fetches all defaultSite records from Hyperindex, paginating through all pages.
 */
async function fetchAllDefaultSites(): Promise<
  Edge<HiOrganizationDefaultSite>[]
> {
  const allEdges: Edge<HiOrganizationDefaultSite>[] = [];
  let cursor: string | null = null;

  do {
    const response: {
      appGainforestOrganizationDefaultSite: Connection<HiOrganizationDefaultSite>;
    } = await hyperindexClient.request(ALL_DEFAULT_SITES, {
      first: 100,
      after: cursor,
    });

    const connection = response.appGainforestOrganizationDefaultSite;
    allEdges.push(...connection.edges);

    if (connection.pageInfo.hasNextPage) {
      cursor = connection.pageInfo.endCursor;
    } else {
      break;
    }
  } while (cursor);

  return allEdges;
}

// ── Coordinate resolution ──────────────────────────────────────────────────────

/**
 * Builds a DID → {lat, lon} map for the given organization DIDs.
 *
 * Flow:
 * 1. Fetch all defaultSite records from Hyperindex (paginated) → DID→siteURI map
 * 2. Route each site URI explicitly by collection:
 *    - app.certified.location → Hyperindex by-URI lookup + blob download
 *    - app.gainforest.organization.site → legacy PDS record fallback
 * 3. Compute map-point coordinates for each organization
 */
async function buildCoordinateMap(
  approvedDids: string[]
): Promise<Map<string, { lat: number; lon: number }>> {
  const coordMap = new Map<string, { lat: number; lon: number }>();

  const defaultSiteMap = new Map<string, string>();
  for (const edge of await fetchAllDefaultSites()) {
    if (edge.node.site) {
      defaultSiteMap.set(edge.node.did, edge.node.site);
    }
  }

  // Step 2: Resolve coordinates for each org using explicit URI routing.
  const didsWithDefault = approvedDids.filter((did) =>
    defaultSiteMap.has(did)
  );

  const locationResults = await Promise.all(
    didsWithDefault.map(async (did) => {
      const siteUri = defaultSiteMap.get(did)!;
      try {
        const coords = await resolveCoordinatesFromSiteUri(did, siteUri);
        return { did, coords };
      } catch {
        return { did, coords: null };
      }
    })
  );

  for (const { did, coords } of locationResults) {
    if (coords) {
      coordMap.set(did, coords);
    }
  }

  return coordMap;
}

/**
 * Resolves coordinates from a defaultSite AT-URI by routing explicitly based on
 * the collection path embedded in the URI.
 */
async function resolveCoordinatesFromSiteUri(
  did: string,
  siteUri: string
): Promise<{ lat: number; lon: number } | null> {
  if (siteUri.includes("app.certified.location")) {
    return resolveCoordinatesFromCertifiedLocationUri(siteUri);
  }

  if (siteUri.includes("app.gainforest.organization.site")) {
    return resolveFromLegacySite(did, siteUri);
  }

  return null;
}

/**
 * Resolves coordinates for a certified location using Hyperindex for metadata +
 * PDS for the GeoJSON blob.
 *
 * 1. Fetches the exact location from Hyperindex by AT-URI (1 call)
 * 2. Extracts the blob CID from the location record
 * 3. Decodes the blob CID from Hyperindex's Go-serialized ref format
 * 4. Downloads the GeoJSON blob from PDS (1 call)
 * 5. Computes centroid with Turf.js
 */
async function resolveCoordinatesFromCertifiedLocationUri(
  locationUri: string
): Promise<{ lat: number; lon: number } | null> {
  const response = await hyperindexClient.request<{
    appCertifiedLocationByUri: HiCertifiedLocation | null;
  }>(CERTIFIED_LOCATION_BY_URI, { uri: locationUri });

  const targetLocation = response.appCertifiedLocationByUri;
  if (!targetLocation) return null;

  const did = targetLocation.did;

  // Extract blob CID — decode from Hyperindex's Go-serialized format
  const blobRef = extractBlobRef(targetLocation.location);
  if (!blobRef) return null;

  const cid = decodeBlobCid(blobRef);
  if (!cid) return null;

  // Download GeoJSON blob from PDS
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

// ── Blob CID decoding ──────────────────────────────────────────────────────────

/**
 * Extracts the raw blob ref string from a HiCertifiedLocation's location field.
 *
 * Hyperindex returns blob refs in a Go-serialized format:
 *   "map[Content:BASE64DATA Number:42]"
 * instead of a proper CID string.
 */
function extractBlobRef(
  location: HiCertifiedLocation["location"]
): string | null {
  if (!location || typeof location !== "object") return null;

  // Handle the SmallBlob variant
  if ("blob" in location && location.blob) {
    const blob = location.blob;
    if (typeof blob === "object" && "ref" in blob) {
      const ref = blob.ref;
      if (typeof ref === "string") return ref;
      // If ref is an object with $link (proper format), return that
      if (ref && typeof ref === "object" && "$link" in ref) {
        return (ref as { $link: string }).$link;
      }
    }
  }

  return null;
}

/**
 * Decodes a blob CID from Hyperindex's Go-serialized format.
 *
 * Input:  "map[Content:AAFVEiASeY4pfANJYpNKcyHWizUdmGSpL2Sg0VGSlm5BHcXesA== Number:42]"
 * Output: "bafkreiaspghcs7adjfrjgsttehliwni5tbsksl3eudivdeuwnzar3ro6wa"
 *
 * If the input is already a valid CID string (starts with "baf"), returns as-is.
 */
function decodeBlobCid(ref: string): string | null {
  if (!ref) return null;

  // Already a proper CID
  if (ref.startsWith("baf")) return ref;

  // Hyperindex may serialize refs as: "map[$link:baf... ]"
  const linkMatch = ref.match(/\$link:([a-z0-9]+)/i);
  if (linkMatch) {
    return linkMatch[1];
  }

  // Go map serialization format: "map[Content:BASE64 Number:NN]"
  const match = ref.match(/Content:([A-Za-z0-9+/=]+)/);
  if (!match) return null;

  const base64Data = match[1];
  const bytes = Buffer.from(base64Data, "base64");

  // First byte is 0x00 padding, skip it — rest is CID v1 bytes
  if (bytes.length < 2 || bytes[0] !== 0x00) return null;
  const cidBytes = bytes.subarray(1);

  // Encode as base32lower with 'b' multibase prefix (standard CIDv1)
  return "b" + base32Encode(cidBytes);
}

/** RFC 4648 base32 encoding (lowercase, no padding). */
function base32Encode(buf: Uint8Array): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz234567";
  let bits = 0;
  let value = 0;
  let output = "";
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }
  return output;
}
