#!/usr/bin/env bun
/**
 * validate-geojson.ts
 *
 * Validates a GeoJSON file against the schemas expected by Green Globe.
 *
 * Usage:
 *   bun run scripts/validate-geojson.ts --type site ./boundary.geojson
 *   bun run scripts/validate-geojson.ts --type trees ./trees.geojson
 *   bun run scripts/validate-geojson.ts --type choropleth ./richness.geojson
 *   bun run scripts/validate-geojson.ts --type choropleth_shannon ./shannon.geojson
 *   bun run scripts/validate-geojson.ts --type points ./cameras.geojson
 *   bun run scripts/validate-geojson.ts --type line ./rivers.geojson
 *
 * Options:
 *   --type       Validation schema: site, trees, choropleth, choropleth_shannon, points, line
 *   --strict     Treat warnings as errors
 *   --help       Show this help
 */

type ValidationResult = {
  errors: string[];
  warnings: string[];
};

type GeoJSONFeature = {
  type?: string;
  id?: unknown;
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
  properties?: Record<string, unknown>;
};

type GeoJSON = {
  type?: string;
  features?: GeoJSONFeature[];
};

function validateBase(data: GeoJSON): ValidationResult {
  const result: ValidationResult = { errors: [], warnings: [] };

  if (data.type !== "FeatureCollection") {
    result.errors.push(`Root "type" must be "FeatureCollection", got "${data.type}"`);
  }

  if (!Array.isArray(data.features)) {
    result.errors.push(`"features" must be an array`);
    return result;
  }

  if (data.features.length === 0) {
    result.warnings.push("FeatureCollection has 0 features (empty file)");
  }

  for (let i = 0; i < data.features.length; i++) {
    const feature = data.features[i];
    if (feature.type !== "Feature") {
      result.errors.push(`features[${i}].type must be "Feature", got "${feature.type}"`);
    }
    if (!feature.geometry) {
      result.errors.push(`features[${i}].geometry is missing`);
    } else if (!feature.geometry.type) {
      result.errors.push(`features[${i}].geometry.type is missing`);
    }
    if (!feature.geometry?.coordinates) {
      result.errors.push(`features[${i}].geometry.coordinates is missing`);
    }
  }

  return result;
}

function validateSite(data: GeoJSON): ValidationResult {
  const result = validateBase(data);
  if (result.errors.length > 0) return result;

  const features = data.features!;
  const validGeomTypes = new Set(["Polygon", "MultiPolygon", "Point"]);

  for (let i = 0; i < features.length; i++) {
    const f = features[i];
    const geomType = f.geometry?.type;

    if (!geomType || !validGeomTypes.has(geomType)) {
      result.errors.push(
        `features[${i}].geometry.type must be Polygon or MultiPolygon, got "${geomType}"`
      );
    }

    if (!f.properties?.name) {
      result.warnings.push(`features[${i}].properties.name is missing (recommended for site boundaries)`);
    }

    if (!f.id && !f.properties?.id) {
      result.warnings.push(`features[${i}] has no id field (recommended)`);
    }
  }

  return result;
}

function validateTrees(data: GeoJSON): ValidationResult {
  const result = validateBase(data);
  if (result.errors.length > 0) return result;

  const features = data.features!;

  for (let i = 0; i < Math.min(features.length, 100); i++) {
    const f = features[i];
    const geomType = f.geometry?.type;

    if (geomType !== "Point") {
      result.errors.push(`features[${i}].geometry.type must be "Point", got "${geomType}"`);
    }

    const props = f.properties || {};

    if (!props.species && !props.Plant_Name) {
      result.warnings.push(`features[${i}] missing "species" property (will show as "Unknown")`);
    }

    if (props.lat === undefined || props.lon === undefined) {
      result.warnings.push(`features[${i}] missing lat/lon properties`);
    }

    if (!props.awsUrl && props.awsUrl !== "") {
      result.warnings.push(`features[${i}] missing "awsUrl" property (tree photo URL)`);
    }
  }

  if (features.length > 100) {
    result.warnings.push(
      `Only validated first 100 of ${features.length} features. Remaining features not checked.`
    );
  }

  // Summary stats
  const speciesCounts = new Map<string, number>();
  for (const f of features) {
    const species = (f.properties?.species as string) || (f.properties?.Plant_Name as string) || "Unknown";
    speciesCounts.set(species, (speciesCounts.get(species) || 0) + 1);
  }
  console.log(`  Total trees: ${features.length}`);
  console.log(`  Unique species: ${speciesCounts.size}`);

  return result;
}

