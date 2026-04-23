#!/bin/bash
#
# upload-project.sh
#
# Uploads all project data files to the correct S3 paths for Green Globe.
#
# Usage:
#   bash scripts/upload-project.sh --name "My Conservation Project" --dir ./my-project-data/
#
# Expected directory structure:
#   my-project-data/
#   ├── site-boundaries/          → shapefiles/<project-dir>/
#   │   ├── Main-Site.geojson
#   │   └── Buffer-Zone.geojson
#   ├── splash.jpg                → images/<kebab-name>/splash.jpg
#   ├── layers/                   → layers/<kebab-name>/
#   │   ├── layerData.json
#   │   ├── camera-traps.geojson
#   │   └── forest-cover.tif
#   ├── trees.geojson             → shapefiles/<kebab-name>-all-tree-plantings.geojson
#   ├── predictions.csv           → predictions/<kebab-name>.csv
#   ├── trees-predictions.json    → restor/<kebab-name>-trees.json
#   └── herbs-predictions.json    → restor/<kebab-name>-herbs.json
#
# Options:
#   --name       Project name (required)
#   --dir        Project data directory (required)
#   --bucket     S3 bucket (default: gainforest-transparency-dashboard)
#   --region     AWS region (default: us-east-1)
#   --dry-run    Show commands without executing
#   --help       Show this help

set -euo pipefail

# --- Defaults ---
BUCKET="gainforest-transparency-dashboard"
REGION="us-east-1"
DRY_RUN=false
PROJECT_NAME=""
PROJECT_DIR=""

# --- Parse arguments ---
while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)
      PROJECT_NAME="$2"
      shift 2
      ;;
    --dir)
      PROJECT_DIR="$2"
      shift 2
      ;;
    --bucket)
      BUCKET="$2"
      shift 2
      ;;
    --region)
      REGION="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --help|-h)
      head -35 "$0" | tail -33
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# --- Validate ---
if [[ -z "$PROJECT_NAME" ]]; then
  echo "Error: --name is required"
  exit 1
fi

if [[ -z "$PROJECT_DIR" ]]; then
  echo "Error: --dir is required"
  exit 1
fi

if [[ ! -d "$PROJECT_DIR" ]]; then
  echo "Error: Directory does not exist: $PROJECT_DIR"
  exit 1
fi

# --- Kebab case conversion (matches toKebabCase in the app) ---
# Uses perl for NFD normalization + diacritic stripping
to_kebab_case() {
  echo "$1" | perl -CS -MUnicode::Normalize -e '
    my $str = <STDIN>;
    chomp $str;
    $str = NFD($str);
    $str =~ s/\p{M}//g;
    $str = lc($str);
    $str =~ s/[^a-z0-9]+/-/g;
    print $str;
  '
}

KEBAB_NAME=$(to_kebab_case "$PROJECT_NAME")

echo "Project: $PROJECT_NAME"
echo "Kebab:   $KEBAB_NAME"
echo "Dir:     $PROJECT_DIR"
echo "Bucket:  s3://$BUCKET"
echo "Region:  $REGION"
echo "Dry run: $DRY_RUN"
echo ""

# --- Helper ---
run_cmd() {
  if [[ "$DRY_RUN" == "true" ]]; then
    echo "  [dry-run] $*"
  else
    echo "  $*"
    "$@"
  fi
}

uploaded=0

