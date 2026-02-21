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
// fetchMeasuredTreesShapefile — fetch tree planting GeoJSON from S3
// ---------------------------------------------------------------------------

export const fetchMeasuredTreesShapefile = async (
  projectName: string
): Promise<MeasuredTreesGeoJSON | null> => {
  const kebabCaseProjectName = toKebabCase(projectName);

  const endpoint = `shapefiles/${kebabCaseProjectName}-all-tree-plantings.geojson`;
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_AWS_STORAGE}/${endpoint}`
    );
    if (response.ok) {
      const result =
        (await response.json()) as MeasuredTreesGeoJSON<TreeFeature>;

      const normalizedFeatures: NormalizedTreeFeature[] = result.features.map(
        (feature, index: number) => ({
          ...feature,
          properties: {
            ...feature.properties,
            species:
              getTreeSpeciesName(feature.properties)?.trim() ?? "Unknown",
            type: "measured-tree",
          },
          id: index,
        })
      );
      const normalizedResult: MeasuredTreesGeoJSON = {
        ...result,
        features: normalizedFeatures,
      };
      return normalizedResult;
    } else {
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};
