#!/usr/bin/env bun
/**
 * csv-to-predictions.ts
 *
 * Validates and normalizes a species predictions CSV file for use with Green Globe.
 *
 * Usage:
 *   bun run scripts/csv-to-predictions.ts --validate ./predictions.csv
 *   bun run scripts/csv-to-predictions.ts --input ./raw.csv --output ./predictions.csv
 *
 * Expected CSV format:
 *   Species,Type
 *   Panthera leo,Mammal
 *   Agama agama,Reptile
 *
 * Valid Type values: Reptile, Amphibian, Mammal, Bird, IUCN Red List
 *
 * Options:
 *   --validate    Just validate the CSV (don't write output)
 *   --input       Input CSV file
 *   --output      Output CSV file (normalized)
 *   --project     Project name (shows upload command)
 *   --help        Show this help
 */

const VALID_TYPES = new Set(["Reptile", "Amphibian", "Mammal", "Bird", "IUCN Red List"]);

function toKebabCase(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
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
  const positional: string[] = [];
  const booleanFlags = new Set(["validate", "help", "h"]);

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
  console.log("  bun run scripts/csv-to-predictions.ts --validate <file.csv>");
  console.log("  bun run scripts/csv-to-predictions.ts --input <raw.csv> --output <clean.csv>");
  console.log("");
  console.log("Options:");
  console.log("  --validate    Validate an existing CSV file");
  console.log("  --input       Input CSV file to normalize");
  console.log("  --output      Output path for normalized CSV");
  console.log("  --project     Project name (shows the S3 upload command)");
  console.log("  --help        Show this help");
  console.log("");
  console.log("Expected format:");
  console.log("  Species,Type");
  console.log("  Panthera leo,Mammal");
  console.log("  Agama agama,Reptile");
  console.log("");
  console.log("Valid Type values:");
  console.log(`  ${[...VALID_TYPES].join(", ")}`);
}

// --- Main ---

const { args, flags, positional } = parseArgs(process.argv.slice(2));

if (flags.has("help") || flags.has("h")) {
  showHelp();
  process.exit(0);
}

const validateOnly = flags.has("validate");
const inputPath = args.input || positional[0];
const outputPath = args.output;
const project = args.project;

if (!inputPath) {
  console.error("Error: Please provide a CSV file path.");
  console.error("  --validate <file.csv>  or  --input <file.csv>");
  process.exit(1);
}

// Read CSV
let csvText: string;
try {
  csvText = await Bun.file(inputPath).text();
} catch (err) {
  console.error(`Error: Cannot read file "${inputPath}": ${(err as Error).message}`);
  process.exit(1);
}

const lines = csvText.trim().split("\n");
if (lines.length < 2) {
  console.error("Error: CSV must have at least a header row and one data row.");
  process.exit(1);
}

// Parse header
const headers = parseCSVLine(lines[0]).map((h) => h.trim());
const speciesIdx = headers.findIndex((h) => h.toLowerCase() === "species");
const typeIdx = headers.findIndex((h) => h.toLowerCase() === "type");

if (speciesIdx === -1) {
  console.error("Error: CSV must have a 'Species' column.");
  process.exit(1);
}
if (typeIdx === -1) {
  console.error("Error: CSV must have a 'Type' column.");
  process.exit(1);
}

// Validate/normalize rows
type PredictionRow = { species: string; type: string };
const validRows: PredictionRow[] = [];
const errors: string[] = [];
const warnings: string[] = [];
const typeCounts = new Map<string, number>();

for (let i = 1; i < lines.length; i++) {
  const values = parseCSVLine(lines[i]).map((v) => v.trim());
  const species = values[speciesIdx] || "";
  let type = values[typeIdx] || "";

  if (!species) {
    errors.push(`Row ${i + 1}: Empty species name`);
    continue;
  }

  // Try to normalize common type variations
  const typeNormalized = normalizeType(type);
  if (!typeNormalized) {
    errors.push(`Row ${i + 1}: Invalid type "${type}" for species "${species}". Valid: ${[...VALID_TYPES].join(", ")}`);
    continue;
  }

  if (typeNormalized !== type) {
    warnings.push(`Row ${i + 1}: Normalized type "${type}" → "${typeNormalized}"`);
  }

  type = typeNormalized;
  typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
  validRows.push({ species, type });
}

function normalizeType(type: string): string | null {
  // Exact match
  if (VALID_TYPES.has(type)) return type;

  // Case-insensitive match
  const lower = type.toLowerCase();
  for (const valid of VALID_TYPES) {
    if (valid.toLowerCase() === lower) return valid;
  }

  // Common variations
  const variations: Record<string, string> = {
    reptiles: "Reptile",
    amphibians: "Amphibian",
    mammals: "Mammal",
    birds: "Bird",
    bird: "Bird",
    aves: "Bird",
    mammalia: "Mammal",
    reptilia: "Reptile",
    amphibia: "Amphibian",
    "iucn": "IUCN Red List",
    "iucn red list": "IUCN Red List",
    "red list": "IUCN Red List",
    "iucn_red_list": "IUCN Red List",
  };

  return variations[lower] || null;
}

// Report results
console.log(`Validated: ${inputPath}`);
console.log(`  Total rows: ${lines.length - 1}`);
console.log(`  Valid: ${validRows.length}`);
console.log(`  Invalid: ${errors.length}`);
console.log("");

if (typeCounts.size > 0) {
  console.log("  Type breakdown:");
  for (const [type, count] of [...typeCounts.entries()].sort()) {
    console.log(`    ${type}: ${count}`);
  }
  console.log("");
}

if (warnings.length > 0) {
  console.log(`  WARNINGS (${warnings.length}):`);
  for (const w of warnings.slice(0, 10)) {
    console.log(`    [!] ${w}`);
  }
  if (warnings.length > 10) {
    console.log(`    ... and ${warnings.length - 10} more`);
  }
  console.log("");
}

if (errors.length > 0) {
  console.log(`  ERRORS (${errors.length}):`);
  for (const e of errors.slice(0, 10)) {
    console.log(`    [x] ${e}`);
  }
  if (errors.length > 10) {
    console.log(`    ... and ${errors.length - 10} more`);
  }
  console.log("");
}

if (validateOnly) {
  if (errors.length > 0) {
    console.log("  RESULT: FAILED");
    process.exit(1);
  } else {
    console.log("  RESULT: PASSED");
    process.exit(0);
  }
}

// Write normalized output
if (outputPath && validRows.length > 0) {
  const csvOutput = ["Species,Type", ...validRows.map((r) => `${r.species},${r.type}`)].join("\n") + "\n";
  await Bun.write(outputPath, csvOutput);
  console.log(`Written: ${outputPath} (${validRows.length} rows)`);

  if (project) {
    const kebab = toKebabCase(project);
    console.log(`\nUpload command:`);
    console.log(`  aws s3 cp ${outputPath} s3://gainforest-transparency-dashboard/predictions/${kebab}.csv --content-type "text/csv" --region us-east-1`);
  }
} else if (!validateOnly && !outputPath) {
  console.log("Use --output <path> to write the normalized CSV.");
}
