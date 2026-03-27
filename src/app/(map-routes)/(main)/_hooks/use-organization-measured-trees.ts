"use client";

import { useQuery } from "@tanstack/react-query";
import ClimateAIAgent from "@/lib/atproto/agent";
import type {
  MeasuredTreesGeoJSON,
  NormalizedTreeFeature,
} from "../_components/ProjectOverlay/store/types";
import { getTreeSpeciesName } from "../_components/Map/sources-and-layers/measured-trees";
import { fetchMultimediaByOccurrence } from "@/lib/atproto/ac-multimedia";

// ── Constants ──────────────────────────────────────────────────────────────────

const OCCURRENCE_COLLECTION = "app.gainforest.dwc.occurrence";
const MEASUREMENT_COLLECTION = "app.gainforest.dwc.measurement";

// ── Raw record shapes ──────────────────────────────────────────────────────────

type RawOccurrenceValue = {
  basisOfRecord?: unknown;
  scientificName?: unknown;
  vernacularName?: unknown;
  decimalLatitude?: unknown;
  decimalLongitude?: unknown;
  dynamicProperties?: unknown;
  associatedMedia?: unknown;
  eventDate?: unknown;
  siteRef?: unknown;
  [k: string]: unknown;
};

type RawOccurrenceRecord = {
  uri: string;
  cid: string;
  value: RawOccurrenceValue;
};

type RawMeasurementValue = {
  occurrenceRef?: unknown;
  measurementType?: unknown;   // old format
  measurementValue?: unknown;  // old format
  measurementUnit?: unknown;   // old format
  result?: unknown;            // new format — will be object with $type
  [k: string]: unknown;
};

type RawMeasurementRecord = {
  uri: string;
  cid: string;
  value: RawMeasurementValue;
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
 * Fetch all dwc.measurement records for an org and index them by occurrenceRef URI.
 */
const fetchMeasurementIndex = async (
  did: string,
): Promise<MeasurementsByOccurrence> => {
  const index: MeasurementsByOccurrence = new Map();
  let cursor: string | undefined;

  do {
    const response = await ClimateAIAgent.com.atproto.repo.listRecords({
      repo: did,
      collection: MEASUREMENT_COLLECTION,
      limit: 100,
      cursor,
    });

    const page = response.data.records as RawMeasurementRecord[] | undefined;
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
  // Fetch measurements and AC multimedia records in parallel with occurrences
  const [measurementIndex, multimediaIndex, occurrences] = await Promise.all([
    fetchMeasurementIndex(did),
    fetchMultimediaByOccurrence(did),
    (async () => {
      const records: RawOccurrenceRecord[] = [];
      let cursor: string | undefined;

      do {
        const response = await ClimateAIAgent.com.atproto.repo.listRecords({
          repo: did,
          collection: OCCURRENCE_COLLECTION,
          limit: 100,
          cursor,
        });

        const page = response.data.records as
          | RawOccurrenceRecord[]
          | undefined;
        if (page?.length) {
          records.push(...page);
        }

        cursor = response.data.cursor ?? undefined;
      } while (cursor);

      return records;
    })(),
  ]);

  // Filter to measured tree occurrences
  const measuredTreeRecords = occurrences.filter((record) => {
    const v = record.value;
    if (
      typeof v.basisOfRecord !== "string" ||
      v.basisOfRecord !== "HumanObservation"
    ) {
      return false;
    }
    const dynProps = parseDynamicProperties(v.dynamicProperties);
    return dynProps?.dataType === "measuredTree";
  });

  if (measuredTreeRecords.length === 0) return null;

  // Map to NormalizedTreeFeature
  const features: NormalizedTreeFeature[] = measuredTreeRecords
    .map((record, index) => {
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

      // Measurements from index
      const measurements = measurementIndex.get(record.uri) ?? {};

      const rawProperties = {
        lat,
        lon,
        species: scientificName,
        commonName: vernacularName,
        dateMeasured: eventDate,
        // PDS blob URLs (primary) — map to existing field names for backward compat
        awsUrl: trunkUrl ?? originalAwsUrl,
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

      const feature: NormalizedTreeFeature = {
        type: "Feature",
        id: index,
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

      return feature;
    })
    .filter((f): f is NormalizedTreeFeature => f !== null);

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
