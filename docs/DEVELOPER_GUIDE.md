# Developer Guide: Creating a New Project (Legacy Process)

> **Note:** This documents the current manual process for adding projects to Green Globe. This will be replaced by the ATProto-based self-service flow described in [FUTURE.md](./FUTURE.md).

## Prerequisites

- AWS CLI configured with write access to the `gainforest-transparency-dashboard` S3 bucket
- Access to the Gainforest GraphQL API (for registering the project in the canonical data source)
- Node.js/Bun installed (for running helper scripts)
- The S3 bucket base URL: `https://gainforest-transparency-dashboard.s3.us-east-1.amazonaws.com`

### Setup

```bash
# Verify AWS CLI access
aws s3 ls s3://gainforest-transparency-dashboard/ --region us-east-1

# Install script dependencies (from repo root)
bun install
```

---

## Overview: What Makes a Project Appear on the Map

For a project to be fully visible on Green Globe, the following pieces need to exist:

| # | What | Where | Required |
|---|------|-------|----------|
| 1 | Project point entry | `shapefiles/gainforest-all-shapefiles.geojson` on S3 | Yes |
| 2 | Project record | Gainforest GraphQL API (canonical) | Yes |
| 3 | Site boundary shapefiles | `shapefiles/<project>/` on S3, referenced via `awsCID` | Yes |
| 4 | Splash image | S3, referenced via `awsCID` with classification `"Project Splash"` | Recommended |
| 5 | Layer configuration | `layers/<kebab-name>/layerData.json` on S3 | Optional |
| 6 | Layer data files | GeoJSON, COGs, etc. in `layers/<kebab-name>/` on S3 | Optional |
| 7 | Measured trees | `shapefiles/<kebab-name>-all-tree-plantings.geojson` on S3 | Optional |
| 8 | Biodiversity predictions | `restor/<kebab-name>-*.json` and `predictions/<kebab-name>.csv` | Optional |

### Name Normalization

The app converts project names to **kebab-case** for all S3 path lookups. The exact algorithm:

```typescript
function toKebabCase(str: string): string {
  return str
    .normalize("NFD")                    // Decompose accented chars
    .replace(/[\u0300-\u036f]/g, "")     // Strip diacritics
    .toLowerCase()                        // Lowercase
    .replace(/[^a-z0-9]+/g, "-");        // Replace non-alphanumeric with hyphens
}
```

Examples:
- `"Reserva Ecológica"` → `reserva-ecologica`
- `"SORALO Conservation"` → `soralo-conservation`
- `"My Project (2024)"` → `my-project-2024-`

Use the helper script to check: `bun run scripts/kebab-name.ts "Your Project Name"`

---

## Step 1: Register the Project in the GraphQL API

The Gainforest GraphQL API (`NEXT_PUBLIC_GAINFOREST_ENDPOINT`) is the canonical source for project metadata. A project needs to exist here for the map overlay to load its details.

You need to create a project record with:
- A unique `id` (typically a SHA-256 hash)
- `name`, `country`, `description`, `longDescription`
- `lat`, `lon` (decimal degrees)
- `area` (in hectares)
- `assets` array (shapefiles, splash images)
- `communityMembers` array (optional)

> **Implementation note:** The GraphQL API registration process is managed by Gainforest infrastructure. Contact the team to register a new project, or if you have mutation access, use the appropriate GraphQL mutation.

---

## Step 2: Add Project Point to the Master GeoJSON

The file `shapefiles/gainforest-all-shapefiles.geojson` contains the point locations of all projects shown on the globe. Each project needs an entry here.

### Expected Format

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [36.8, -1.3]
      },
      "properties": {
        "name": "My Conservation Project",
        "projectId": "abc123def456...",
        "country": "Kenya"
      }
    }
  ]
}
```

| Property | Type | Description |
|----------|------|-------------|
| `coordinates` | `[longitude, latitude]` | WGS84 decimal degrees. **Longitude first.** |
| `name` | string | Display name of the project |
| `projectId` | string | The unique project ID (must match the GraphQL API) |
| `country` | string | Country name (full name, not ISO code) |

### Using the Helper Script

```bash
bun run scripts/create-project-point.ts \
  --name "My Conservation Project" \
  --id "abc123def456..." \
  --lat -1.3 \
  --lon 36.8 \
  --country "Kenya"
