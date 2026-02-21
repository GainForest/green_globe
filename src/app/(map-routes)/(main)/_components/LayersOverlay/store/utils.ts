import { LayersAPIResponse, Layer } from "./types";
import { toKebabCase } from "@/lib/utils";
import ClimateAIAgent from "@/lib/atproto/agent";

const LAYER_COLLECTION = "app.gainforest.organization.layer";

const VALID_LAYER_TYPES = new Set([
  "geojson_points",
  "geojson_points_trees",
  "geojson_line",
  "choropleth",
  "choropleth_shannon",
  "raster_tif",
  "tms_tile",
]);

// RawLayerValue uses unknown fields because ATProto layer records are fetched
// via com.atproto.repo.listRecords which returns untyped JSON. The SDK's
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
  visibility?: unknown;
  legend?: unknown;
  description?: unknown;
  [k: string]: unknown;
};

type RawLayerRecord = {
  uri: string;
  cid?: string;
  value: RawLayerValue;
};

const normalizeAtprotoLayer = (raw: RawLayerRecord): Layer => {
  const v = raw.value;
  const type =
    typeof v.type === "string" && VALID_LAYER_TYPES.has(v.type)
      ? (v.type as Layer["type"])
      : "geojson_points";

  return {
    name: typeof v.name === "string" ? v.name : "",
    type,
    endpoint: typeof v.uri === "string" ? v.uri : "",
    category: typeof v.category === "string" ? v.category : "",
    description: typeof v.description === "string" ? v.description : "",
    legend: typeof v.legend === "string" ? v.legend : undefined,
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
 * Fetch project-specific layers from ATProto PDS.
 * Returns null if the organization has no layer records (caller should fall back to S3).
 */
const fetchLayersFromATProto = async (did: string): Promise<Layer[] | null> => {
  try {
    const records: RawLayerRecord[] = [];
    let cursor: string | undefined;

    do {
      const response = await ClimateAIAgent.com.atproto.repo.listRecords({
        repo: did,
        collection: LAYER_COLLECTION,
        limit: 100,
        cursor,
      });

      const page = response.data.records as RawLayerRecord[] | undefined;
      if (page?.length) {
        records.push(...page);
      }

      cursor = response.data.cursor ?? undefined;
    } while (cursor);

    if (records.length === 0) {
      return null;
    }

    return records.map(normalizeAtprotoLayer);
  } catch (error) {
    console.error("Error fetching ATProto layer records", error);
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
 * Fetch project-specific layers, preferring ATProto records and falling back
 * to S3 layerData.json when no ATProto records exist for the organization.
 *
 * @param did  - The organization DID (used for ATProto lookup)
 * @param slug - The project slug (used for S3 fallback path)
 */
export const fetchProjectSpecificLayers = async (
  did: string,
  slug: string
): Promise<Layer[] | null> => {
  const atprotoLayers = await fetchLayersFromATProto(did);
  if (atprotoLayers !== null) {
    return atprotoLayers;
  }
  return fetchLayersFromS3(slug);
};
