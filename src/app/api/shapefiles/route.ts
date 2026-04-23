import { NextRequest, NextResponse } from "next/server";
import { Agent } from "@atproto/api";
import type { GeoJsonObject } from "geojson";
import { Buffer } from "node:buffer";
import {
  HECTARES_PER_SQUARE_METER,
  computePolygonMetrics,
  type Coordinates,
} from "@/lib/geojson";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_COLLECTION = "app.gainforest.organization.site";
const ATPROTO_SERVICE =
  process.env.NEXT_PUBLIC_ATPROTO_SERVICE_URL ?? "https://climateai.org";

type MetricsStatus =
  | "computed"
  | "missing_source"
  | "fetch_error"
  | "parse_error"
  | "no_polygon";

type DecimalStrings = {
  lat: string | null;
  lon: string | null;
  area: string | null;
};

type SiteRecordValue = {
  name?: string;
  boundary?: string;
  lat?: string;
  lon?: string;
  area?: string;
  trees?: {
    ref?: { $link: string };
    mimeType?: string;
    size?: number;
  };
};

type SiteRecord = {
  uri: string;
  cid: string;
  rkey: string;
  value: SiteRecordValue;
};

type ShapefileMetricResult = {
  did: string;
  handle: string | null;
  uri: string;
  rkey: string;
  name: string | null;
  source: {
    type: "boundary" | "blob" | null;
    boundaryUrl: string | null;
    blobCid: string | null;
    blobMimeType: string | null;
    blobSize: number | null;
  };
  centroid: Coordinates | null;
  centroidString: { lat: string; lon: string } | null;
  areaSqMeters: number | null;
  areaSqMetersString: string | null;
  areaHectares: number | null;
  areaHectaresString: string | null;
  bbox: [number, number, number, number] | null;
  existing: DecimalStrings;
  status: MetricsStatus;
  error?: string;
};

type MetricsSummary = {
  total: number;
  computed: number;
  missingSource: number;
  fetchError: number;
  parseError: number;
  noPolygon: number;
};

const formatDecimal = (value: number | null, fractionDigits = 6) => {
  if (value === null || Number.isNaN(value)) return null;
  return value
    .toFixed(fractionDigits)
    .replace(/\.?0+$/, "")
    .replace(/^-0$/, "0");
};

const parseDidList = (request: NextRequest) => {
  const params = request.nextUrl.searchParams;
  const didParams = params.getAll("did");
  const commaSeparated = params.get("dids");

  if (commaSeparated) {
    didParams.push(
      ...commaSeparated.split(",").map((entry) => entry.trim()).filter(Boolean)
    );
  }

  const unique = Array.from(new Set(didParams.map((entry) => entry.trim())));
  return unique.length > 0 ? unique : null;
};

const fetchAllSiteRecords = async (agent: Agent, did: string) => {
  const records: SiteRecord[] = [];
  let cursor: string | undefined;

  do {
    const response = await agent.com.atproto.repo.listRecords({
      repo: did,
      collection: SITE_COLLECTION,
      limit: 100,
      cursor,
    });

    const page = response.data.records as SiteRecord[] | undefined;
    if (page?.length) {
      records.push(...page);
    }

    cursor = response.data.cursor ?? undefined;
  } while (cursor);

  return records;
};

