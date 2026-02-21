import { toKebabCase } from "@/lib/utils";
import {
  MeasuredTreesGeoJSON,
  NormalizedTreeFeature,
  TreeFeature,
} from "./types";
import { getTreeSpeciesName } from "../../Map/sources-and-layers/measured-trees";
import { PDS_ENDPOINT } from "@/config/atproto";

// ---------------------------------------------------------------------------
// ATProto blob ref shape (subset of what the PDS returns)
// ---------------------------------------------------------------------------
type BlobRef = {
  $type?: string;
  ref?: { $link: string };
  mimeType?: string;
  size?: number;
};

const isBlobRef = (value: unknown): value is BlobRef =>
  typeof value === "object" &&
  value !== null &&
  ("ref" in value || "$type" in value);

/**
 * Unwrap a SmallBlob / SmallImage wrapper if present.
 *
 * ATProto site records wrap BlobRefs in a union object:
 *   { $type: "org.hypercerts.defs#smallBlob", blob: <BlobRef> }
 *
 * If the value has a `blob` property we treat it as a SmallBlob wrapper and
 * return the inner BlobRef; otherwise the value is returned unchanged.
 */
const unwrapSmallBlob = (value: unknown): unknown => {
  if (
    typeof value === "object" &&
    value !== null &&
    "blob" in value
  ) {
    return (value as Record<string, unknown>).blob;
  }
  return value;
};

// ---------------------------------------------------------------------------
// fetchSiteShapefile — fetch GeoJSON boundary from ATProto blob or external URI
// ---------------------------------------------------------------------------

/**
 * Fetches the GeoJSON boundary for a site from either:
 *   1. An ATProto blob ref (via com.atproto.sync.getBlob XRPC URL)
 *   2. An AT-URI string (at://...) — resolved to a record, blob CID extracted, then fetched
 *   3. An external HTTP(S) boundary URL (plain HTTP fetch)
 *
 * Returns the parsed GeoJSON or null on failure.
 */
export const fetchSiteShapefile = async (
  did: string,
  shapefile: unknown
): Promise<GeoJSON.GeoJsonObject | null> => {
  try {
    // Unwrap SmallBlob / SmallImage wrapper if present.
    // ATProto site records wrap the BlobRef in { $type: '...', blob: <BlobRef> }.
    const resolvedShapefile = unwrapSmallBlob(shapefile);

    // Case 1: blob ref object with a CID link — fetch via PDS XRPC URL (browser-safe)
    if (isBlobRef(resolvedShapefile) && resolvedShapefile.ref?.$link) {
      const cid = resolvedShapefile.ref.$link;
      const url = `${PDS_ENDPOINT}/xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(did)}&cid=${encodeURIComponent(cid)}`;
      const response = await fetch(url);
      if (!response.ok) {
        console.error(
          `fetchSiteShapefile: blob fetch failed (${response.status})`
        );
        return null;
      }
      return (await response.json()) as GeoJSON.GeoJsonObject;
    }

    // Case 2: AT-URI string (at://did/collection/rkey) — must be checked BEFORE
    // the generic string check so it is not mistakenly fetched as an HTTP URL.
    // Resolve the record, extract the shapefile blob CID, then fetch the blob.
    if (typeof resolvedShapefile === "string" && resolvedShapefile.startsWith("at://")) {
      const rkey = resolvedShapefile.split("/").pop() ?? "";
      const recordUrl = `${PDS_ENDPOINT}/xrpc/com.atproto.repo.getRecord?repo=${encodeURIComponent(did)}&collection=app.gainforest.organization.site&rkey=${encodeURIComponent(rkey)}`;
      const recordResponse = await fetch(recordUrl);
      if (!recordResponse.ok) return null;
      const record = (await recordResponse.json()) as {
        value?: { shapefile?: unknown };
      };
      const blobRef = record.value?.shapefile;
      if (!isBlobRef(blobRef) || !blobRef.ref?.$link) return null;
      const cid = blobRef.ref.$link;
      const blobUrl = `${PDS_ENDPOINT}/xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(did)}&cid=${encodeURIComponent(cid)}`;
      const blobResponse = await fetch(blobUrl);
      if (!blobResponse.ok) {
        console.error(
          `fetchSiteShapefile: blob fetch failed (${blobResponse.status})`
        );
        return null;
      }
      return (await blobResponse.json()) as GeoJSON.GeoJsonObject;
    }

    // Case 3: generic HTTP(S) boundary URL
    if (typeof resolvedShapefile === "string" && resolvedShapefile.trim().length > 0) {
      const response = await fetch(resolvedShapefile.trim(), {
        headers: {
          Accept: "application/geo+json, application/json;q=0.9, */*;q=0.1",
        },
      });
      if (!response.ok) {
        console.error(
          `fetchSiteShapefile: boundary fetch failed (${response.status})`
        );
        return null;
      }
      return (await response.json()) as GeoJSON.GeoJsonObject;
    }

    console.warn("fetchSiteShapefile: no usable shapefile source", resolvedShapefile);
    return null;
  } catch (error) {
    console.error("fetchSiteShapefile error:", error);
    return null;
  }
};

