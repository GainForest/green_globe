"use client";

import { useQuery } from "@tanstack/react-query";
import { Agent } from "@atproto/api";
import { resolvePdsEndpoint } from "@/lib/atproto/resolve-pds";
import {
  normalizeOccurrenceEventDate,
  parseOccurrenceEventDate,
} from "@/lib/occurrence-event-date";
import type {
  MeasuredTreesGeoJSON,
  NormalizedTreeFeature,
} from "../_components/ProjectOverlay/store/types";
import { getTreeSpeciesName } from "../_components/Map/sources-and-layers/measured-trees";
import {
  fetchMultimediaByOccurrence,
  type MultimediaByOccurrence,
} from "@/lib/atproto/ac-multimedia";
import { hyperindexClient } from "@/lib/hyperindex/client";
import { OCCURRENCES_BY_DID } from "@/lib/hyperindex/queries";
import type { Connection, HiDwcOccurrence } from "@/lib/hyperindex/types";
import usePreviewStore from "../_features/preview/store";

const MEASUREMENT_COLLECTION = "app.gainforest.dwc.measurement";
const OCCURRENCE_COLLECTION = "app.gainforest.dwc.occurrence";

// ── Constants ──────────────────────────────────────────────────────────────────

// ── Raw record shapes ──────────────────────────────────────────────────────────

type RawOccurrenceValue = {
  basisOfRecord?: unknown;
  scientificName?: unknown;
  vernacularName?: unknown;
  kingdom?: unknown;
  decimalLatitude?: unknown;
  decimalLongitude?: unknown;
  dynamicProperties?: unknown;
  associatedMedia?: unknown;
  eventDate?: unknown;
  siteRef?: unknown;
  datasetRef?: unknown;
  [k: string]: unknown;
};

type RawOccurrenceRecord = {
  uri: string;
  cid?: string;
  value: RawOccurrenceValue;
};

type OccurrenceResponse = {
  appGainforestDwcOccurrence: Connection<HiDwcOccurrence>;
};

type HyperindexOccurrenceFetchResult = {
  records: RawOccurrenceRecord[];
  failed: boolean;
};

// ── Dynamic properties ─────────────────────────────────────────────────────────

type ParsedDynamicProperties = {
  dataType?: string;
  source?: string;
  originalAwsUrl?: string;
  originalKoboUrl?: string;
  [k: string]: unknown;
};

const parseDynamicProperties = (
  raw: unknown,
): ParsedDynamicProperties | null => {
  if (typeof raw !== "string" || raw.trim() === "") return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as ParsedDynamicProperties;
    }
    return null;
  } catch {
    return null;
  }
};

// ── Measurement index ──────────────────────────────────────────────────────────

type MeasurementsByOccurrence = Map<
  string,
  { dbh?: string; height?: string }
>;

/**
 * Fetch all dwc.measurement records for an org from the PDS and index them by
 * occurrenceRef URI.
 *
 * We intentionally keep measurements on the PDS for now because Hyperindex's
 * generic records() query cannot filter by DID and the typed measurement query
 * still reflects the old flat schema instead of the bundled `result` format.
 */
const fetchMeasurementIndex = async (
  agent: Agent,
  did: string,
): Promise<MeasurementsByOccurrence> => {
  const index: MeasurementsByOccurrence = new Map();
  let cursor: string | undefined;

  do {
    const response = await agent.com.atproto.repo.listRecords({
      repo: did,
      collection: MEASUREMENT_COLLECTION,
      limit: 100,
      cursor,
    });

    const page = response.data.records as
      | Array<{ value: Record<string, unknown> }>
      | undefined;

    if (page?.length) {
      for (const record of page) {
        const v = record.value;
        const occurrenceRef =
          typeof v.occurrenceRef === "string" ? v.occurrenceRef : null;
        if (!occurrenceRef) continue;

        const existing = index.get(occurrenceRef) ?? {};

        if (typeof v.result === "object" && v.result !== null) {
          // New bundled format: result object with $type (e.g. floraMeasurement)
          const result = v.result as Record<string, unknown>;
          const dbh =
            typeof result.dbh === "string" ? result.dbh : undefined;
          const height =
            typeof result.totalHeight === "string"
              ? result.totalHeight
              : undefined;
          index.set(occurrenceRef, {
            ...existing,
            ...(dbh !== undefined ? { dbh } : {}),
            ...(height !== undefined ? { height } : {}),
          });
        } else if (typeof v.measurementType === "string") {
          // Old per-measurement format: measurementType + measurementValue at top level
          const measurementType = v.measurementType.toLowerCase();
          const measurementValue =
            typeof v.measurementValue === "string" ? v.measurementValue : null;
          if (!measurementValue) continue;

          if (measurementType === "dbh") {
            index.set(occurrenceRef, { ...existing, dbh: measurementValue });
          } else if (
            measurementType === "height" ||
            measurementType === "tree height"
          ) {
            index.set(occurrenceRef, { ...existing, height: measurementValue });
          }
        }
      }
    }

    cursor = response.data.cursor ?? undefined;
  } while (cursor);

  return index;
};