function validateChoropleth(data: GeoJSON, propertyName: string): ValidationResult {
  const result = validateBase(data);
  if (result.errors.length > 0) return result;

  const features = data.features!;

  for (let i = 0; i < features.length; i++) {
    const f = features[i];
    const geomType = f.geometry?.type;

    if (geomType !== "Polygon" && geomType !== "MultiPolygon") {
      result.errors.push(
        `features[${i}].geometry.type must be Polygon or MultiPolygon, got "${geomType}"`
      );
    }

    const value = f.properties?.[propertyName];
    if (value === undefined || value === null) {
      result.errors.push(`features[${i}].properties.${propertyName} is missing (required for choropleth rendering)`);
    } else if (typeof value !== "number") {
      result.errors.push(`features[${i}].properties.${propertyName} must be a number, got ${typeof value}`);
    }
  }

  // Range check
  const values = features
    .map((f) => f.properties?.[propertyName] as number)
    .filter((v) => typeof v === "number");

  if (values.length > 0) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    console.log(`  ${propertyName} range: [${min.toFixed(2)}, ${max.toFixed(2)}]`);

    const expectedMax = propertyName === "species_richness" ? 12 : 5;
    if (max > expectedMax) {
      result.warnings.push(
        `${propertyName} max value (${max}) exceeds expected range (0-${expectedMax}). Colors may not render as expected.`
      );
    }
  }

  return result;
}

function validatePoints(data: GeoJSON): ValidationResult {
  const result = validateBase(data);
  if (result.errors.length > 0) return result;

  const features = data.features!;

  for (let i = 0; i < features.length; i++) {
    const f = features[i];
    if (f.geometry?.type !== "Point" && f.geometry?.type !== "MultiPoint") {
      result.errors.push(
        `features[${i}].geometry.type must be Point or MultiPoint, got "${f.geometry?.type}"`
      );
    }
  }

  console.log(`  Total points: ${features.length}`);
  return result;
}

function validateLine(data: GeoJSON): ValidationResult {
  const result = validateBase(data);
  if (result.errors.length > 0) return result;

  const features = data.features!;

  for (let i = 0; i < features.length; i++) {
    const f = features[i];
    if (f.geometry?.type !== "LineString" && f.geometry?.type !== "MultiLineString") {
      result.errors.push(
        `features[${i}].geometry.type must be LineString or MultiLineString, got "${f.geometry?.type}"`
      );
    }
  }

  console.log(`  Total line features: ${features.length}`);
  return result;
}

// --- CLI ---

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  const flags: Set<string> = new Set();
  const positional: string[] = [];
  const booleanFlags = new Set(["strict", "help", "h"]);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      if (booleanFlags.has(key)) {
        flags.add(key);
      } else {
        const next = argv[i + 1];
        if (next && !next.startsWith("--")) {
          args[key] = next;
          i++;
        } else {
          flags.add(key);
        }
      }
    } else {
      positional.push(arg);
    }
  }

  return { args, flags, positional };
}

function showHelp() {
  console.log("Usage:");
  console.log("  bun run scripts/validate-geojson.ts --type <type> <file.geojson>");
  console.log("");
  console.log("Types:");
  console.log("  site               Site boundary polygons (Polygon/MultiPolygon with name)");
  console.log("  trees              Measured trees (Points with species, lat, lon, photo URLs)");
  console.log("  choropleth         Choropleth polygons (requires species_richness property)");
  console.log("  choropleth_shannon Choropleth polygons (requires shannon_index property)");
  console.log("  points             Generic point layer");
  console.log("  line               Line/route layer");
  console.log("");
  console.log("Options:");
  console.log("  --strict           Treat warnings as errors (exit code 1)");
  console.log("  --help             Show this help");
}

const { args, flags, positional } = parseArgs(process.argv.slice(2));

if (flags.has("help") || flags.has("h")) {
  showHelp();
  process.exit(0);
}

const type = args.type;
const filePath = positional[0];
const strict = flags.has("strict");

if (!type) {
  console.error("Error: --type is required.");
  showHelp();
  process.exit(1);
}

if (!filePath) {
  console.error("Error: Please provide a GeoJSON file path.");
  process.exit(1);
}

// Read and parse file
let data: GeoJSON;
try {
  const text = await Bun.file(filePath).text();
  data = JSON.parse(text) as GeoJSON;
} catch (err) {
  console.error(`Error: Failed to read/parse "${filePath}": ${(err as Error).message}`);
  process.exit(1);
}

console.log(`Validating: ${filePath} (type: ${type})`);

// Run validation
let result: ValidationResult;

switch (type) {
  case "site":
    result = validateSite(data);
    break;
  case "trees":
    result = validateTrees(data);
    break;
  case "choropleth":
    result = validateChoropleth(data, "species_richness");
    break;
  case "choropleth_shannon":
    result = validateChoropleth(data, "shannon_index");
    break;
  case "points":
    result = validatePoints(data);
    break;
  case "line":
    result = validateLine(data);
    break;
  default:
    console.error(`Error: Unknown type "${type}". Use --help for available types.`);
    process.exit(1);
}

// Output results
if (result.errors.length > 0) {
  console.log(`\n  ERRORS (${result.errors.length}):`);
  for (const err of result.errors) {
    console.log(`    [x] ${err}`);
  }
}

if (result.warnings.length > 0) {
  console.log(`\n  WARNINGS (${result.warnings.length}):`);
  for (const warn of result.warnings) {
    console.log(`    [!] ${warn}`);
  }
}

const hasIssues = result.errors.length > 0 || (strict && result.warnings.length > 0);

if (hasIssues) {
  console.log("\n  RESULT: FAILED");
  process.exit(1);
} else {
  console.log("\n  RESULT: PASSED");
  process.exit(0);
}
