import { toKebabCase } from "@/lib/utils";
import {
  MeasuredTreesGeoJSON,
  NormalizedTreeFeature,
  TreeFeature,
} from "./types";
import { getTreeSpeciesName } from "../../Map/sources-and-layers/measured-trees";
import ClimateAIAgent from "@/lib/atproto/agent";
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

// ---------------------------------------------------------------------------
// fetchSiteShapefile — fetch GeoJSON boundary from ATProto blob or external URI
// ---------------------------------------------------------------------------

/**
 * Fetches the GeoJSON boundary for a site from either:
 *   1. An ATProto blob ref (via com.atproto.sync.getBlob)
 *   2. An external boundary URL (plain HTTP fetch)
 *
 * Returns the parsed GeoJSON or null on failure.
 */
export const fetchSiteShapefile = async (
  did: string,
  shapefile: unknown
): Promise<GeoJSON.GeoJsonObject | null> => {
  try {
    // Case 1: blob ref object with a CID link
    if (isBlobRef(shapefile) && shapefile.ref?.$link) {
      const cid = shapefile.ref.$link;
      const response = await ClimateAIAgent.com.atproto.sync.getBlob({
        did,
        cid,
      });
      const buffer = Buffer.from(response.data as unknown as ArrayBuffer);
      const text = buffer.toString("utf8");
      return JSON.parse(text) as GeoJSON.GeoJsonObject;
    }

    // Case 2: string boundary URL
    if (typeof shapefile === "string" && shapefile.trim().length > 0) {
      const response = await fetch(shapefile.trim(), {
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

    // Case 3: AT-URI string (at://did/collection/rkey) — resolve via getBlob
    // by first looking up the record to get the blob CID
    if (
      typeof shapefile === "string" &&
      shapefile.startsWith("at://") &&
      shapefile.trim().length > 0
    ) {
      const response = await fetch(
        `${PDS_ENDPOINT}/xrpc/com.atproto.repo.getRecord?repo=${encodeURIComponent(did)}&collection=app.gainforest.organization.site&rkey=${encodeURIComponent(shapefile.split("/").pop() ?? "")}`
      );
      if (!response.ok) return null;
      return (await response.json()) as GeoJSON.GeoJsonObject;
    }

    console.warn("fetchSiteShapefile: no usable shapefile source", shapefile);
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
  if (isBlobRef(treesRef) && treesRef.ref?.$link && did) {
    const cid = treesRef.ref.$link;
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
