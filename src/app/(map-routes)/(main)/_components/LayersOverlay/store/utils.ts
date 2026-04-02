import { LayersAPIResponse, Layer, LegendEntry } from "./types";
import { toKebabCase } from "@/lib/utils";
import { hyperindexClient } from "@/lib/hyperindex/client";
import { ALL_LAYER_RECORDS } from "@/lib/hyperindex/queries";
import type { Connection } from "@/lib/hyperindex/types";

const VALID_LAYER_TYPES = new Set([
  "geojson_points",
  "geojson_points_trees",
  "geojson_line",
  "choropleth",
  "choropleth_shannon",
  "raster_tif",
  "tms_tile",
  "heatmap",
  "contour",
  "satellite_overlay",
]);

// RawLayerValue uses unknown fields because layer records are fetched through
// Hyperindex's generic records() query, which returns raw JSON values. The SDK's
// AppGainforestOrganizationLayer type (Main$3) is stale and only declares the
// original five fields; the full field set lives in lexicon-api/types/app/
// gainforest/organization/layer.ts (regenerated via `bun run codegen:lexicon-api`).
// Access all extended fields (category, isDefault, legend, opacity, etc.) through
// the [k: string]: unknown index signature and validate types at runtime.
// See src/lib/atproto/sdk-utils.ts for the full list of missing SDK fields.
type RawLayerValue = {
  name?: unknown;
  type?: unknown;
  uri?: unknown;
  category?: unknown;
  /** isDefault (not visibility) is the lexicon field for default visibility */
  isDefault?: unknown;
  legend?: unknown;
  description?: unknown;
  [k: string]: unknown;
};

type RawLayerRecord = {
  uri: string;
  did?: string;
  value: RawLayerValue;
};

type HyperindexLayerRecordNode = {
  uri: string;
  did: string;
  value: RawLayerValue;
};

type LayerRecordsResponse = {
  records: Connection<HyperindexLayerRecordNode>;
};

const normalizeAtprotoLayer = (raw: RawLayerRecord): Layer => {
  const v = raw.value;
  const type =
    typeof v.type === "string" && VALID_LAYER_TYPES.has(v.type)
      ? (v.type as Layer["type"])
      : "geojson_points";

  const legend: LegendEntry[] | undefined = Array.isArray(v.legend)
    ? (v.legend as { label?: unknown; color?: unknown; value?: unknown }[])
        .filter(
          (entry) =>
            typeof entry.label === "string" && typeof entry.color === "string"
        )
        .map((entry) => ({
          label: entry.label as string,
          color: entry.color as string,
          value: typeof entry.value === "string" ? entry.value : undefined,
        }))
    : undefined;

  return {
    name: typeof v.name === "string" ? v.name : "",
    type,
    endpoint: typeof v.uri === "string" ? cleanEndpoint(v.uri) : "",
    category: typeof v.category === "string" ? v.category : "",
    description: typeof v.description === "string" ? v.description : "",
    legend,
    isDefault: typeof v.isDefault === "boolean" ? v.isDefault : undefined,
  };
};

export const cleanEndpoint = (endpoint: string) => {
  return endpoint.replace(
    /\${process\.env\.(AWS_STORAGE|TITILER_ENDPOINT)}(\/)?/g,
    ""
  );
};

export const fetchLayers = async (): Promise<Layer[]> => {
  let layersData: Layer[] = [];

  try {
    const globalLayersResponse = await fetch(
      `${process.env.NEXT_PUBLIC_AWS_STORAGE}/layers/global/layerData.json`
    );
    if (!globalLayersResponse.ok) {
      console.error(
        `fetchLayers: global layers fetch failed (${globalLayersResponse.status})`
      );
      return [];
    }
    const globalLayers: LayersAPIResponse = await globalLayersResponse.json();
    layersData = [...globalLayers.layers];
  } catch (error) {
    console.error("Error fetching global layers", error);
    return [];
  }

  layersData = layersData.map((layer) => ({
    ...layer,
    endpoint: cleanEndpoint(layer.endpoint),
  }));

  return layersData;
};

/**
 * Fetch project-specific layers from Hyperindex generic records().
 * Returns null if the organization has no layer records (caller should fall back to S3).
 */
const fetchLayersFromHyperindex = async (did: string): Promise<Layer[] | null> => {
  try {
    const records: RawLayerRecord[] = [];
    let cursor: string | null = null;

    do {
      const response: LayerRecordsResponse = await hyperindexClient.request(
        ALL_LAYER_RECORDS,
        {
          first: 100,
          after: cursor,
        }
      );

      const page = response.records.edges
        .map((edge) => edge.node)
        .filter((record) => record.did === did);

      if (page.length) {
        records.push(...page);
      }

      cursor = response.records.pageInfo.hasNextPage
        ? response.records.pageInfo.endCursor
        : null;
    } while (cursor);

    if (records.length === 0) {
      return null;
    }

    return records.map(normalizeAtprotoLayer);
  } catch (error) {
    console.error("Error fetching Hyperindex layer records", error);
    return null;
  }
};

/**
 * Fetch project-specific layers from S3 (legacy fallback).
 */
const fetchLayersFromS3 = async (slug: string): Promise<Layer[] | null> => {
  const kebabCasedSlug = toKebabCase(slug);
  try {
    const projectLayerDataResponse = await fetch(
      `${process.env.NEXT_PUBLIC_AWS_STORAGE}/layers/${kebabCasedSlug}/layerData.json`
    );
    if (!projectLayerDataResponse.ok) {
      return null;
    }
    const projectLayerData: {
      layers: Layer[];
    } | null = await projectLayerDataResponse.json();
    const layers = projectLayerData?.layers ?? [];
    return layers
      .filter(
        (layer) =>
          !layer.name.includes("DNA") && !layer.name.includes("Raft Deployment")
      )
      .map((layer) => ({
        ...layer,
        endpoint: cleanEndpoint(layer.endpoint),
      }));
  } catch (error) {
    console.error("Error fetching project specific layers from S3", error);
    return null;
  }
};

/**
 * Fetch project-specific layers, preferring Hyperindex records and falling back
 * to S3 layerData.json when no layer records exist for the organization.
 *
 * @param did  - The organization DID (used for Hyperindex filtering)
 * @param slug - The project slug (used for S3 fallback path)
 */
export const fetchProjectSpecificLayers = async (
  did: string,
  slug: string
): Promise<Layer[] | null> => {
  const hyperindexLayers = await fetchLayersFromHyperindex(did);
  if (hyperindexLayers !== null) {
    return hyperindexLayers;
  }
  return fetchLayersFromS3(slug);
};
