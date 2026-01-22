#!/usr/bin/env bun
/**
 * create-project-point.ts
 *
 * Downloads the master project points GeoJSON from S3, adds a new project point,
 * and optionally re-uploads the updated file.
 *
 * Usage:
 *   bun run scripts/create-project-point.ts \
 *     --name "My Conservation Project" \
 *     --id "abc123def456..." \
 *     --lat -1.3 \
 *     --lon 36.8 \
 *     --country "Kenya"
 *
 * Options:
 *   --name       Project display name (required)
 *   --id         Project ID matching the GraphQL API (required)
 *   --lat        Latitude in decimal degrees (required)
 *   --lon        Longitude in decimal degrees (required)
 *   --country    Country name (required)
 *   --dry-run    Print the updated GeoJSON without uploading
 *   --output     Write to a local file instead of uploading to S3
 *   --bucket     S3 bucket name (default: gainforest-transparency-dashboard)
 */

import { $ } from "bun";

const S3_KEY = "shapefiles/gainforest-all-shapefiles.geojson";
const DEFAULT_BUCKET = "gainforest-transparency-dashboard";

type ProjectFeature = {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    name: string;
    projectId: string;
    country: string;
  };
};

type FeatureCollection = {
  type: "FeatureCollection";
  features: ProjectFeature[];
};

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
  console.log("  bun run scripts/create-project-point.ts --name <name> --id <id> --lat <lat> --lon <lon> --country <country>");
  console.log("");
  console.log("Required:");
  console.log("  --name       Project display name");
  console.log("  --id         Project ID (must match GraphQL API)");
  console.log("  --lat        Latitude (decimal degrees)");
  console.log("  --lon        Longitude (decimal degrees)");
  console.log("  --country    Country name (full name)");
  console.log("");
  console.log("Options:");
  console.log("  --dry-run    Print updated GeoJSON to stdout, don't upload");
  console.log("  --output     Write to local file instead of uploading");
  console.log("  --bucket     S3 bucket (default: gainforest-transparency-dashboard)");
  console.log("  --help       Show this help");
}

async function downloadFromS3(bucket: string, key: string): Promise<FeatureCollection> {
  const url = `https://${bucket}.s3.us-east-1.amazonaws.com/${key}`;
  console.log(`Fetching: ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as FeatureCollection;
}

async function uploadToS3(bucket: string, key: string, data: string): Promise<void> {
  const tmpFile = `/tmp/gainforest-master-geojson-${Date.now()}.json`;
  await Bun.write(tmpFile, data);

  console.log(`Uploading to s3://${bucket}/${key}...`);
  await $`aws s3 cp ${tmpFile} s3://${bucket}/${key} --content-type "application/json" --region us-east-1`;
  console.log("Upload complete.");
}

// --- Main ---

const { args, flags } = parseArgs(process.argv.slice(2));

if (flags.has("help") || flags.has("h")) {
  showHelp();
  process.exit(0);
}

const { name, id, lat, lon, country, output, bucket: bucketArg } = args;
const dryRun = flags.has("dry-run");
const bucket = bucketArg || DEFAULT_BUCKET;

// Validate required args
const missing: string[] = [];
if (!name) missing.push("--name");
if (!id) missing.push("--id");
if (!lat) missing.push("--lat");
if (!lon) missing.push("--lon");
if (!country) missing.push("--country");

if (missing.length > 0) {
  console.error(`Error: Missing required arguments: ${missing.join(", ")}`);
  console.error("Run with --help for usage.");
  process.exit(1);
}

const latitude = parseFloat(lat);
const longitude = parseFloat(lon);

if (isNaN(latitude) || latitude < -90 || latitude > 90) {
  console.error(`Error: Invalid latitude "${lat}". Must be between -90 and 90.`);
  process.exit(1);
}

if (isNaN(longitude) || longitude < -180 || longitude > 180) {
  console.error(`Error: Invalid longitude "${lon}". Must be between -180 and 180.`);
  process.exit(1);
}

// Download current master GeoJSON
const geojson = await downloadFromS3(bucket, S3_KEY);
console.log(`Current project count: ${geojson.features.length}`);

// Check for duplicate
const existing = geojson.features.find((f) => f.properties.projectId === id);
if (existing) {
  console.error(`Error: A project with ID "${id}" already exists in the master GeoJSON.`);
  console.error(`  Name: ${existing.properties.name}`);
  console.error(`  Coordinates: [${existing.geometry.coordinates}]`);
  process.exit(1);
}

// Add new feature
const newFeature: ProjectFeature = {
  type: "Feature",
  geometry: {
    type: "Point",
    coordinates: [longitude, latitude],
  },
  properties: {
    name,
    projectId: id,
    country,
  },
};

geojson.features.push(newFeature);
console.log(`Added project "${name}" at [${longitude}, ${latitude}]`);
console.log(`New project count: ${geojson.features.length}`);

const jsonOutput = JSON.stringify(geojson, null, 2);

if (dryRun) {
  console.log("\n--- DRY RUN: Updated GeoJSON ---");
  console.log(jsonOutput);
} else if (output) {
  await Bun.write(output, jsonOutput);
  console.log(`Written to: ${output}`);
} else {
  await uploadToS3(bucket, S3_KEY, jsonOutput);
}