# --- 1. Site boundaries ---
if [[ -d "$PROJECT_DIR/site-boundaries" ]]; then
  echo "=== Uploading site boundaries ==="
  for f in "$PROJECT_DIR/site-boundaries"/*.geojson; do
    if [[ -f "$f" ]]; then
      filename=$(basename "$f")
      run_cmd aws s3 cp "$f" "s3://$BUCKET/shapefiles/$KEBAB_NAME/$filename" \
        --content-type "application/json" --region "$REGION"
      ((uploaded++))
    fi
  done
  echo ""
fi

# --- 2. Splash image ---
for ext in jpg jpeg png webp; do
  if [[ -f "$PROJECT_DIR/splash.$ext" ]]; then
    echo "=== Uploading splash image ==="
    content_type="image/$ext"
    [[ "$ext" == "jpg" ]] && content_type="image/jpeg"
    run_cmd aws s3 cp "$PROJECT_DIR/splash.$ext" \
      "s3://$BUCKET/images/$KEBAB_NAME/splash.$ext" \
      --content-type "$content_type" --region "$REGION"
    ((uploaded++))
    echo ""
    break
  fi
done

# --- 3. Layers ---
if [[ -d "$PROJECT_DIR/layers" ]]; then
  echo "=== Uploading layers ==="
  # Upload layerData.json first
  if [[ -f "$PROJECT_DIR/layers/layerData.json" ]]; then
    run_cmd aws s3 cp "$PROJECT_DIR/layers/layerData.json" \
      "s3://$BUCKET/layers/$KEBAB_NAME/layerData.json" \
      --content-type "application/json" --region "$REGION"
    ((uploaded++))
  else
    echo "  Warning: No layerData.json found. Run create-layer-config.ts to generate one."
  fi

  # Upload all other layer files
  for f in "$PROJECT_DIR/layers"/*; do
    if [[ -f "$f" && "$(basename "$f")" != "layerData.json" ]]; then
      filename=$(basename "$f")
      ext="${filename##*.}"
      content_type="application/octet-stream"
      case "$ext" in
        geojson|json) content_type="application/json" ;;
        tif|tiff) content_type="image/tiff" ;;
        png) content_type="image/png" ;;
        csv) content_type="text/csv" ;;
      esac
      run_cmd aws s3 cp "$f" "s3://$BUCKET/layers/$KEBAB_NAME/$filename" \
        --content-type "$content_type" --region "$REGION"
      ((uploaded++))
    fi
  done
  echo ""
fi

# --- 4. Measured trees ---
if [[ -f "$PROJECT_DIR/trees.geojson" ]]; then
  echo "=== Uploading measured trees ==="
  run_cmd aws s3 cp "$PROJECT_DIR/trees.geojson" \
    "s3://$BUCKET/shapefiles/${KEBAB_NAME}-all-tree-plantings.geojson" \
    --content-type "application/json" --region "$REGION"
  ((uploaded++))
  echo ""
fi

# --- 5. Tree photos ---
if [[ -d "$PROJECT_DIR/tree-photos" ]]; then
  echo "=== Uploading tree photos ==="
  run_cmd aws s3 sync "$PROJECT_DIR/tree-photos/" \
    "s3://$BUCKET/trees-measured/" \
    --region "$REGION"
  # Count files
  photo_count=$(find "$PROJECT_DIR/tree-photos" -type f | wc -l | tr -d ' ')
  echo "  ($photo_count photos)"
  ((uploaded += photo_count))
  echo ""
fi

# --- 6. Animal predictions CSV ---
if [[ -f "$PROJECT_DIR/predictions.csv" ]]; then
  echo "=== Uploading animal predictions ==="
  run_cmd aws s3 cp "$PROJECT_DIR/predictions.csv" \
    "s3://$BUCKET/predictions/$KEBAB_NAME.csv" \
    --content-type "text/csv" --region "$REGION"
  ((uploaded++))
  echo ""
fi

# --- 7. Plant predictions (restor format) ---
if [[ -f "$PROJECT_DIR/trees-predictions.json" ]]; then
  echo "=== Uploading tree predictions ==="
  run_cmd aws s3 cp "$PROJECT_DIR/trees-predictions.json" \
    "s3://$BUCKET/restor/${KEBAB_NAME}-trees.json" \
    --content-type "application/json" --region "$REGION"
  ((uploaded++))
  echo ""
fi

if [[ -f "$PROJECT_DIR/herbs-predictions.json" ]]; then
  echo "=== Uploading herb predictions ==="
  run_cmd aws s3 cp "$PROJECT_DIR/herbs-predictions.json" \
    "s3://$BUCKET/restor/${KEBAB_NAME}-herbs.json" \
    --content-type "application/json" --region "$REGION"
  ((uploaded++))
  echo ""
fi

# --- Summary ---
echo "=== Done ==="
echo "  Files uploaded: $uploaded"
echo ""
echo "Next steps:"
echo "  1. Register the project in the Gainforest GraphQL API"
echo "  2. Add a point to the master GeoJSON:"
echo "     bun run scripts/create-project-point.ts --name \"$PROJECT_NAME\" --id <project-id> --lat <lat> --lon <lon> --country <country>"
echo "  3. Verify on the map (clear browser cache and reload)"
