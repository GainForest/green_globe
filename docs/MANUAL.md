# Green Globe - Architecture Manual

## Overview

Green Globe (`impact-trace`) is a Next.js 15 App Router application that renders an interactive Mapbox globe for visualizing conservation projects. Users can explore project sites, view shapefiles, measured trees, satellite imagery layers, and community data. Authentication uses Web3 wallet signing (SIWE) via Reown AppKit + NextAuth.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind CSS, shadcn/ui |
| Runtime | Bun |
| Map | Mapbox GL JS (globe projection, satellite-streets-v12) |
| State | Zustand + Immer |
| Data Fetching | TanStack React Query (client), Server Actions (server) |
| Auth | SIWE (Sign-In With Ethereum) via Reown AppKit + NextAuth (JWT) |
| Database | Google BigQuery |
| Deployment | Vercel |

## Data Sources

The application consumes project data from three external services. **All access is read-only** -- there are no write/upload operations in the current codebase.

### 1. Gainforest GraphQL API

The primary source of rich project data used for the map overlay.

- **Endpoint:** `${NEXT_PUBLIC_GAINFOREST_ENDPOINT}/api/graphql`
- **Method:** POST (GraphQL query)
- **Returns:** Full project details including name, country, coordinates, area, assets (shapefiles, splash images), community members, wallets, and more.
- **Consumed by:** `src/app/(map-routes)/(main)/_components/ProjectOverlay/store/utils.ts`

#### GraphQL Query Fields

```graphql
query {
  project(id: "<projectId>") {
    id, name, country, dataDownloadUrl, dataDownloadInfo,
    description, longDescription, stripeUrl, discordId,
    lat, lon, area, objective,
    assets { id, name, classification, awsCID, shapefile { default, isReference, shortName } },
    communityMembers { id, firstName, lastName, priority, role, bio, fundsReceived, profileUrl, Wallet { CeloAccounts, SOLAccounts } },
    Wallet { CeloAccounts, SOLAccounts }
  }
}
```

### 2. Google BigQuery

Provides paginated project metadata for the projects list API.

- **Project ID:** `ecocertain`
- **Dataset:** `green_globe_v2_development`
- **Table:** `project`
- **Client:** `src/app/api/bigquery.ts`
- **Operations:** SELECT only (no INSERT/UPDATE/DELETE)

#### Schema (project table)

| Column | Type |
|--------|------|
| id | string |
| country | string |
| description | string |
| longDescription | string |
| endDate | string |
| startDate | string |
| objective | string |
| lat | string |
| lon | string |

#### API Access Patterns

| Path | Method | Description |
|------|--------|-------------|
| `GET /api/projects` | HTTP Route | Paginated project list with sorting |
| `getProjects()` | Server Action | Direct BigQuery access from server components |

Both support pagination (`page`, `pageSize`) and sorting (`sortField`, `sortOrder`).

### 3. AWS S3 (Read-Only Asset Serving)

Static file hosting for project assets. **There is no upload mechanism** -- all files are pre-existing in the bucket.

- **Bucket:** `gainforest-transparency-dashboard.s3.us-east-1.amazonaws.com`
- **Base URL env:** `NEXT_PUBLIC_AWS_STORAGE`

#### Asset Types Served

| Path Pattern | Content |
|-------------|---------|
| `/shapefiles/<project>/*.geojson` | Project boundary GeoJSON files |
| `/shapefiles/<project>-all-tree-plantings.geojson` | Measured tree locations |
| `/trees-measured/...` | Tree photos |
| `/predictions/...` | ML prediction CSVs |
| `/layers/...` | Raster/vector layer data |
| `/restor/...` | Biodiversity restoration data |
| `/miscellaneous/placeholders/...` | Placeholder images |
| `<asset.awsCID>` | Any asset referenced by the GraphQL API |

Assets are referenced by their `awsCID` field from the GraphQL response and fetched as: `${NEXT_PUBLIC_AWS_STORAGE}/${awsCID}`.

### 4. TiTiler (COG Tile Server)

Renders Cloud Optimized GeoTIFF raster layers on the map.

- **Endpoint:** `${NEXT_PUBLIC_TITILER_ENDPOINT}`
- **Purpose:** Tile rendering for satellite/raster overlays stored as COGs on S3

## Project Data Models

### Simple Project (BigQuery / API routes)

