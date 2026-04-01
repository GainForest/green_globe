import ClimateAIAgent from "@/lib/atproto/agent";
import { PDS_ENDPOINT } from "@/config/atproto";
import { APPROVED_ORGANIZATION_DIDS } from "@/config/approved-organizations";
import { hyperindexClient } from "@/lib/hyperindex/client";
import {
  ALL_ORGANIZATION_INFOS,
  ALL_DEFAULT_SITES,
  LOCATIONS_BY_DID,
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
 * - 1 call for all defaultSite pointers
 * - 1 call per org for location records (to get GeoJSON blob CIDs)
 * - 1 PDS call per org to download the GeoJSON blob (binary content)
 *
 * Only organizations with visibility 'Public' that appear in the
 * APPROVED_ORGANIZATION_DIDS allowlist are returned.
 */
export async function listAllOrganizations(options?: {
  includeInfo?: boolean;
  includeCoordinates?: boolean;
}): Promise<IndexedOrganization[]> {
  // Step 1: Fetch all public org info records from Hyperindex
  // Hyperindex caps at 100 per page, so we paginate to get all records
  const allInfos = await fetchAllOrgInfos();

  // Step 2: Filter to approved DIDs
  const approvedInfos = allInfos.filter((edge) =>
    APPROVED_ORGANIZATION_DIDS.has(edge.node.did)
  );

  // Step 3: If coordinates are needed, fetch defaultSite pointers and
  // build location lookup maps — all from Hyperindex
  let coordinateMap: Map<string, { lat: number; lon: number }> | null = null;

  if (options?.includeCoordinates) {
    coordinateMap = await buildCoordinateMap(
      approvedInfos.map((e) => e.node.did)
    );
  }

  // Step 4: Assemble results
  const results: IndexedOrganization[] = [];

  for (const edge of approvedInfos) {
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

// ── Coordinate resolution ──────────────────────────────────────────────────────

/**
 * Builds a DID → {lat, lon} map for the given organization DIDs.
 *
 * Flow:
 * 1. Fetch all defaultSite records from Hyperindex (1 call) → DID→locationURI map
 * 2. For each DID, fetch its locations from Hyperindex (parallel) → get blob CIDs
 * 3. Match the defaultSite URI to the correct location record
 * 4. Decode the blob CID from Hyperindex's Go-serialized format
 * 5. Download GeoJSON blobs from PDS (parallel) → compute centroids
 */
async function buildCoordinateMap(
  approvedDids: string[]
): Promise<Map<string, { lat: number; lon: number }>> {
  const coordMap = new Map<string, { lat: number; lon: number }>();

  // Step 1: Fetch all defaultSite pointers (1 Hyperindex call)
  const defaultSiteResponse = await hyperindexClient.request<{
    appGainforestOrganizationDefaultSite: Connection<HiOrganizationDefaultSite>;
    }>(ALL_DEFAULT_SITES, { first: 200 });

  const defaultSiteMap = new Map<string, string>();
  for (const edge of defaultSiteResponse.appGainforestOrganizationDefaultSite
    .edges) {
    if (edge.node.site) {
      defaultSiteMap.set(edge.node.did, edge.node.site);
    }
  }

  // Step 2: For each approved org that has a defaultSite, fetch its locations
  // from Hyperindex in parallel to get blob CIDs
  const didsWithDefault = approvedDids.filter((did) =>
    defaultSiteMap.has(did)
  );

  const locationResults = await Promise.all(
    didsWithDefault.map(async (did) => {
      const siteUri = defaultSiteMap.get(did)!;
      try {
        const coords = await resolveCoordinatesFromHyperindex(did, siteUri);
        return { did, coords };
      } catch {
        // Try legacy PDS fallback for orgs still on organization.site
        try {
          const coords = await resolveFromLegacySite(did, siteUri);
          return { did, coords };
        } catch {
          return { did, coords: null };
        }
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
 * Resolves coordinates for an org using Hyperindex for metadata + PDS for blob.
 *
 * 1. Fetches location records for the DID from Hyperindex (1 call)
 * 2. Finds the location matching the defaultSite URI
 * 3. Decodes the blob CID from Hyperindex's Go-serialized ref format
 * 4. Downloads the GeoJSON blob from PDS (1 call)
 * 5. Computes centroid with Turf.js
 */
async function resolveCoordinatesFromHyperindex(
  did: string,
  defaultSiteUri: string
): Promise<{ lat: number; lon: number } | null> {
  if (!defaultSiteUri.includes("app.certified.location")) {
    return null; // Not a certified location — will fall back to legacy
  }

  // Fetch all locations for this DID from Hyperindex
  const response = await hyperindexClient.request<{
    appCertifiedLocation: Connection<HiCertifiedLocation>;
  }>(LOCATIONS_BY_DID, { did, first: 100 });

  const locations = response.appCertifiedLocation.edges.map((e) => e.node);
  if (!locations.length) return null;

  // Find the location matching the defaultSite URI
  const targetLocation = locations.find((loc) => loc.uri === defaultSiteUri);
  if (!targetLocation) return null;

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