const mapOccurrenceNodeToRawRecord = (
  node: HiDwcOccurrence,
): RawOccurrenceRecord => ({
  uri: node.uri,
  cid: node.cid,
  value: {
    basisOfRecord: node.basisOfRecord,
    scientificName: node.scientificName,
    vernacularName: node.vernacularName,
    kingdom: node.kingdom,
    decimalLatitude: node.decimalLatitude,
    decimalLongitude: node.decimalLongitude,
    dynamicProperties: node.dynamicProperties,
    associatedMedia: node.associatedMedia,
    eventDate: node.eventDate,
  },
});

const fetchMeasuredTreeOccurrenceRecords = async (
  did: string,
): Promise<HyperindexOccurrenceFetchResult> => {
  const records: RawOccurrenceRecord[] = [];
  let cursor: string | null = null;

  try {
    do {
      const response: OccurrenceResponse = await hyperindexClient.request(
        OCCURRENCES_BY_DID,
        {
          did,
          first: 100,
          after: cursor,
          basisOfRecord: "HumanObservation",
        }
      );

      const connection = response.appGainforestDwcOccurrence;
      records.push(
        ...connection.edges.map((edge) =>
          mapOccurrenceNodeToRawRecord(edge.node),
        ),
      );

      cursor = connection.pageInfo.hasNextPage
        ? connection.pageInfo.endCursor
        : null;
    } while (cursor);

    return { records, failed: false };
  } catch (err) {
    // Hyperindex schema may lag the PDS (e.g. new fields not yet indexed).
    // Degrade gracefully by letting the caller decide whether to fall back to
    // the source-of-truth PDS occurrence records.
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[GG] hyperindex occurrences fetch failed, falling back to PDS:",
        err,
      );
    }
    return { records: [], failed: true };
  }
};

const fetchPdsOccurrenceRecords = async (
  agent: Agent,
  did: string,
): Promise<RawOccurrenceRecord[]> => {
  const records: RawOccurrenceRecord[] = [];
  let cursor: string | undefined;

  do {
    const response = await agent.com.atproto.repo.listRecords({
      repo: did,
      collection: OCCURRENCE_COLLECTION,
      limit: 100,
      cursor,
    });

    const page = response.data.records as
      | Array<{
          uri?: string;
          cid?: string;
          value?: Record<string, unknown>;
        }>
      | undefined;

    if (page?.length) {
      for (const record of page) {
        if (typeof record.uri !== "string") {
          continue;
        }

        records.push({
          uri: record.uri,
          cid: typeof record.cid === "string" ? record.cid : undefined,
          value: record.value ?? {},
        });
      }
    }

    cursor = response.data.cursor ?? undefined;
  } while (cursor);

  return records;
};

const parseAtUri = (uri: string): { did: string; collection: string; rkey: string } | null => {
  if (!uri.startsWith("at://")) {
    return null;
  }

  const rest = uri.slice(5);
  const [did, collection, rkey] = rest.split("/");

  if (!did || !collection || !rkey) {
    return null;
  }

  return { did, collection, rkey };
};

const fetchPdsOccurrenceByUri = async (
  agent: Agent,
  uri: string,
): Promise<RawOccurrenceRecord | null> => {
  const parsed = parseAtUri(uri);
  if (!parsed || parsed.collection !== OCCURRENCE_COLLECTION) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[GG preview] tree-uri rejected:", uri, parsed);
    }
    return null;
  }

  try {
    const response = await agent.com.atproto.repo.getRecord({
      repo: parsed.did,
      collection: parsed.collection,
      rkey: parsed.rkey,
    });

    return {
      uri: response.data.uri,
      cid: response.data.cid,
      value: (response.data.value as Record<string, unknown>) ?? {},
    };
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[GG preview] fetchPdsOccurrenceByUri failed:", uri, err);
    }
    return null;
  }
};

