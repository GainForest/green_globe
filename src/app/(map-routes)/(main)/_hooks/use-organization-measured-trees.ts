"use client";

import { useQuery } from "@tanstack/react-query";
import ClimateAIAgent from "@/lib/atproto/agent";
import { PDS_ENDPOINT } from "@/config/atproto";
import type {
  MeasuredTreesGeoJSON,
  NormalizedTreeFeature,
} from "../_components/ProjectOverlay/store/types";
import { getTreeSpeciesName } from "../_components/Map/sources-and-layers/measured-trees";

// ── Constants ──────────────────────────────────────────────────────────────────

const OCCURRENCE_COLLECTION = "app.gainforest.dwc.occurrence";
const MEASUREMENT_COLLECTION = "app.gainforest.dwc.measurement";

// ── Raw record shapes ──────────────────────────────────────────────────────────

type RawImageEvidence = {
  $type?: string;
  file?: {
    ref?: unknown;
    mimeType?: string;
    size?: number;
  };
};

type RawOccurrenceValue = {
  basisOfRecord?: unknown;
  scientificName?: unknown;
  vernacularName?: unknown;
  decimalLatitude?: unknown;
  decimalLongitude?: unknown;
  dynamicProperties?: unknown;
  associatedMedia?: unknown;
  trunkEvidence?: RawImageEvidence;
  leafEvidence?: RawImageEvidence;
  barkEvidence?: RawImageEvidence;
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
  measurementType?: unknown;
  measurementValue?: unknown;
  measurementUnit?: unknown;
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

// ── Blob URL helpers ───────────────────────────────────────────────────────────

/**
 * Extract a CID string from a BlobRef's ref field.
 * Handles both SDK-deserialized CID objects and plain { $link: string } objects.
 */
const extractCid = (ref: unknown): string | null => {
  if (!ref) return null;
  if (typeof ref === "string") return ref;
  if (
    typeof ref === "object" &&
    "$link" in (ref as Record<string, unknown>)
  ) {
    return (ref as Record<string, unknown>)["$link"] as string;
  }
  if (
    typeof ref === "object" &&
    typeof (ref as { toString?: unknown }).toString === "function"
  ) {
    const str = (ref as { toString: () => string }).toString();
    if (str.startsWith("baf")) return str;
  }
  return null;
};

/**
 * Build a PDS blob URL from a did and CID.
 */
const buildBlobUrl = (did: string, cid: string): string =>
  `${PDS_ENDPOINT}/xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(did)}&cid=${encodeURIComponent(cid)}`;

/**
 * Extract a blob URL from an image evidence field.
 * Returns null if the evidence is missing or has no valid CID.
 */
const extractBlobUrl = (
  evidence: RawImageEvidence | undefined,
  did: string,
): string | null => {
  if (!evidence?.file?.ref) return null;
  const cid = extractCid(evidence.file.ref);
  if (!cid) return null;
  return buildBlobUrl(did, cid);
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

        const measurementType =
          typeof v.measurementType === "string"
            ? v.measurementType.toLowerCase()
            : "";
        const measurementValue =
          typeof v.measurementValue === "string" ? v.measurementValue : null;
        if (!measurementValue) continue;

        const existing = index.get(occurrenceRef) ?? {};

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
  // Fetch measurements in parallel with occurrences
  const [measurementIndex, occurrences] = await Promise.all([
    fetchMeasurementIndex(did),
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

      // Extract blob URLs for trunk/leaf/bark evidence
      const trunkUrl = extractBlobUrl(v.trunkEvidence, did);
      const leafUrl = extractBlobUrl(v.leafEvidence, did);
      const barkUrl = extractBlobUrl(v.barkEvidence, did);

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
