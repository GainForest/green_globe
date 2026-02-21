// Re-export SDK utilities for convenient access across the app

// AT Protocol utilities
export { getBlobUrl, parseAtUri } from "gainforest-sdk/utilities/atproto";

// Serialization utilities
export { serialize, deserialize } from "gainforest-sdk/utilities/transform";
export type { SerializedSuperjson } from "gainforest-sdk/utilities/transform";

// GeoJSON utilities
export { computePolygonMetrics } from "gainforest-sdk/utilities/geojson";

// Response types
export type {
  GetRecordResponse,
  PutRecordResponse,
} from "gainforest-sdk/types";

// Lexicon types — only re-exporting types that exist in gainforest-sdk/lex-api.
// AppGainforestOrganizationSite, AppGainforestOrganizationMember, and
// AppGainforestOrganizationDonation are NOT exported by the SDK's lex-api and
// have been omitted.
//
// ⚠️  SDK TYPE LIMITATION — AppGainforestOrganizationLayer (Main$3 in the SDK)
// The vendored gainforest-sdk tarball (vendor/gainforest-sdk-nextjs-0.1.1.tgz)
// contains stale generated types for app.gainforest.organization.layer. The SDK's
// Main$3 interface only declares: name, type (missing heatmap/contour/satellite_overlay),
// uri, description, createdAt, and [k: string]: unknown.
//
// The full field set defined in lexicons/app/gainforest/organization/layer.json —
// category, displayOrder, isDefault, opacity, thumbnail, legend (LegendEntry[]),
// colorScale, unit, minValue, maxValue, tilePattern, tileMinZoom, tileMaxZoom,
// bounds, dataSource, dataDate, propertyKey, siteRef — is NOT reflected in the
// SDK type.
//
// The LOCAL lexicon-api/ types (regenerated via `bun run codegen:lexicon-api`)
// ARE up to date and include all fields. Prefer importing from lexicon-api/ when
// you need the full type:
//   import type { Record as LayerRecord } from "@/lexicon-api/types/app/gainforest/organization/layer"
//
// When you must use the SDK's AppGainforestOrganizationLayer type (e.g. via tRPC
// responses), access extended fields defensively via the index signature:
//   const category = (layer as { category?: string }).category ?? ""
//   const isDefault = (layer as { isDefault?: boolean }).isDefault ?? false
//   const legend = Array.isArray((layer as { legend?: unknown }).legend)
//     ? (layer as { legend?: LegendEntry[] }).legend
//     : undefined
export type {
  AppGainforestOrganizationInfo,
  AppGainforestOrganizationDefaultSite,
  AppGainforestOrganizationLayer,
  AppGainforestOrganizationRecordingsAudio,
  AppCertifiedLocation,
} from "gainforest-sdk/lex-api";