// ---------------------------------------------------------------------------
// fetchMeasuredTreesShapefile — fetch tree planting GeoJSON from ATProto blob
// or fall back to S3 if no blob ref is available
// ---------------------------------------------------------------------------

/**
 * Normalizes a raw MeasuredTreesGeoJSON<TreeFeature> into the normalized form.
 */
const normalizeMeasuredTreesGeoJSON = (
  result: MeasuredTreesGeoJSON<TreeFeature>
): MeasuredTreesGeoJSON => {
  const normalizedFeatures: NormalizedTreeFeature[] = result.features.map(
    (feature, index: number) => ({
      ...feature,
      properties: {
        ...feature.properties,
        species: getTreeSpeciesName(feature.properties)?.trim() ?? "Unknown",
        type: "measured-tree",
      },
      id: index,
    })
  );
  return { ...result, features: normalizedFeatures };
};

/**
 * Fetches the measured trees GeoJSON for a site.
 *
 * Priority:
 *   1. ATProto blob ref on the site record (via com.atproto.sync.getBlob)
 *   2. S3 fallback using the project slug (backward compatibility)
 *
 * @param slug     - Project slug (for S3 fallback path construction)
 * @param treesRef - Optional blob ref from the ATProto site record
 * @param did      - Organization DID (required when treesRef is provided)
 */
export const fetchMeasuredTreesShapefile = async (
  slug: string,
  treesRef?: unknown,
  did?: string
): Promise<MeasuredTreesGeoJSON | null> => {
  // --- Path 1: ATProto blob ---
  // Unwrap SmallBlob / SmallImage wrapper if present (same pattern as fetchSiteShapefile).
  const resolvedTreesRef = unwrapSmallBlob(treesRef);
  if (isBlobRef(resolvedTreesRef) && resolvedTreesRef.ref?.$link && did) {
    const cid = resolvedTreesRef.ref.$link;
    try {
      const url = `${PDS_ENDPOINT}/xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(did)}&cid=${encodeURIComponent(cid)}`;
      const response = await fetch(url);
      if (response.ok) {
        const result =
          (await response.json()) as MeasuredTreesGeoJSON<TreeFeature>;
        return normalizeMeasuredTreesGeoJSON(result);
      }
      console.warn(
        `fetchMeasuredTreesShapefile: blob fetch failed (${response.status}), falling back to S3`
      );
    } catch (error) {
      console.warn(
        "fetchMeasuredTreesShapefile: blob fetch error, falling back to S3",
        error
      );
    }
  }

  // --- Path 2: S3 fallback ---
  const kebabCaseSlug = toKebabCase(slug);
  const endpoint = `shapefiles/${kebabCaseSlug}-all-tree-plantings.geojson`;
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_AWS_STORAGE}/${endpoint}`
    );
    if (response.ok) {
      const result =
        (await response.json()) as MeasuredTreesGeoJSON<TreeFeature>;
      return normalizeMeasuredTreesGeoJSON(result);
    } else {
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};