const hasCoordinates = (value: RawOccurrenceValue): boolean => {
  const lat =
    typeof value.decimalLatitude === "string"
      ? parseFloat(value.decimalLatitude)
      : typeof value.decimalLatitude === "number"
        ? value.decimalLatitude
        : null;
  const lon =
    typeof value.decimalLongitude === "string"
      ? parseFloat(value.decimalLongitude)
      : typeof value.decimalLongitude === "number"
        ? value.decimalLongitude
        : null;

  return lat !== null && lon !== null && !Number.isNaN(lat) && !Number.isNaN(lon);
};

const hasDatasetRef = (value: RawOccurrenceValue): boolean =>
  typeof value.datasetRef === "string" && value.datasetRef.trim().length > 0;

const isLegacyBumicertsTreeOccurrence = (
  record: RawOccurrenceRecord,
  measurementIndex: MeasurementsByOccurrence,
  multimediaIndex: MultimediaByOccurrence,
): boolean => {
  if (!hasDatasetRef(record.value)) {
    return false;
  }

  return (
    measurementIndex.has(record.uri) ||
    hasTreePhotos(multimediaIndex, record.uri)
  );
};

const hasTreePhotos = (
  multimediaIndex: MultimediaByOccurrence,
  occurrenceUri: string,
): boolean => {
  const media = multimediaIndex.get(occurrenceUri);
  if (!media) {
    return false;
  }

  return Object.values(media).some(
    (entry) => typeof entry === "string" && entry.trim().length > 0,
  );
};

const isMeasuredTreeOccurrence = (
  record: RawOccurrenceRecord,
  measurementIndex: MeasurementsByOccurrence,
  multimediaIndex: MultimediaByOccurrence,
): boolean => {
  const value = record.value;

  if (value.basisOfRecord !== "HumanObservation" || !hasCoordinates(value)) {
    return false;
  }

  const dynProps = parseDynamicProperties(value.dynamicProperties);
  if (dynProps?.dataType === "measuredTree" || dynProps?.source === "bumicerts") {
    return true;
  }

  return isLegacyBumicertsTreeOccurrence(
    record,
    measurementIndex,
    multimediaIndex,
  );
};

const buildTreeFeature = (
  record: RawOccurrenceRecord,
  measurementIndex: MeasurementsByOccurrence,
  multimediaIndex: MultimediaByOccurrence,
  recoverLegacyDayFirstIsoDates: boolean,
): NormalizedTreeFeature | null => {
  const v = record.value;

  const lat =
    typeof v.decimalLatitude === "string"
      ? parseFloat(v.decimalLatitude)
      : typeof v.decimalLatitude === "number"
        ? v.decimalLatitude
        : null;
  const lon =
    typeof v.decimalLongitude === "string"
      ? parseFloat(v.decimalLongitude)
      : typeof v.decimalLongitude === "number"
        ? v.decimalLongitude
        : null;

  if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) {
    return null;
  }

  // Look up AC multimedia records for this occurrence
  const media = multimediaIndex.get(record.uri) ?? {};
  const trunkUrl = media.entireOrganism ?? null;
  const leafUrl = media.leaf ?? null;
  const barkUrl = media.bark ?? null;

  // Extract original S3/Kobo URLs from associatedMedia (pipe-delimited)
  const associatedMedia =
    typeof v.associatedMedia === "string" ? v.associatedMedia : "";
  const mediaParts = associatedMedia
    ? associatedMedia.split("|").map((s) => s.trim()).filter(Boolean)
    : [];

  // Also check dynamicProperties for original URLs
  const dynProps = parseDynamicProperties(v.dynamicProperties);
  const originalAwsUrl = dynProps?.originalAwsUrl ?? mediaParts[0] ?? "";
  const originalKoboUrl = dynProps?.originalKoboUrl ?? "";

  const scientificName =
    typeof v.scientificName === "string" ? v.scientificName : "Unknown";
  const vernacularName =
    typeof v.vernacularName === "string" ? v.vernacularName : undefined;
  const eventDate =
    typeof v.eventDate === "string" ? v.eventDate : undefined;
  const normalizedEventDate =
    normalizeOccurrenceEventDate(eventDate, {
      recoverLegacyDayFirstIsoDates,
    }) ?? eventDate;
  const primaryPhotoUrl = trunkUrl ?? leafUrl ?? barkUrl ?? originalAwsUrl;

  // Measurements from index
  const measurements = measurementIndex.get(record.uri) ?? {};
  const datasetRef = typeof v.datasetRef === "string" ? v.datasetRef : undefined;
  const siteRef = typeof v.siteRef === "string" ? v.siteRef : undefined;
  const treeSource =
    dynProps?.source === "bumicerts"
      ? "bumicerts"
      : dynProps?.dataType === "measuredTree"
        ? "measuredTree"
        : "bumicerts-fallback";

  const rawProperties = {
    lat,
    lon,
    occurrenceUri: record.uri,
    datasetRef,
    siteRef,
    treeSource,
    species: scientificName,
    commonName: vernacularName,
    dateMeasured: normalizedEventDate,
    // Prefer a PDS blob-backed tree angle before falling back to legacy URLs.
    awsUrl: primaryPhotoUrl,
    koboUrl: originalKoboUrl,
    leafAwsUrl: leafUrl ?? undefined,
    leafKoboUrl: undefined,
    barkAwsUrl: barkUrl ?? "",
    barkKoboUrl: "",
    // Measurements
    DBH: measurements.dbh,
    Height: measurements.height,
  };

  const species =
    getTreeSpeciesName(rawProperties)?.trim() ?? scientificName;

  return {
    type: "Feature",
    id: record.uri,
    geometry: {
      type: "Point",
      coordinates: [lon, lat],
    },
    properties: {
      ...rawProperties,
      species,
      type: "measured-tree",
    },
  };
};