const fetchGeoJsonFromBoundary = async (boundaryUrl: string) => {
  const response = await fetch(boundaryUrl, {
    headers: {
      Accept: "application/geo+json, application/json;q=0.9, */*;q=0.1",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Boundary fetch failed (${response.status} ${response.statusText})`
    );
  }

  return (await response.json()) as GeoJsonObject;
};

const fetchGeoJsonFromBlob = async (agent: Agent, did: string, cid: string) => {
  const response = await agent.com.atproto.sync.getBlob({ did, cid });
  const buffer = Buffer.from(response.data);
  const text = buffer.toString("utf8");
  return JSON.parse(text) as GeoJsonObject;
};

const computeMetricsForRecord = async (
  agent: Agent,
  did: string,
  handle: string | null,
  record: SiteRecord
): Promise<ShapefileMetricResult> => {
  const name =
    typeof record.value.name === "string" ? record.value.name : null;
  const boundaryUrl =
    typeof record.value.boundary === "string" &&
    record.value.boundary.trim().length
      ? record.value.boundary.trim()
      : null;
  const blobCid = record.value.trees?.ref?.$link ?? null;

  if (!boundaryUrl && !blobCid) {
    return {
      did,
      handle,
      uri: record.uri,
      rkey: record.rkey,
      name,
      source: {
        type: null,
        boundaryUrl,
        blobCid,
        blobMimeType: record.value.trees?.mimeType ?? null,
        blobSize: record.value.trees?.size ?? null,
      },
      centroid: null,
      centroidString: null,
      areaSqMeters: null,
      areaSqMetersString: null,
      areaHectares: null,
      areaHectaresString: null,
      bbox: null,
      existing: {
        lat: record.value.lat ?? null,
        lon: record.value.lon ?? null,
        area: record.value.area ?? null,
      },
      status: "missing_source",
      error: "Site record does not include a boundary URL or trees blob",
    };
  }

  let geoJson: GeoJsonObject;
  let sourceType: "boundary" | "blob";

  try {
    if (boundaryUrl) {
      geoJson = await fetchGeoJsonFromBoundary(boundaryUrl);
      sourceType = "boundary";
    } else {
      geoJson = await fetchGeoJsonFromBlob(agent, did, blobCid!);
      sourceType = "blob";
    }
  } catch (error) {
    return {
      did,
      handle,
      uri: record.uri,
      rkey: record.rkey,
      name,
      source: {
        type: boundaryUrl ? "boundary" : "blob",
        boundaryUrl,
        blobCid,
        blobMimeType: record.value.trees?.mimeType ?? null,
        blobSize: record.value.trees?.size ?? null,
      },
      centroid: null,
      centroidString: null,
      areaSqMeters: null,
      areaSqMetersString: null,
      areaHectares: null,
      areaHectaresString: null,
      bbox: null,
      existing: {
        lat: record.value.lat ?? null,
        lon: record.value.lon ?? null,
        area: record.value.area ?? null,
      },
      status: "fetch_error",
      error:
        error instanceof Error
          ? error.message
          : "Unable to retrieve GeoJSON source",
    };
  }

  let metrics;
  try {
    metrics = computePolygonMetrics(geoJson);
  } catch (error) {
    return {
      did,
      handle,
      uri: record.uri,
      rkey: record.rkey,
      name,
      source: {
        type: boundaryUrl ? "boundary" : "blob",
        boundaryUrl,
        blobCid,
        blobMimeType: record.value.trees?.mimeType ?? null,
        blobSize: record.value.trees?.size ?? null,
      },
      centroid: null,
      centroidString: null,
      areaSqMeters: null,
      areaSqMetersString: null,
      areaHectares: null,
      areaHectaresString: null,
      bbox: null,
      existing: {
        lat: record.value.lat ?? null,
        lon: record.value.lon ?? null,
        area: record.value.area ?? null,
      },
      status: "parse_error",
      error:
        error instanceof Error ? error.message : "Invalid GeoJSON structure",
    };
  }

  if (metrics.areaSqMeters === null && !metrics.centroid) {
    return {
      did,
      handle,
      uri: record.uri,
      rkey: record.rkey,
      name,
      source: {
        type: sourceType,
        boundaryUrl,
        blobCid,
        blobMimeType: record.value.trees?.mimeType ?? null,
        blobSize: record.value.trees?.size ?? null,
      },
      centroid: null,
      centroidString: null,
      areaSqMeters: null,
      areaSqMetersString: null,
      areaHectares: null,
      areaHectaresString: null,
      bbox: metrics.bbox,
      existing: {
        lat: record.value.lat ?? null,
        lon: record.value.lon ?? null,
        area: record.value.area ?? null,
      },
      status: "no_polygon",
      error: "GeoJSON does not contain polygonal geometries",
    };
  }

  const centroid = metrics.centroid;
  const areaSqMeters = metrics.areaSqMeters;
  const areaHectares = metrics.areaHectares;

  return {
    did,
    handle,
    uri: record.uri,
    rkey: record.rkey,
    name,
    source: {
      type: sourceType,
      boundaryUrl,
      blobCid,
      blobMimeType: record.value.trees?.mimeType ?? null,
      blobSize: record.value.trees?.size ?? null,
    },
    centroid,
    centroidString: centroid
      ? {
          lat: formatDecimal(centroid.lat, 8) ?? "",
          lon: formatDecimal(centroid.lon, 8) ?? "",
        }
      : null,
    areaSqMeters,
    areaSqMetersString: formatDecimal(areaSqMeters, 3),
    areaHectares,
    areaHectaresString: formatDecimal(areaHectares, 4),
    bbox: metrics.bbox,
    existing: {
      lat: record.value.lat ?? null,
      lon: record.value.lon ?? null,
      area: record.value.area ?? null,
    },
    status: "computed",
  };
};

const initSummary = (): MetricsSummary => ({
  total: 0,
  computed: 0,
  missingSource: 0,
  fetchError: 0,
  parseError: 0,
  noPolygon: 0,
});

const updateSummary = (summary: MetricsSummary, status: MetricsStatus) => {
  summary.total += 1;

  switch (status) {
    case "computed":
      summary.computed += 1;
      break;
    case "missing_source":
      summary.missingSource += 1;
      break;
    case "fetch_error":
      summary.fetchError += 1;
      break;
    case "parse_error":
      summary.parseError += 1;
      break;
    case "no_polygon":
      summary.noPolygon += 1;
      break;
  }
};

export const GET = async (request: NextRequest) => {
  const dids = parseDidList(request);

  if (!dids) {
    return NextResponse.json(
      {
        error:
          "Missing query parameter. Provide at least one `did` (e.g. /api/shapefiles?did=did:plc:abc123).",
      },
      { status: 400 }
    );
  }

  const agent = new Agent(ATPROTO_SERVICE);
  const summaryByDid = new Map<string, MetricsSummary>();
  const results: ShapefileMetricResult[] = [];
  const errors: Record<string, string> = {};

  for (const did of dids) {
    const summary = initSummary();
    summaryByDid.set(did, summary);

    let handle: string | null = null;
    try {
      const description = await agent.com.atproto.repo.describeRepo({
        repo: did,
      });
      if (description.success) {
        handle = description.data.handle ?? null;
      }
    } catch (error) {
      errors[did] =
        error instanceof Error
          ? error.message
          : "Failed to describe repository";
    }

    let records: SiteRecord[];

    try {
      records = await fetchAllSiteRecords(agent, did);
    } catch (error) {
      summary.total = 0;
      errors[did] = error instanceof Error ? error.message : String(error);
      continue;
    }

    for (const record of records) {
      const result = await computeMetricsForRecord(agent, did, handle, record);
      updateSummary(summary, result.status);
      results.push(result);
    }
  }

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    service: ATPROTO_SERVICE,
    requestedDids: dids,
    stats: Object.fromEntries(summaryByDid.entries()),
    totals: Array.from(summaryByDid.values()).reduce(
      (aggregate, current) => ({
        total: aggregate.total + current.total,
        computed: aggregate.computed + current.computed,
        missingSource: aggregate.missingSource + current.missingSource,
        fetchError: aggregate.fetchError + current.fetchError,
        parseError: aggregate.parseError + current.parseError,
        noPolygon: aggregate.noPolygon + current.noPolygon,
      }),
      initSummary()
    ),
    errors: Object.keys(errors).length ? errors : null,
    results,
    notes: {
      usage:
        "Provide one or more `did` query parameters to retrieve metrics for that organization’s site shapefiles.",
      areaUnits: {
        squareMeters: "Raw area is reported in square meters.",
        hectares: `Hectares are derived by multiplying square meters by ${HECTARES_PER_SQUARE_METER}.`,
      },
    },
  });
};