```

This downloads the current master GeoJSON, adds the new point, and uploads the updated file back to S3.

### Manual Process

```bash
# Download current file
aws s3 cp s3://gainforest-transparency-dashboard/shapefiles/gainforest-all-shapefiles.geojson ./tmp/

# Edit the file (add your feature to the features array)
# ...

# Upload back
aws s3 cp ./tmp/gainforest-all-shapefiles.geojson \
  s3://gainforest-transparency-dashboard/shapefiles/gainforest-all-shapefiles.geojson \
  --content-type "application/json"
```

---

## Step 3: Upload Site Boundary Shapefiles

Site boundaries are GeoJSON files containing Polygon or MultiPolygon geometries that define the project area on the map.

### Expected Format

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "site-001",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [36.78, -1.28],
            [36.82, -1.28],
            [36.82, -1.32],
            [36.78, -1.32],
            [36.78, -1.28]
          ]
        ]
      },
      "properties": {
        "name": "Main Conservation Site"
      }
    }
  ]
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Recommended | Unique feature identifier |
| `geometry` | Polygon/MultiPolygon | Yes | Site boundary coordinates (WGS84, `[lon, lat]`) |
| `properties.name` | string | Yes | Site display name |

### Path Convention

Upload shapefiles to a project-specific directory. The path becomes the `awsCID` value in the GraphQL API:

```
shapefiles/<project-directory>/<SiteName>.geojson
```

Example:
```bash
aws s3 cp ./Main-Site.geojson \
  s3://gainforest-transparency-dashboard/shapefiles/my-project/Main-Site.geojson \
  --content-type "application/json"
```

The `awsCID` for this asset would be: `shapefiles/my-project/Main-Site.geojson`

### Multiple Sites

Projects can have multiple shapefile assets. In the GraphQL API, each is registered with:
- `classification: "Shapefiles"`
- `awsCID: "shapefiles/<project>/<SiteName>.geojson"`
- `shapefile.default: true` (for the primary site, only one)
- `shapefile.isReference: false` (set to `true` for reference boundaries that shouldn't be navigable)
- `shapefile.shortName: "Site Display Name"`

### Validation

```bash
bun run scripts/validate-geojson.ts --type site ./Main-Site.geojson
```

---

## Step 4: Upload Splash Image

The splash image appears as the project's cover/hero image in the overlay panel and project cards.

### Requirements

- Format: JPEG, PNG, or WebP
- Recommended size: 1200x630px or similar 16:9 aspect ratio
- Max file size: No hard limit (served directly from S3), but keep under 2MB for performance

### Upload

```bash
aws s3 cp ./project-cover.jpg \
  s3://gainforest-transparency-dashboard/images/my-project/splash.jpg \
  --content-type "image/jpeg"
