import type { ColumnMapping, MappedRow } from "./types";

/**
 * Known patterns for auto-detecting column mappings.
 * Each entry maps a list of source column name patterns (case-insensitive)
 * to a target Darwin Core / measurement field name.
 * Order within each group determines priority (first match wins).
 */
const KNOWN_PATTERNS: { patterns: string[]; target: string }[] = [
  // Occurrence fields
  { patterns: ["lat", "latitude", "decimal_latitude", "decimallatitude", "y"], target: "decimalLatitude" },
  { patterns: ["lon", "lng", "longitude", "decimal_longitude", "decimallongitude", "x"], target: "decimalLongitude" },
  { patterns: ["species", "scientific_name", "scientificname", "taxon", "taxon_name"], target: "scientificName" },
  {
    patterns: ["date", "event_date", "eventdate", "observation_date", "obs_date", "survey_date", "collected_date"],
    target: "eventDate",
  },
  { patterns: ["observer", "recorded_by", "recordedby", "recorder", "collector"], target: "recordedBy" },
  { patterns: ["name", "common_name", "vernacular_name", "vernacularname", "local_name"], target: "vernacularName" },
  {
    patterns: ["notes", "remarks", "comments", "observation_remarks", "occurrenceremarks"],
    target: "occurrenceRemarks",
  },
  { patterns: ["country"], target: "country" },
  { patterns: ["locality", "location", "site", "site_name", "place"], target: "locality" },
  { patterns: ["habitat", "vegetation"], target: "habitat" },

  // Measurement fields
  { patterns: ["dbh", "diameter_breast_height", "breast_height_diameter"], target: "dbh" },
  { patterns: ["height", "tree_height", "plant_height"], target: "height" },
  { patterns: ["diameter", "trunk_diameter", "stem_diameter"], target: "diameter" },
  { patterns: ["canopy", "canopy_cover", "crown_cover"], target: "canopyCover" },
];

/**
 * Auto-detect column mappings for generic CSV files based on common field naming conventions.
 * Matching is case-insensitive. If multiple source columns match the same target, the first
 * match (by header order) is used. Unrecognized headers are excluded from the result.
 *
 * @param headers - Array of CSV column header strings
 * @returns Array of ColumnMapping objects for recognized headers
 */
export function autoDetectMappings(headers: string[]): ColumnMapping[] {
  // Track which targets have already been claimed to enforce "first match wins"
  const claimedTargets = new Set<string>();
  const mappings: ColumnMapping[] = [];

  for (const header of headers) {
    const normalizedHeader = header.toLowerCase().trim();

    for (const { patterns, target } of KNOWN_PATTERNS) {
      if (patterns.includes(normalizedHeader) && !claimedTargets.has(target)) {
        claimedTargets.add(target);
        mappings.push({ sourceColumn: header, targetField: target });
        break;
      }
    }
  }

  return mappings;
}

/**
 * Apply column mappings to an array of raw CSV rows.
 * For each row, creates a new object with target field names as keys.
 * Transform functions from mappings are applied when present.
 * Source columns not in mappings are dropped.
 * Empty/undefined source values are excluded from the output row.
 *
 * @param rows - Array of raw CSV rows (source column names as keys)
 * @param mappings - Array of ColumnMapping objects describing the remapping
 * @returns Array of MappedRow objects with target field names as keys
 */
export function applyMappings(rows: Record<string, string>[], mappings: ColumnMapping[]): MappedRow[] {
  return rows.map((row) => {
    const mappedRow: MappedRow = {};

    for (const { sourceColumn, targetField, transform } of mappings) {
      const rawValue = row[sourceColumn];

      // Skip empty or undefined values
      if (rawValue === undefined || rawValue === "") {
        continue;
      }

      const value = transform ? transform(rawValue) : rawValue;
      mappedRow[targetField] = value;
    }

    return mappedRow;
  });
}
