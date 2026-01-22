#!/usr/bin/env bun
/**
 * kebab-name.ts
 *
 * Shows how a project name will be converted to kebab-case for S3 path lookups.
 * This matches the exact toKebabCase() logic used in the Green Globe app.
 *
 * Usage:
 *   bun run scripts/kebab-name.ts "My Project Name"
 *   bun run scripts/kebab-name.ts --show-paths "Reserva Ecológica del Bosque"
 */

function toKebabCase(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
}

function showPaths(name: string): void {
  const kebab = toKebabCase(name);

  console.log(`Project Name: "${name}"`);
  console.log(`Kebab Case:   "${kebab}"`);
  console.log("");
  console.log("Expected S3 paths:");
  console.log(`  Layer config:      layers/${kebab}/layerData.json`);
  console.log(`  Measured trees:    shapefiles/${kebab}-all-tree-plantings.geojson`);
  console.log(`  Animal predictions: predictions/${kebab}.csv`);
  console.log(`  Tree predictions:  restor/${kebab}-trees.json`);
  console.log(`  Herb predictions:  restor/${kebab}-herbs.json`);
}

// --- CLI ---

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  console.log("Usage:");
  console.log("  bun run scripts/kebab-name.ts <project-name>");
  console.log("  bun run scripts/kebab-name.ts --show-paths <project-name>");
  console.log("");
  console.log("Options:");
  console.log("  --show-paths    Show all derived S3 paths for this project name");
  console.log("  --help, -h      Show this help");
  process.exit(0);
}

const showPathsFlag = args.includes("--show-paths");
const name = args.filter((a) => a !== "--show-paths").join(" ");

if (!name) {
  console.error("Error: Please provide a project name.");
  process.exit(1);
}

if (showPathsFlag) {
  showPaths(name);
} else {
  console.log(toKebabCase(name));
}