```

The `awsCID` for this asset would be: `images/my-project/splash.jpg`

Register in the GraphQL API with `classification: "Project Splash"`.

---

## Step 5: Create Layer Configuration

Layers are additional map overlays (biodiversity data, satellite analysis, infrastructure points, etc.) that appear in the Layers panel for a project.

### Layer Config File

Create a `layerData.json` file at: `layers/<kebab-project-name>/layerData.json`

```json
{
  "layers": [
    {
      "name": "Camera Traps",
      "type": "geojson_points",
      "endpoint": "layers/my-project/camera-traps.geojson",
      "description": "Locations of wildlife camera traps",
      "category": "Infrastructure"
    },
    {
      "name": "Forest Cover 2024",
      "type": "raster_tif",
      "endpoint": "layers/my-project/forest-cover-2024.tif",
      "description": "Forest canopy cover analysis from Sentinel-2",
      "category": "Satellite Analysis"
    },
    {
      "name": "Species Richness",
      "type": "choropleth",
      "endpoint": "layers/my-project/species-richness.geojson",
      "description": "Predicted species richness per grid cell",
      "category": "Biodiversity"
    }
  ]
}
```

### Layer Types Reference

| Type | Data Format | Required Properties | Rendering |
|------|-------------|--------------------| ----------|
| `geojson_points` | GeoJSON FeatureCollection (Points) | None required | Colored circles (color derived from layer name) |
| `geojson_points_trees` | GeoJSON FeatureCollection (Points) | Same as measured trees | Uses the trees source/layer |
| `geojson_line` | GeoJSON FeatureCollection (LineString) | None required | Purple lines |
| `choropleth` | GeoJSON FeatureCollection (Polygons) | `species_richness` (0-12) | Viridis color fill |
| `choropleth_shannon` | GeoJSON FeatureCollection (Polygons) | `shannon_index` (0-5) | Viridis color fill |
| `raster_tif` | Cloud Optimized GeoTIFF | N/A | Rendered via TiTiler |
| `tms_tile` | TMS tile pyramid | N/A | Direct tile loading |

### Point Layer Color Rules

Point layers are automatically colored based on keywords in the layer name:
- Contains `"airstrip"` → Red
- Contains `"water"` → Sky blue
- Contains `"surface"` → Maroon
- Contains `"raft"` → Black
- Contains `"basecamp"` → Green
- Default → White

### Using the Helper Script

```bash
# Scan a directory and generate layerData.json
bun run scripts/create-layer-config.ts \
  --project "My Conservation Project" \
  --dir ./my-layers/ \
  --category "Satellite Analysis"
```

### Upload

```bash
# Upload the config
aws s3 cp ./layerData.json \
  s3://gainforest-transparency-dashboard/layers/my-conservation-project/layerData.json \
  --content-type "application/json"

# Upload all layer data files
aws s3 sync ./my-layers/ \
  s3://gainforest-transparency-dashboard/layers/my-conservation-project/ \
  --exclude "layerData.json"
```

---

## Step 6: Upload Layer Data Files

Each layer referenced in `layerData.json` needs its data file uploaded to S3.

### GeoJSON Points (`geojson_points`)

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [36.801, -1.295]
      },
      "properties": {
        "name": "Camera Trap A",
        "id": "ct-001"
      }
    }
  ]
}
```

### GeoJSON Lines (`geojson_line`)

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [36.78, -1.28],
          [36.79, -1.29],
          [36.80, -1.30]
        ]
      },
      "properties": {
        "name": "River Boundary"
      }
    }
  ]
}
```

### Choropleth (`choropleth`)

The `species_richness` property is **required** and must be numeric (used for color interpolation 0-12):

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[36.78, -1.28], [36.79, -1.28], [36.79, -1.29], [36.78, -1.29], [36.78, -1.28]]]
      },
      "properties": {
        "species_richness": 8.5
      }
    }
  ]
}
```

### Shannon Choropleth (`choropleth_shannon`)

Same as above but with `shannon_index` property (0-5):

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[36.78, -1.28], [36.79, -1.28], [36.79, -1.29], [36.78, -1.29], [36.78, -1.28]]]
      },
      "properties": {
        "shannon_index": 3.2
      }
    }
  ]
}
```

### Raster TIF (`raster_tif`)

Must be a **Cloud Optimized GeoTIFF (COG)**. The file is served through TiTiler for tile rendering.

To create a COG from a regular GeoTIFF:

```bash
# Using GDAL
gdal_translate input.tif output_cog.tif \
  -of COG \
  -co COMPRESS=DEFLATE \
  -co QUALITY=75
```

Upload:
```bash
aws s3 cp ./forest-cover.tif \
  s3://gainforest-transparency-dashboard/layers/my-project/forest-cover.tif \
  --content-type "image/tiff"