// ── Main fetcher ───────────────────────────────────────────────────────────────

/**
 * Fetch all measured tree occurrences (basisOfRecord === 'HumanObservation'
 * with dynamicProperties.dataType === 'measuredTree') for an org and return
 * them as a MeasuredTreesGeoJSON FeatureCollection.
 *
 * Returns null if no measured tree occurrences are found.
 *
 * Exported for use in Zustand stores that call async functions imperatively.
 */
export const fetchMeasuredTreeOccurrences = async (
  did: string,
): Promise<MeasuredTreesGeoJSON | null> => {
  const { datasetRef, treeUri } = usePreviewStore.getState();
  const shouldFetchPdsPreviewOccurrences =
    datasetRef !== null || treeUri !== null;

  // Resolve the org DID to its home PDS. Records for Bumicerts-certified orgs
  // live on PDSes other than the default (e.g. gainforest.id), so using the
  // singleton agent would silently return RecordNotFound.
  const pdsEndpoint = await resolvePdsEndpoint(did);
  const agent = new Agent(pdsEndpoint);

  // For a selected tree URI the owning DID may differ from the project DID
  // (cross-org preview). Resolve separately so getRecord hits the right PDS.
  const selectedTreeAgentPromise: Promise<Agent | null> = treeUri
    ? (async () => {
        const parsed = parseAtUri(treeUri);
        if (!parsed) return null;
        if (parsed.did === did) return agent;
        const endpoint = await resolvePdsEndpoint(parsed.did);
        return new Agent(endpoint);
      })()
    : Promise.resolve(null);

  const selectedTreeAgent = await selectedTreeAgentPromise;

  const previewPdsOccurrencesPromise = shouldFetchPdsPreviewOccurrences
    ? fetchPdsOccurrenceRecords(agent, did)
    : Promise.resolve<RawOccurrenceRecord[]>([]);

  // Fetch measurements, AC multimedia, and measured-tree occurrences in parallel.
  const [
    measurementIndex,
    multimediaIndex,
    hyperindexOccurrenceResult,
    previewPdsOccurrences,
    selectedPdsOccurrence,
  ] = await Promise.all([
    fetchMeasurementIndex(agent, did),
    fetchMultimediaByOccurrence(did),
    fetchMeasuredTreeOccurrenceRecords(did),
    previewPdsOccurrencesPromise,
    treeUri && selectedTreeAgent
      ? fetchPdsOccurrenceByUri(selectedTreeAgent, treeUri)
      : Promise.resolve(null),
  ]);

  const pdsOccurrences =
    shouldFetchPdsPreviewOccurrences || !hyperindexOccurrenceResult.failed
      ? previewPdsOccurrences
      : await fetchPdsOccurrenceRecords(agent, did);

  const occurrencesByUri = new Map<string, RawOccurrenceRecord>();
  for (const occurrence of hyperindexOccurrenceResult.records) {
    occurrencesByUri.set(occurrence.uri, occurrence);
  }
  for (const occurrence of pdsOccurrences) {
    occurrencesByUri.set(occurrence.uri, occurrence);
  }
  if (selectedPdsOccurrence) {
    occurrencesByUri.set(selectedPdsOccurrence.uri, selectedPdsOccurrence);
  }
  const occurrences = [...occurrencesByUri.values()];

  // Filter to measured tree occurrences, including Bumicerts fallback detection
  const measuredTreeRecords = occurrences.filter((record) =>
    isMeasuredTreeOccurrence(record, measurementIndex, multimediaIndex),
  );

  // When the user passes an explicit tree-uri, trust it: include the directly
  // fetched record even if it fails the measured-tree heuristics (e.g. legacy
  // Bumicerts trees without dynamicProperties marker, datasetRef, or linked
  // measurements/photos). Still gate on the basic observation+coordinates
  // invariant so we never admit non-tree PDS records.
  const forcedSelected =
    selectedPdsOccurrence &&
    selectedPdsOccurrence.value.basisOfRecord === "HumanObservation" &&
    hasCoordinates(selectedPdsOccurrence.value) &&
    !measuredTreeRecords.some((r) => r.uri === selectedPdsOccurrence.uri)
      ? selectedPdsOccurrence
      : null;

  const recordsToBuild = forcedSelected
    ? [...measuredTreeRecords, forcedSelected]
    : measuredTreeRecords;

  if (process.env.NODE_ENV === "development" && treeUri) {
    console.info("[GG preview] tree-uri requested:", treeUri);
    console.info(
      "[GG preview] PDS fetch result:",
      selectedPdsOccurrence ? "found" : "null",
    );
    console.info(
      "[GG preview] force-including selected (not in measured set):",
      !!forcedSelected,
    );
  }

  if (recordsToBuild.length === 0) return null;

  const recoverLegacyDayFirstIsoDates = recordsToBuild.some((record) => {
    const eventDate =
      typeof record.value.eventDate === "string" ? record.value.eventDate : undefined;
    return parseOccurrenceEventDate(eventDate)?.kind === "slash-day-first";
  });

  const features = recordsToBuild
    .map((record) =>
      buildTreeFeature(
        record,
        measurementIndex,
        multimediaIndex,
        recoverLegacyDayFirstIsoDates,
      ),
    )
    .filter((f): f is NormalizedTreeFeature => f !== null);

  if (process.env.NODE_ENV === "development" && treeUri) {
    const hit = features.find((f) => f.properties.occurrenceUri === treeUri);
    console.info(
      "[GG preview] tree in feature set:",
      !!hit,
      hit?.properties.treeSource,
    );
  }

  if (features.length === 0) return null;

  return {
    type: "FeatureCollection",
    features,
  };
};

// ── Return type ────────────────────────────────────────────────────────────────

export type UseOrganizationMeasuredTreesResult = {
  data: MeasuredTreesGeoJSON | null;
  isLoading: boolean;
  error: Error | null;
};

// ── Hook ───────────────────────────────────────────────────────────────────────

/**
 * React Query hook that fetches measured tree data from dwc.occurrence records.
 *
 * Filters to HumanObservation records where dynamicProperties.dataType === 'measuredTree'.
 * Returns data as a GeoJSON FeatureCollection compatible with MeasuredTreesGeoJSON.
 *
 * Returns null data if no measured tree occurrences exist for this org
 * (allowing the caller to fall back to the legacy GeoJSON blob path).
 */
const useOrganizationMeasuredTrees = (
  did: string | null | undefined,
): UseOrganizationMeasuredTreesResult => {
  const query = useQuery({
    queryKey: ["organization-measured-trees", did],
    queryFn: async () => {
      if (!did) return null;
      return fetchMeasuredTreeOccurrences(did);
    },
    enabled: Boolean(did),
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error as Error | null,
  };
};

export default useOrganizationMeasuredTrees;
