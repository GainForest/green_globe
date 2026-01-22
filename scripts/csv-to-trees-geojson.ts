#!/usr/bin/env bun
/**
 * csv-to-trees-geojson.ts
 *
 * Converts a CSV of tree measurements into the GeoJSON format expected by Green Globe.
 *
 * Usage:
 *   bun run scripts/csv-to-trees-geojson.ts \
 *     --input ./tree-measurements.csv \
 *     --output ./my-project-all-tree-plantings.geojson
 *
 *   bun run scripts/csv-to-trees-geojson.ts \
 *     --input ./data.csv \
 *     --project "My Conservation Project"
 *
 * Expected CSV columns (header row required):
 *   Required: lat, lon, species
 *   Optional: commonName, height, diameter, DBH, dateMeasured, datePlanted, ID
 *
 * Options:
 *   --input       Input CSV file path (required)
 *   --output      Output GeoJSON file path (default: derived from --project)
 *   --project     Project name (used to derive output filename if --output not specified)
 *   --photos-dir  Base S3 URL for tree photos (generates awsUrl from ID)
 *   --help        Show this help
 */

type TreeProperties = {
  lat: number;
  lon: number;
  species: string;
  commonName?: string;
  height?: string;
  Height?: string;
  diameter?: string;
  DBH?: string;
  dateMeasured?: string;
  dateOfMeasurement?: string;
  datePlanted?: string;
  ID?: string;
  awsUrl: string;
  koboUrl: string;
  barkAwsUrl: string;
  barkKoboUrl: string;
  leafAwsUrl?: string;
  leafKoboUrl?: string;
  videoAwsUrl?: string;
  soundAwsUrl?: string;
};

type TreeFeature = {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: TreeProperties;
};

type TreesGeoJSON = {
  type: "FeatureCollection";
  features: TreeFeature[];
};

function toKebabCase(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) {
    throw new Error("CSV must have at least a header row and one data row");
  }

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j].trim()] = (values[j] || "").trim();
    }
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
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
  console.log("  bun run scripts/csv-to-trees-geojson.ts --input <csv> [--output <geojson>] [--project <name>]");
  console.log("");
  console.log("Required:");
  console.log("  --input       Input CSV file path");
  console.log("");
  console.log("Options:");
  console.log("  --output      Output GeoJSON file path");
  console.log("  --project     Project name (derives output filename if --output not set)");
  console.log("  --photos-dir  Base S3 URL for tree photos (e.g., https://bucket.s3.../trees-measured)");
  console.log("  --help        Show this help");
  console.log("");
  console.log("Expected CSV columns (header row required):");
  console.log("  Required: lat, lon, species");
  console.log("  Optional: commonName, height, diameter, DBH, dateMeasured, datePlanted, ID");
  console.log("");
  console.log("Example CSV:");
  console.log("  lat,lon,species,commonName,height,diameter,dateMeasured,ID");
  console.log("  -1.295,36.801,Acacia tortilis,Umbrella Thorn,4.5,15.2,2024-03-15,tree-001");
}

// --- Main ---

const { args, flags } = parseArgs(process.argv.slice(2));

if (flags.has("help") || flags.has("h")) {
  showHelp();
  process.exit(0);
}

const { input, output, project } = args;
const photosDir = args["photos-dir"] || "";

if (!input) {
  console.error("Error: --input is required.");
  process.exit(1);
}

// Determine output path
let outputPath = output;
if (!outputPath) {
  if (project) {
    const kebab = toKebabCase(project);
    outputPath = `./${kebab}-all-tree-plantings.geojson`;
  } else {
    outputPath = "./trees-output.geojson";
  }
}

// Read and parse CSV
let csvText: string;
try {
  csvText = await Bun.file(input).text();
} catch (err) {
  console.error(`Error: Cannot read file "${input}": ${(err as Error).message}`);
  process.exit(1);
}

const rows = parseCSV(csvText);
console.log(`Parsed ${rows.length} rows from ${input}`);

// Validate required columns
const firstRow = rows[0];
if (!firstRow) {
  console.error("Error: CSV has no data rows.");
  process.exit(1);
}

const hasLat = "lat" in firstRow || "latitude" in firstRow;
const hasLon = "lon" in firstRow || "lng" in firstRow || "longitude" in firstRow;
const hasSpecies = "species" in firstRow || "Species" in firstRow || "Plant_Name" in firstRow;

if (!hasLat || !hasLon) {
  console.error("Error: CSV must have 'lat' and 'lon' (or 'latitude'/'longitude') columns.");
  process.exit(1);
}
if (!hasSpecies) {
  console.warn("Warning: No 'species' column found. Trees will show as 'Unknown'.");
}

// Convert to GeoJSON
const features: TreeFeature[] = [];
let skipped = 0;

for (let i = 0; i < rows.length; i++) {
  const row = rows[i];

  const lat = parseFloat(row.lat || row.latitude || "");
  const lon = parseFloat(row.lon || row.lng || row.longitude || "");

  if (isNaN(lat) || isNaN(lon)) {
    skipped++;
    if (skipped <= 5) {
      console.warn(`  Warning: Row ${i + 2} has invalid lat/lon, skipping`);
    }
    continue;
  }

  const id = row.ID || row.id || row.tree_id || `tree-${i + 1}`;
  const species = row.species || row.Species || row.Plant_Name || "";

  const awsUrl = photosDir ? `${photosDir}/${id}.jpg` : row.awsUrl || "";
  const barkAwsUrl = photosDir ? `${photosDir}/${id}-bark.jpg` : row.barkAwsUrl || "";

  const properties: TreeProperties = {
    lat,
    lon,
    species,
    awsUrl,
    koboUrl: row.koboUrl || "",
    barkAwsUrl,
    barkKoboUrl: row.barkKoboUrl || "",
  };

  // Add optional fields
  if (row.commonName) properties.commonName = row.commonName;
  if (row.height) properties.height = row.height;
  if (row.Height) properties.Height = row.Height;
  if (row.diameter) properties.diameter = row.diameter;
  if (row.DBH) properties.DBH = row.DBH;
  if (row.dateMeasured) properties.dateMeasured = row.dateMeasured;
  if (row.dateOfMeasurement) properties.dateOfMeasurement = row.dateOfMeasurement;
  if (row.datePlanted) properties.datePlanted = row.datePlanted;
  if (id) properties.ID = id;
  if (row.leafAwsUrl) properties.leafAwsUrl = row.leafAwsUrl;
  if (row.videoAwsUrl) properties.videoAwsUrl = row.videoAwsUrl;
  if (row.soundAwsUrl) properties.soundAwsUrl = row.soundAwsUrl;

  features.push({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [lon, lat],
    },
    properties,
  });
}

if (skipped > 0) {
  console.warn(`  Skipped ${skipped} rows with invalid coordinates`);
}

const geojson: TreesGeoJSON = {
  type: "FeatureCollection",
  features,
};

// Write output
await Bun.write(outputPath, JSON.stringify(geojson, null, 2));

console.log(`\nOutput: ${outputPath}`);
console.log(`  Features: ${features.length}`);
console.log(`  Unique species: ${new Set(features.map((f) => f.properties.species)).size}`);

if (project) {
  const kebab = toKebabCase(project);
  console.log(`\nUpload command:`);
  console.log(`  aws s3 cp ${outputPath} s3://gainforest-transparency-dashboard/shapefiles/${kebab}-all-tree-plantings.geojson --content-type "application/json" --region us-east-1`);
}