```

The app constructs tile URLs as:
```
${TITILER_ENDPOINT}/cog/tiles/WebMercatorQuad/{z}/{x}/{y}@1x?url=${AWS_STORAGE}/layers/my-project/forest-cover.tif
```

### TMS Tiles (`tms_tile`)

For pre-rendered tile pyramids. Set the `endpoint` to the tile URL pattern with `{z}/{x}/{y}` placeholders. Optionally include `tileRange` for bounds:

```json
{
  "name": "Custom Basemap",
  "type": "tms_tile",
  "endpoint": "layers/my-project/tiles/{z}/{x}/{y}.png",
  "description": "Custom rendered basemap tiles",
  "category": "Basemap",
  "tileRange": {
    "x": { "min": 0, "max": 1024 },
    "y": { "min": 0, "max": 1024 }
  }
}
```

---

## Step 7: Upload Measured Trees Data

If the project has ground-truthed tree measurements, upload a GeoJSON file with the standardized schema.

### Path Convention

```
shapefiles/<kebab-project-name>-all-tree-plantings.geojson
```

Example: `shapefiles/my-conservation-project-all-tree-plantings.geojson`

### Expected GeoJSON Format

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [36.801, -1.295]
      },
      "properties": {
        "lat": -1.295,
        "lon": 36.801,
        "species": "Acacia tortilis",
        "commonName": "Umbrella Thorn",
        "height": "4.5",
        "diameter": "15.2",
        "DBH": "12.1",
        "dateMeasured": "2024-03-15",
        "datePlanted": "2022-01-10",
        "ID": "tree-001",
        "awsUrl": "https://gainforest-transparency-dashboard.s3.us-east-1.amazonaws.com/trees-measured/tree-001.jpg",
        "koboUrl": "",
        "barkAwsUrl": "https://gainforest-transparency-dashboard.s3.us-east-1.amazonaws.com/trees-measured/tree-001-bark.jpg",
        "barkKoboUrl": "",
        "leafAwsUrl": "https://gainforest-transparency-dashboard.s3.us-east-1.amazonaws.com/trees-measured/tree-001-leaf.jpg",
        "leafKoboUrl": ""
      }
    }
  ]
}
```

### Property Reference

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `lat` | number | Yes | Latitude (decimal degrees) |
| `lon` | number | Yes | Longitude (decimal degrees) |
| `species` | string | Yes | Scientific name (used for display and grouping) |
| `commonName` | string | No | Common/vernacular name |
| `height` / `Height` | string | No | Tree height in meters |
| `diameter` | string | No | Trunk diameter in cm |
| `DBH` | string | No | Diameter at breast height in cm |
| `dateMeasured` / `dateOfMeasurement` | string | No | Date of measurement (ISO or readable format) |
| `datePlanted` | string | No | Planting date |
| `ID` | string | No | Unique tree identifier |
| `awsUrl` | string | Yes* | Full S3 URL to tree photo |
| `koboUrl` | string | Yes* | KoboToolbox photo URL (can be empty) |
| `barkAwsUrl` | string | Yes* | Full S3 URL to bark photo |
| `barkKoboUrl` | string | Yes* | KoboToolbox bark photo URL (can be empty) |
| `leafAwsUrl` | string | No | Full S3 URL to leaf photo |
| `leafKoboUrl` | string | No | KoboToolbox leaf photo URL |
| `videoAwsUrl` | string | No | Full S3 URL to video |
| `soundAwsUrl` | string | No | Full S3 URL to audio recording |
| `Plant_Name` | string | No | Alternative name field (used as fallback for species) |

*These fields are typed as required in the TypeScript types but can be empty strings.

### Alternative: GainForest Tree Format

Some projects use a richer nested format with `taxonomy`, `measurements_in_cm`, `media_sources`, and `notes` objects. See the type definition in `src/app/(map-routes)/(main)/_components/ProjectOverlay/store/ayyoweca-uganda.ts` for the full schema.

### Converting from CSV

```bash
bun run scripts/csv-to-trees-geojson.ts \
  --input ./tree-measurements.csv \
  --output ./my-project-all-tree-plantings.geojson \
  --project "My Conservation Project"
```

Expected CSV columns: `lat,lon,species,commonName,height,diameter,DBH,dateMeasured,datePlanted,ID`

### Upload Tree Photos

Individual tree photos go in:
```
trees-measured/<treeID>.jpg
```

