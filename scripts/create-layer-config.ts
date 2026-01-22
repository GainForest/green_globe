#!/usr/bin/env bun
/**
 * create-layer-config.ts
 *
 * Scans a directory of geojson/tif files and generates a layerData.json
 * configuration file for the Green Globe layers system.
 *
 * Usage:
 *   bun run scripts/create-layer-config.ts \
 *     --project "My Conservation Project" \
 *     --dir ./my-layers/ \
 *     --category "Satellite Analysis"
 *
 * Options:
 *   --project    Project name (used to derive the S3 path prefix)
 *   --dir        Directory containing layer data files
 *   --category   Default category for all layers (can be overridden per-file)
 *   --output     Output path for layerData.json (default: <dir>/layerData.json)
 *   --help       Show this help
 */

import { readdirSync, statSync } from "fs";
import { basename, extname, join } from "path";

type LayerType =
  | "geojson_points"
  | "geojson_points_trees"
  | "geojson_line"
  | "choropleth"
  | "choropleth_shannon"
  | "raster_tif"
  | "tms_tile";

type Layer = {
  name: string;
  type: LayerType;
  endpoint: string;
  description: string;
  category: string;
};

type LayerConfig = {
  layers: Layer[];
};

function toKebabCase(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
}

function inferLayerType(filePath: string, content?: unknown): LayerType {
  const ext = extname(filePath).toLowerCase();

  if (ext === ".tif" || ext === ".tiff") {
    return "raster_tif";
  }

  if (ext === ".geojson" || ext === ".json") {
    // Try to infer from GeoJSON content
    if (content && typeof content === "object" && "features" in content) {
      const features = (content as { features: Array<{ geometry: { type: string }; properties: Record<string, unknown> }> }).features;
      if (features.length > 0) {
        const firstFeature = features[0];
        const geomType = firstFeature?.geometry?.type;
        const props = firstFeature?.properties || {};

        // Check for choropleth properties
        if ("species_richness" in props) return "choropleth";
        if ("shannon_index" in props) return "choropleth_shannon";

        // Check geometry type
        if (geomType === "Point" || geomType === "MultiPoint") return "geojson_points";
        if (geomType === "LineString" || geomType === "MultiLineString") return "geojson_line";
        if (geomType === "Polygon" || geomType === "MultiPolygon") return "choropleth";
      }
    }
    return "geojson_points"; // Default for unknown GeoJSON
  }

  return "geojson_points";
}

function fileNameToDisplayName(filename: string): string {
  const name = basename(filename, extname(filename));
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  const flags: Set<string> = new Set();

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        flags.add(key);
      }
    }
  }

  return { args, flags };
}

function showHelp() {
  console.log("Usage:");
  console.log("  bun run scripts/create-layer-config.ts --project <name> --dir <path> [--category <cat>]");
  console.log("");
  console.log("Required:");
  console.log("  --project    Project name (used to derive S3 path prefix)");
  console.log("  --dir        Directory containing layer data files (.geojson, .tif)");
  console.log("");
  console.log("Options:");
  console.log("  --category   Default category for layers (default: 'General')");
  console.log("  --output     Output file path (default: <dir>/layerData.json)");
  console.log("  --help       Show this help");
  console.log("");
  console.log("Layer type inference:");
  console.log("  .tif/.tiff                          → raster_tif");
  console.log("  .geojson with species_richness prop  → choropleth");
  console.log("  .geojson with shannon_index prop     → choropleth_shannon");
  console.log("  .geojson with Point geometry         → geojson_points");
  console.log("  .geojson with LineString geometry     → geojson_line");
  console.log("  .geojson with Polygon geometry       → choropleth");
}

// --- Main ---

const { args, flags } = parseArgs(process.argv.slice(2));

if (flags.has("help") || flags.has("h")) {
  showHelp();
  process.exit(0);
}

const { project, dir, category: defaultCategory, output: outputPath } = args;

if (!project) {
  console.error("Error: --project is required.");
  process.exit(1);
}
if (!dir) {
  console.error("Error: --dir is required.");
  process.exit(1);
}

const kebabName = toKebabCase(project);
const category = defaultCategory || "General";
const supportedExtensions = new Set([".geojson", ".json", ".tif", ".tiff"]);

// Scan directory
let files: string[];
try {
  files = readdirSync(dir).filter((f) => {
    const ext = extname(f).toLowerCase();
    const isFile = statSync(join(dir, f)).isFile();
    return isFile && supportedExtensions.has(ext) && f !== "layerData.json";
  });
} catch (err) {
  console.error(`Error: Cannot read directory "${dir}": ${(err as Error).message}`);
  process.exit(1);
}

if (files.length === 0) {
  console.error(`Error: No supported files found in "${dir}" (.geojson, .json, .tif, .tiff)`);
  process.exit(1);
}

console.log(`Found ${files.length} layer file(s) in ${dir}`);

// Process each file
const layers: Layer[] = [];

for (const file of files.sort()) {
  const filePath = join(dir, file);
  const ext = extname(file).toLowerCase();

  let content: unknown = undefined;
  if (ext === ".geojson" || ext === ".json") {
    try {
      const text = await Bun.file(filePath).text();
      content = JSON.parse(text);
    } catch {
      console.warn(`  Warning: Could not parse ${file} as JSON, defaulting to geojson_points`);
    }
  }

  const layerType = inferLayerType(file, content);
  const displayName = fileNameToDisplayName(file);
  const endpoint = `layers/${kebabName}/${file}`;

  layers.push({
    name: displayName,
    type: layerType,
    endpoint,
    description: `${displayName} layer`,
    category,
  });

  console.log(`  ${file} → type: ${layerType}, name: "${displayName}"`);
}

// Write output
const config: LayerConfig = { layers };
const jsonOutput = JSON.stringify(config, null, 2);
const outFile = outputPath || join(dir, "layerData.json");

await Bun.write(outFile, jsonOutput);
console.log(`\nWritten: ${outFile}`);
console.log(`S3 upload path: layers/${kebabName}/layerData.json`);
console.log(`\nUpload command:`);
console.log(`  aws s3 sync ${dir} s3://gainforest-transparency-dashboard/layers/${kebabName}/ --region us-east-1`);