```typescript
// src/app/api/types.ts
type Project = {
  id: string;
  country: string;
  description: string;
  endDate: string;
  startDate: string;
  objective: string;
  lat: string;
  lon: string;
};
```

### Full Project (GraphQL / Map Overlay)

```typescript
// src/app/(map-routes)/(main)/_components/ProjectOverlay/store/types.ts
type Project = {
  id: string;
  name: string;
  country: string;
  dataDownloadUrl: string;
  dataDownloadInfo: string;
  description: string;
  longDescription: string;
  stripeUrl: string;
  discordId: string | null;
  lat: number;
  lon: number;
  area: number;
  objective?: string;
  assets: Asset[];
  communityMembers: CommunityMember[];
  Wallet: unknown | null;
};

type Asset = {
  id: string;
  name: string;
  classification: string;  // "Shapefiles", "Project Splash", etc.
  awsCID: string;           // Path within the S3 bucket
  shapefile: Shapefile | null;
};
```

## Application Flow

### How Projects Appear on the Map

1. User navigates to the globe view (`/(map-routes)/(main)/`)
2. The project overlay store fetches project polygon data from the Gainforest GraphQL API
3. Project points are rendered on the Mapbox globe
4. Clicking a project triggers `fetchProjectData(projectId)` which queries GraphQL for full details
5. The overlay panel shows project info, shapefiles are loaded from S3 by `awsCID`
6. Measured trees, raster layers, and other assets are fetched from S3 as needed

### How the Projects API Works

1. Client sends `GET /api/projects?page=1&pageSize=100&sortField=id&sortOrder=ASC`
2. The route handler queries BigQuery for paginated results
3. Response includes `{ success, pagination: { total, page, pageSize, totalPages, hasNextPage, hasPrevPage }, data }`

### Authentication Flow

1. User clicks "Connect Wallet" (Reown AppKit)
2. Wallet provider prompts for SIWE signature
3. Signature verified server-side via NextAuth
4. JWT session created with `address` field
5. Protected pages (e.g., `/my-projects`) check `session.address`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Yes | Mapbox GL JS access token |
| `NEXT_PUBLIC_GAINFOREST_ENDPOINT` | Yes | Gainforest GraphQL API base URL |
| `NEXT_PUBLIC_AWS_STORAGE` | Yes | S3 bucket base URL for static assets |
| `NEXT_PUBLIC_TITILER_ENDPOINT` | Yes | TiTiler COG tile server endpoint |
| `NEXT_PUBLIC_REOWN_PROJECT_ID` | Yes | Reown AppKit project ID (Web3 wallet) |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Yes | BigQuery service account credentials (JSON string) |
| `NEXTAUTH_SECRET` | Yes | NextAuth JWT signing secret |
| `NICFI_API_KEY` | No | Planet NICFI satellite tile proxy key |
| `NEXT_PUBLIC_BITQUERY_API_KEY` | No | Blockchain transaction query key |

## Project Structure (Key Directories)

```
src/app/
  (map-routes)/(main)/
    _components/
      Map/                    # Mapbox instance, sources, layers
      ProjectOverlay/         # Project detail panel + store
        store/
          types.ts            # Full Project type
          utils.ts            # GraphQL fetch, S3 asset helpers
      Search/                 # Project search UI
      Layers/                 # Map layer controls
    _features/navigation/     # URL <-> state sync (Zustand store)
  (non-map-routes)/
    my-projects/              # Auth-gated project list (currently mock data)
  api/
    projects/
      route.ts                # GET /api/projects (BigQuery)
      action.ts               # Server action: getProjects()
    bigquery.ts               # BigQuery client initialization
    types.ts                  # Simple Project type, BigQueryError
    auth/                     # NextAuth + SIWE config
```

## Current Limitations

- **No project creation:** There are no POST/PUT endpoints, forms, or mutation logic for creating projects.
- **No file uploads:** No presigned URL generation, no `@aws-sdk/client-s3` dependency, no upload UI.
- **No BigQuery writes:** Only SELECT queries exist. No INSERT/UPDATE/DELETE operations.
- **No GraphQL mutations:** Only read queries are performed against the Gainforest API.
- **Mock data:** The `/my-projects` page renders hardcoded mock projects instead of real user data.
- **Placeholder features:** The "Edit" tab in the project overlay exists in the tab list but renders nothing.
- **Hardcoded overrides:** The SORALO project has hardcoded shapefile asset overrides in `utils.ts`.