```bash
# Upload all tree photos
aws s3 sync ./tree-photos/ \
  s3://gainforest-transparency-dashboard/trees-measured/ \
  --include "*.jpg"
```

---

## Step 8: Upload Biodiversity Predictions

### Animal Predictions CSV

**Path:** `predictions/<kebab-project-name>.csv`

**Format:**
```csv
Species,Type
Panthera leo,Mammal
Loxodonta africana,Mammal
Agama agama,Reptile
Haliaeetus vocifer,Bird
Hyperolius viridiflavus,Amphibian
Diceros bicornis,IUCN Red List
```

| Column | Values |
|--------|--------|
| `Species` | Scientific name |
| `Type` | One of: `Reptile`, `Amphibian`, `Mammal`, `Bird`, `IUCN Red List` |

### Plant Predictions (Restor Format)

**Trees:** `restor/<kebab-project-name>-trees.json`
**Herbs:** `restor/<kebab-project-name>-herbs.json`

```json
{
  "items": [
    {
      "key": "gbif-12345",
      "scientificName": "Acacia tortilis",
      "commonName": "Umbrella Thorn",
      "group": "Native",
      "iucnCategory": "LC",
      "iucnTaxonId": 19892340,
      "awsUrl": "https://gainforest-transparency-dashboard.s3.us-east-1.amazonaws.com/species/acacia-tortilis.jpg",
      "traits": {
        "barkThickness": 12.5,
        "rootDepth": 3.2,
        "stemConduitDiameter": 45.0,
        "stemDiameter": 25.0,
        "treeHeight": 8.5,
        "woodDensity": 0.65
      }
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | string | Yes | Unique identifier (e.g., GBIF key) |
| `scientificName` | string | Yes | Binomial name |
| `commonName` | string | No | Common name |
| `group` | string | Yes | Grouping (e.g., "Native", "INVASIVE") |
| `iucnCategory` | string | No | IUCN Red List category (LC, VU, EN, CR, etc.) |
| `iucnTaxonId` | number | No | IUCN taxon ID |
| `awsUrl` | string | No | URL to species image |
| `imageUrl` | string | No | Alternative image URL |
| `edibleParts` | string[] | No | Edible parts of the plant |
| `traits` | object | No | Functional traits (see fields above) |

### Validation

```bash
bun run scripts/csv-to-predictions.ts --validate ./predictions.csv
```

### Upload

```bash
aws s3 cp ./predictions.csv \
  s3://gainforest-transparency-dashboard/predictions/my-conservation-project.csv \
  --content-type "text/csv"

aws s3 cp ./trees.json \
  s3://gainforest-transparency-dashboard/restor/my-conservation-project-trees.json \
  --content-type "application/json"

aws s3 cp ./herbs.json \
  s3://gainforest-transparency-dashboard/restor/my-conservation-project-herbs.json \
  --content-type "application/json"
```

---

## Step 9: Verify on the Map

After uploading all files and registering the project in the GraphQL API:

1. **Clear browser cache** or open an incognito window
2. Navigate to the Green Globe app
3. The project point should appear on the globe (from `gainforest-all-shapefiles.geojson`)
4. Click the project point to open the overlay
5. Verify:
   - Project info loads (name, description, country)
   - Site boundaries render on the map
   - Splash image appears
   - Layers panel shows configured layers (if any)
   - Measured trees appear (if uploaded)
   - Biodiversity tab shows predictions (if uploaded)

### Troubleshooting

| Issue | Likely Cause | Fix |
|-------|-------------|-----|
| Project doesn't appear on globe | Missing from `gainforest-all-shapefiles.geojson` or wrong coordinates | Check the master GeoJSON, ensure `[lon, lat]` order |
| "Project not found" on click | `projectId` in master GeoJSON doesn't match GraphQL API | Verify the ID matches exactly |
| Site boundary doesn't render | Wrong `awsCID` path or invalid GeoJSON | Validate with `scripts/validate-geojson.ts`, check S3 path |
| Layers don't show | `layerData.json` not at correct path | Must be `layers/<kebab-name>/layerData.json` — check kebab conversion |
| Raster layer blank | TIF is not a Cloud Optimized GeoTIFF | Re-encode with `gdal_translate -of COG` |
| Trees don't appear | Wrong filename path | Must be `shapefiles/<kebab-name>-all-tree-plantings.geojson` |
| Species name shows "Unknown" | Missing `species` property | Ensure every tree feature has a `species` string |
| Choropleth not colored | Missing `species_richness` or `shannon_index` property | Add the exact property name to each polygon feature |

---

## Complete Upload Script

For uploading an entire project at once, use the wrapper script:

```bash
bun run scripts/upload-project.sh \
  --name "My Conservation Project" \
  --dir ./my-project-data/
