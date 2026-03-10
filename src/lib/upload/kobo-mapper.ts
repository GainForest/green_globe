import type { ColumnMapping } from "@/lib/upload/types";

/**
 * Known KoboToolbox field patterns mapped to Darwin Core target fields.
 * Each entry: [pattern, targetField, isGpsCombined?]
 *
 * isGpsCombined = true means the source column holds a combined
 * "lat lon alt accuracy" string that must be split into two mappings.
 */
type KoboPattern = {
  pattern: string;
  targetField: string;
  /** If true, this column contains combined GPS data (lat lon alt accuracy) */
  gpsCombined?: boolean;
};

const KOBO_PATTERNS: KoboPattern[] = [
  // Combined GPS field — handled specially: produces TWO mappings
  { pattern: "gps", targetField: "decimalLatitude", gpsCombined: true },
  { pattern: "geopoint", targetField: "decimalLatitude", gpsCombined: true },

  // Explicit latitude fields
  { pattern: "_gps_latitude", targetField: "decimalLatitude" },
  { pattern: "gps_latitude", targetField: "decimalLatitude" },
  { pattern: "latitude", targetField: "decimalLatitude" },

  // Explicit longitude fields
  { pattern: "_gps_longitude", targetField: "decimalLongitude" },
  { pattern: "gps_longitude", targetField: "decimalLongitude" },
  { pattern: "longitude", targetField: "decimalLongitude" },

  // Scientific name
  { pattern: "plant_name", targetField: "scientificName" },
  { pattern: "species", targetField: "scientificName" },
  { pattern: "scientific_name", targetField: "scientificName" },

  // Measurements
  { pattern: "dbh", targetField: "dbh" },
  { pattern: "diameter_breast_height", targetField: "dbh" },
  { pattern: "height", targetField: "height" },
  { pattern: "tree_height", targetField: "height" },
  { pattern: "diameter", targetField: "diameter" },
  { pattern: "canopy_cover", targetField: "canopyCover" },
  { pattern: "canopy", targetField: "canopyCover" },

  // Date / time — explicit date fields take priority over submission_time
  { pattern: "fcd-tree_records-tree_time", targetField: "eventDate" },
  { pattern: "date", targetField: "eventDate" },
  { pattern: "observation_date", targetField: "eventDate" },
  { pattern: "survey_date", targetField: "eventDate" },
  // Fallback (lower priority — only matched if no explicit date field matched)
  { pattern: "_submission_time", targetField: "eventDate" },
  { pattern: "submission_time", targetField: "eventDate" },

  // Observer
  { pattern: "recorder", targetField: "recordedBy" },
  { pattern: "recorded_by", targetField: "recordedBy" },
  { pattern: "observer", targetField: "recordedBy" },

  // Location
  { pattern: "site", targetField: "locality" },
  { pattern: "locality", targetField: "locality" },
  { pattern: "location", targetField: "locality" },
  { pattern: "country", targetField: "country" },

  // Remarks / notes
  { pattern: "notes", targetField: "occurrenceRemarks" },
  { pattern: "remarks", targetField: "occurrenceRemarks" },
  { pattern: "comments", targetField: "occurrenceRemarks" },

  // Common name
  { pattern: "common_name", targetField: "vernacularName" },
  { pattern: "vernacular_name", targetField: "vernacularName" },
  { pattern: "local_name", targetField: "vernacularName" },

  // Habitat
  { pattern: "habitat", targetField: "habitat" },
];

/**
 * Match a single header against the known Kobo patterns (case-insensitive).
 * Returns the first matching pattern entry, or null if none match.
 *
 * Matching strategy:
 *   1. Exact match (case-insensitive)
 *   2. Contains match (case-insensitive)
 */
function matchPattern(header: string): KoboPattern | null {
  const lower = header.toLowerCase();
  for (const entry of KOBO_PATTERNS) {
    if (lower === entry.pattern || lower.includes(entry.pattern)) {
      return entry;
    }
  }
  return null;
}

/**
 * Build ColumnMapping(s) for a single header.
 *
 * For combined GPS fields (e.g. "GPS", "geopoint") that contain
 * "lat lon alt accuracy", two mappings are returned:
 *   - one for decimalLatitude  (transform: split by space, take index 0)
 *   - one for decimalLongitude (transform: split by space, take index 1)
 *
 * For all other fields, a single mapping is returned (no transform unless
 * the field is an explicit lat/lon field that doesn't need splitting).
 */
function buildMappings(header: string, pattern: KoboPattern): ColumnMapping[] {
  if (pattern.gpsCombined) {
    const latMapping: ColumnMapping = {
      sourceColumn: header,
      targetField: "decimalLatitude",
      transform: (value: string) => value.trim().split(/\s+/)[0] ?? "",
    };
    const lonMapping: ColumnMapping = {
      sourceColumn: header,
      targetField: "decimalLongitude",
      transform: (value: string) => value.trim().split(/\s+/)[1] ?? "",
    };
    return [latMapping, lonMapping];
  }

  return [{ sourceColumn: header, targetField: pattern.targetField }];
}

/**
 * Returns mappings for all headers that match known Kobo patterns.
 * Unrecognized headers are not included.
 *
 * When multiple headers would map to the same target field, only the
 * first match (in header order) is kept to avoid duplicate mappings.
 */
export function getKoboColumnMappings(headers: string[]): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];
  const usedTargets = new Set<string>();

  for (const header of headers) {
    const pattern = matchPattern(header);
    if (!pattern) continue;

    const candidates = buildMappings(header, pattern);
    for (const mapping of candidates) {
      if (!usedTargets.has(mapping.targetField)) {
        mappings.push(mapping);
        usedTargets.add(mapping.targetField);
      }
    }
  }

  return mappings;
}

/**
 * Auto-detect whether a set of CSV headers looks like a KoboToolbox export.
 *
 * Returns:
 *   - isKobo: true when confidence >= 0.3
 *   - confidence: 0–1 = matched headers / total headers
 *   - mappings: all recognized column mappings (via getKoboColumnMappings)
 */
export function detectKoboFormat(headers: string[]): {
  isKobo: boolean;
  confidence: number;
  mappings: ColumnMapping[];
} {
  if (headers.length === 0) {
    return { isKobo: false, confidence: 0, mappings: [] };
  }

  // Count how many headers match at least one Kobo pattern
  const matchedCount = headers.filter((h) => matchPattern(h) !== null).length;
  const confidence = matchedCount / headers.length;
  const isKobo = confidence >= 0.3;
  const mappings = getKoboColumnMappings(headers);

  return { isKobo, confidence, mappings };
}