```

Expected directory structure for `--dir`:

```
my-project-data/
├── site-boundaries/          # GeoJSON polygon files → shapefiles/<project>/
│   ├── Main-Site.geojson
│   └── Buffer-Zone.geojson
├── splash.jpg                # Cover image
├── layers/                   # Layer data files → layers/<kebab-name>/
│   ├── layerData.json        # Layer config (or auto-generated)
│   ├── camera-traps.geojson
│   └── forest-cover.tif
├── trees.geojson             # Measured trees → shapefiles/<kebab-name>-all-tree-plantings.geojson
├── predictions.csv           # Animal predictions → predictions/<kebab-name>.csv
├── trees-predictions.json    # Plant predictions → restor/<kebab-name>-trees.json
└── herbs-predictions.json    # Herb predictions → restor/<kebab-name>-herbs.json
```

---

## Helper Scripts Reference

All scripts are in the `scripts/` directory and run with Bun.

| Script | Purpose | Usage |
|--------|---------|-------|
| `kebab-name.ts` | Show how a project name maps to S3 paths | `bun run scripts/kebab-name.ts "Project Name"` |
| `create-project-point.ts` | Add a project to the master GeoJSON | `bun run scripts/create-project-point.ts --name "..." --id "..." --lat N --lon E --country "..."` |
| `create-layer-config.ts` | Generate `layerData.json` from a directory | `bun run scripts/create-layer-config.ts --project "..." --dir ./layers/` |
| `validate-geojson.ts` | Validate GeoJSON against expected schemas | `bun run scripts/validate-geojson.ts --type site\|trees\|choropleth file.geojson` |
| `csv-to-trees-geojson.ts` | Convert CSV to measured trees GeoJSON | `bun run scripts/csv-to-trees-geojson.ts --input data.csv --output trees.geojson` |
| `csv-to-predictions.ts` | Validate/format predictions CSV | `bun run scripts/csv-to-predictions.ts --validate file.csv` |
| `upload-project.sh` | Upload all project files to S3 | `bash scripts/upload-project.sh --name "..." --dir ./data/` |

---

## S3 Directory Structure Reference

```
s3://gainforest-transparency-dashboard/
├── shapefiles/
│   ├── gainforest-all-shapefiles.geojson      # Master project points (ALL projects)
│   ├── <project-dir>/                          # Per-project site boundaries
│   │   └── <SiteName>.geojson                  #   (awsCID = "shapefiles/<project-dir>/<SiteName>.geojson")
│   └── <kebab-name>-all-tree-plantings.geojson # Measured trees per project
├── layers/
│   ├── global/
│   │   └── layerData.json                      # Global layers config
│   └── <kebab-project-name>/
│       ├── layerData.json                      # Project layer config
│       ├── *.geojson                           # GeoJSON layer data
│       └── *.tif                               # COG raster layers
├── restor/
│   ├── <kebab-name>-trees.json                 # Plant species predictions
│   └── <kebab-name>-herbs.json                 # Herb species predictions
├── predictions/
│   └── <kebab-name>.csv                        # Animal species predictions
├── trees-measured/
│   └── <treeID>.jpg                            # Individual tree photos
├── transactions/
│   └── fiat-transactions.csv                   # Donation records
├── images/
│   └── <project>/splash.jpg                    # Project splash images
└── miscellaneous/
    └── placeholders/
        └── taxa_plants.png                     # Fallback image
```
