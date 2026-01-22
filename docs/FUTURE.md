# [RFC] Green Globe v2: Migration to AT Protocol Architecture

## Summary

Migrate Green Globe from its current centralized data model (BigQuery + Gainforest GraphQL API) to a decentralized AT Protocol architecture. Users will authenticate via ATProto, create project records in their Personal Data Server (PDS), and a dedicated AppView service will index these records from the Jetstream into PostgreSQL and expose them via a GraphQL endpoint that Green Globe consumes.

## Motivation

The current architecture has several limitations:
- **Centralized data ownership:** Project data lives in Gainforest-controlled BigQuery tables and a proprietary GraphQL API. Project owners have no sovereignty over their data.
- **No write path:** The app is entirely read-only with no mechanism for project creation, editing, or asset management.
- **Vendor lock-in:** BigQuery for metadata, a custom GraphQL API for rich data, and S3 for assets creates a tightly coupled stack with no clear source of truth.
- **Auth mismatch:** SIWE (wallet-based) auth doesn't align with the broader social/identity ecosystem.

ATProto provides:
- **User-owned data:** Projects are records in the user's PDS, cryptographically signed and portable.
- **Decentralized identity:** DID-based identity with handle resolution.
- **Event-driven indexing:** The Jetstream provides real-time record creation/update/delete events.
- **Blob storage for small-medium assets:** Images, shapefiles, and small datasets can live directly in the PDS (up to 100MB per blob).
- **Open schema:** Lexicons are published, versioned, and discoverable.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           AT Protocol Network                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                          │
│  │  User A  │    │  User B  │    │  User C  │    ...                   │
│  │   PDS    │    │   PDS    │    │   PDS    │                          │
│  │          │    │          │    │          │                          │
│  │ • org.info│   │ • org.info│   │ • org.info│                         │
│  │ • layers │    │ • layers │    │ • layers │                          │
│  │ • obs.*  │    │ • obs.*  │    │ • obs.*  │                          │
│  │ • blobs  │    │ • blobs  │    │ • blobs  │                          │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘                          │
│       │               │               │                                 │
│       └───────────────┼───────────────┘                                 │
│                       ▼                                                  │
│              ┌─────────────────┐                                        │
│              │     Relay       │                                        │
│              │  (Firehose)     │                                        │
│              └────────┬────────┘                                        │
│                       │                                                  │
└───────────────────────┼─────────────────────────────────────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │    Jetstream    │
              │  (JSON stream)  │
              │                 │
              │ Filter:         │
              │ app.gainforest.*│
              └────────┬────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                    AppView Service                            │
│                  (Separate repository)                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │ Jetstream       │    │   PostgreSQL    │                 │
│  │ Consumer        │───▶│                 │                 │
│  │                 │    │ • organizations │                 │
│  │ • on create     │    │ • layers        │                 │
│  │ • on update     │    │ • observations  │                 │
│  │ • on delete     │    │ • predictions   │                 │
│  └─────────────────┘    │ • blobs_meta    │                 │
│                          └────────┬────────┘                 │
│                                   │                          │
│                          ┌────────▼────────┐                 │
│                          │  GraphQL API    │                 │
│                          │                 │                 │
│                          │ • queries       │                 │
│                          │ • subscriptions │                 │
│                          └────────┬────────┘                 │
│                                   │                          │
└───────────────────────────────────┼──────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────┐
│                      Green Globe                             │
│                   (This repository)                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │ ATProto     │  │ Map View     │  │ Project         │    │
│  │ OAuth       │  │ (Mapbox)     │  │ Management      │    │
│  │ Login       │  │              │  │ (Create/Edit)   │    │
│  └─────────────┘  └──────────────┘  └─────────────────┘    │
│                                                              │
│  Data flow:                                                  │
│  • Read: GraphQL queries to AppView                          │
│  • Write: ATProto API calls to user's PDS                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                  External Storage (S3)                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  For large assets that exceed ATProto blob limits:           │
│  • Drone imagery (GeoTIFFs, orthomosaics) — multi-GB        │
│  • Large Cloud Optimized GeoTIFFs (COGs)                     │
│  • Video recordings                                          │
│  • Large point cloud datasets                                │
│                                                              │
│  Referenced via URI in lexicon records                        │
│  (e.g., organization.layer.uri field)                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Lexicon Data Model

The data structure is defined in [GainForest/lexicons](https://github.com/GainForest/lexicons). Below is the complete schema reference:

### `app.gainforest.organization.info` (key: `literal:self`)

The primary project/organization declaration. One per user PDS.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `displayName` | string | Yes | Organization name (8-255 chars) |
| `shortDescription` | string | Yes | Short description (50-2000 chars) |
| `longDescription` | string | Yes | Rich text long description (50-5000 chars) |
| `coverImage` | `common.defs#smallImage` | No | Cover image blob (max 5MB, jpeg/png/webp) |
| `logo` | `common.defs#smallImage` | No | Logo blob (max 5MB, jpeg/png/webp) |
| `objectives` | string[] | Yes | Enum: Conservation, Research, Education, Community, Other |
| `startDate` | datetime | No | Project start date |
| `website` | uri | No | Project website URL |
| `country` | string | Yes | ISO 3166-1 alpha-2 country code |
| `visibility` | string | Yes | Enum: Public, Hidden |
| `createdAt` | datetime | Yes | Record creation timestamp |

### `app.gainforest.organization.defaultSite` (key: `literal:self`)

Points to the default site/shapefile record.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `site` | at-uri | Yes | AT URI reference to a site record in the PDS |
| `createdAt` | datetime | Yes | Record creation timestamp |

### `app.gainforest.organization.layer` (key: `tid`)

Layer definitions for map visualization. Multiple per organization.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Layer display name |
| `type` | string | Yes | Enum: `geojson_points`, `geojson_points_trees`, `geojson_line`, `choropleth`, `choropleth_shannon`, `raster_tif`, `tms_tile` |
| `uri` | uri | Yes | URI to the layer data (S3, IPFS, or any HTTP endpoint) |
| `description` | string | No | Layer description |
| `createdAt` | datetime | Yes | Record creation timestamp |

### `app.gainforest.organization.observations.fauna` (key: `tid`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `gbifTaxonKeys` | string[] | Yes | Array of GBIF taxon keys |
| `createdAt` | datetime | Yes | Record creation timestamp |

### `app.gainforest.organization.observations.flora` (key: `tid`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `gbifTaxonKeys` | string[] | Yes | Array of GBIF taxon keys |
| `createdAt` | datetime | Yes | Record creation timestamp |

### `app.gainforest.organization.observations.measuredTreesCluster` (key: `tid`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `shapefile` | `common.defs#smallBlob` | Yes | GeoJSON blob of tree measurements (max 10MB) |
| `createdAt` | datetime | Yes | Record creation timestamp |

### `app.gainforest.organization.observations.dendogram` (key: `literal:self`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `dendogram` | `common.defs#smallBlob` | Yes | SVG dendogram blob (max 10MB) |
| `createdAt` | datetime | Yes | Record creation timestamp |

### `app.gainforest.organization.predictions.fauna` (key: `tid`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `gbifTaxonKeys` | string[] | Yes | Array of predicted GBIF taxon keys |
| `createdAt` | datetime | Yes | Record creation timestamp |

### `app.gainforest.organization.predictions.flora` (key: `tid`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `gbifTaxonKeys` | string[] | Yes | Array of predicted GBIF taxon keys |
| `createdAt` | datetime | Yes | Record creation timestamp |

### `app.gainforest.organization.getIndexedOrganizations` (type: query)

AppView-served query that returns all indexed organizations.

| Field | Type | Description |
|-------|------|-------------|
| `organizations[]` | `common.defs#indexedOrganization` | Array of `{ id: at-uri, name: string }` |

### Common Definitions (`app.gainforest.common.defs`)

| Def | Description | Constraints |
|-----|-------------|-------------|
| `uri` | Object with a `uri` string field | max 1024 graphemes |
| `smallBlob` | Generic blob container | max 10MB, any MIME type |
| `largeBlob` | Large blob container | max 100MB, any MIME type |
| `smallImage` | Image blob container | max 5MB, jpeg/jpg/png/webp |
| `largeImage` | Large image blob container | max 10MB, jpeg/jpg/png/webp |
| `indexedOrganization` | Minimal org reference | `{ id: at-uri, name: string }` |

---

## Implementation Plan

### Phase 1: AppView Service (Jetstream Consumer + PostgreSQL + GraphQL)

> **Deliverable:** A standalone service (separate repo) that listens to the Jetstream, indexes `app.gainforest.*` records into PostgreSQL, and exposes a GraphQL API.

#### 1.1 Project Setup

- [ ] Create new repository (e.g., `gainforest/green-globe-appview`)
- [ ] Choose runtime: Node.js (TypeScript) with:
  - `ws` or `@skyware/jetstream` for Jetstream WebSocket consumption
  - `prisma` or `drizzle-orm` for PostgreSQL ORM
  - `graphql-yoga` or `apollo-server` for GraphQL endpoint
  - `@atproto/api` for resolving DIDs and fetching blobs
- [ ] Docker Compose for local development (PostgreSQL + AppView service)
- [ ] CI/CD pipeline (GitHub Actions → deploy to Fly.io / Railway / VPS)

#### 1.2 PostgreSQL Schema Design

```sql
-- Organizations (indexed from app.gainforest.organization.info)
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  did TEXT NOT NULL,                     -- Owner's DID (e.g., did:plc:xxxxx)
  handle TEXT,                           -- Resolved handle (e.g., user.bsky.social)
  at_uri TEXT NOT NULL UNIQUE,           -- Full AT URI of the record
  display_name TEXT NOT NULL,
  short_description TEXT NOT NULL,
  long_description TEXT NOT NULL,
  cover_image_cid TEXT,                  -- CID of the blob in the user's PDS
  logo_cid TEXT,                         -- CID of the blob in the user's PDS
  objectives TEXT[] NOT NULL,
  start_date TIMESTAMPTZ,
  website TEXT,
  country CHAR(2) NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'Public',
  created_at TIMESTAMPTZ NOT NULL,
  indexed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organizations_did ON organizations(did);
CREATE INDEX idx_organizations_country ON organizations(country);
CREATE INDEX idx_organizations_visibility ON organizations(visibility);

-- Layers (indexed from app.gainforest.organization.layer)
CREATE TABLE layers (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  did TEXT NOT NULL,
  at_uri TEXT NOT NULL UNIQUE,
  tid TEXT NOT NULL,                     -- Record key (TID)
  name TEXT NOT NULL,
  type TEXT NOT NULL,                    -- geojson_points, raster_tif, etc.
  uri TEXT NOT NULL,                     -- URI to actual layer data
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  indexed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_layers_org ON layers(organization_id);
CREATE INDEX idx_layers_type ON layers(type);

-- Default sites (indexed from app.gainforest.organization.defaultSite)
CREATE TABLE default_sites (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  did TEXT NOT NULL,
  at_uri TEXT NOT NULL UNIQUE,
  site_at_uri TEXT NOT NULL,             -- AT URI reference to the site record
  created_at TIMESTAMPTZ NOT NULL,
  indexed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fauna observations
CREATE TABLE observations_fauna (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  did TEXT NOT NULL,
  at_uri TEXT NOT NULL UNIQUE,
  tid TEXT NOT NULL,
  gbif_taxon_keys TEXT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  indexed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Flora observations
CREATE TABLE observations_flora (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  did TEXT NOT NULL,
  at_uri TEXT NOT NULL UNIQUE,
  tid TEXT NOT NULL,
  gbif_taxon_keys TEXT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  indexed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Measured trees clusters
CREATE TABLE observations_measured_trees (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  did TEXT NOT NULL,
  at_uri TEXT NOT NULL UNIQUE,
  tid TEXT NOT NULL,
  shapefile_cid TEXT NOT NULL,           -- CID of the blob
  created_at TIMESTAMPTZ NOT NULL,
  indexed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dendograms
CREATE TABLE observations_dendograms (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  did TEXT NOT NULL,
  at_uri TEXT NOT NULL UNIQUE,
  dendogram_cid TEXT NOT NULL,           -- CID of the SVG blob
  created_at TIMESTAMPTZ NOT NULL,
  indexed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fauna predictions
CREATE TABLE predictions_fauna (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  did TEXT NOT NULL,
  at_uri TEXT NOT NULL UNIQUE,
  tid TEXT NOT NULL,
  gbif_taxon_keys TEXT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  indexed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Flora predictions
CREATE TABLE predictions_flora (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  did TEXT NOT NULL,
  at_uri TEXT NOT NULL UNIQUE,
  tid TEXT NOT NULL,
  gbif_taxon_keys TEXT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  indexed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cursor tracking for Jetstream consumption
CREATE TABLE jetstream_cursor (
  id INTEGER PRIMARY KEY DEFAULT 1,
  cursor_us BIGINT NOT NULL,             -- Microsecond timestamp cursor
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 1.3 Jetstream Consumer

- [ ] Connect to Jetstream WebSocket endpoint:
  ```
  wss://jetstream2.us-east.bsky.network/subscribe?wantedCollections=app.gainforest.organization.info&wantedCollections=app.gainforest.organization.layer&wantedCollections=app.gainforest.organization.defaultSite&wantedCollections=app.gainforest.organization.observations.fauna&wantedCollections=app.gainforest.organization.observations.flora&wantedCollections=app.gainforest.organization.observations.measuredTreesCluster&wantedCollections=app.gainforest.organization.observations.dendogram&wantedCollections=app.gainforest.organization.predictions.fauna&wantedCollections=app.gainforest.organization.predictions.flora
  ```
- [ ] Handle event types:
  - `commit` with operation `create`: INSERT into PostgreSQL
  - `commit` with operation `update`: UPDATE in PostgreSQL
  - `commit` with operation `delete`: DELETE from PostgreSQL
- [ ] Persist cursor position (`time_us` field) to survive restarts
- [ ] On startup, resume from last persisted cursor
- [ ] Resolve DIDs to handles via `com.atproto.identity.resolveHandle` for display purposes
- [ ] Handle reconnection with exponential backoff
- [ ] Log and skip malformed records (don't crash on bad data)

#### 1.4 Backfill Strategy

- [ ] On first boot (no cursor), enumerate known organizations and fetch their repos directly via `com.atproto.repo.listRecords`
- [ ] Alternatively, consume from Jetstream with `cursor=0` to replay history (if the Jetstream instance retains enough history)
- [ ] Provide a CLI command to manually backfill a specific DID:
  ```bash
  appview backfill did:plc:xxxxx
  ```

#### 1.5 GraphQL API

- [ ] Define GraphQL schema matching the lexicon data model:

```graphql
type Organization {
  id: ID!
  did: String!
  handle: String
  atUri: String!
  displayName: String!
  shortDescription: String!
  longDescription: String!
  coverImageUrl: String
  logoUrl: String
  objectives: [String!]!
  startDate: DateTime
  website: String
  country: String!
  visibility: String!
  createdAt: DateTime!
  layers: [Layer!]!
  defaultSite: DefaultSite
  observationsFauna: [FaunaObservation!]!
  observationsFlora: [FloraObservation!]!
  measuredTreesClusters: [MeasuredTreesCluster!]!
  dendogram: Dendogram
  predictionsFauna: [FaunaPrediction!]!
  predictionsFlora: [FloraPrediction!]!
}

type Layer {
  id: ID!
  tid: String!
  name: String!
  type: LayerType!
  uri: String!
  description: String
  createdAt: DateTime!
}

enum LayerType {
  geojson_points
  geojson_points_trees
  geojson_line
  choropleth
  choropleth_shannon
  raster_tif
  tms_tile
}

type DefaultSite {
  siteAtUri: String!
  createdAt: DateTime!
}

type FaunaObservation {
  id: ID!
  tid: String!
  gbifTaxonKeys: [String!]!
  createdAt: DateTime!
}

type FloraObservation {
  id: ID!
  tid: String!
  gbifTaxonKeys: [String!]!
  createdAt: DateTime!
}

type MeasuredTreesCluster {
  id: ID!
  tid: String!
  shapefileUrl: String!
  createdAt: DateTime!
}

type Dendogram {
  id: ID!
  dendogramUrl: String!
  createdAt: DateTime!
}

type FaunaPrediction {
  id: ID!
  tid: String!
  gbifTaxonKeys: [String!]!
  createdAt: DateTime!
}

type FloraPrediction {
  id: ID!
  tid: String!
  gbifTaxonKeys: [String!]!
  createdAt: DateTime!
}

type Query {
  organizations(country: String, visibility: String): [Organization!]!
  organization(did: String, atUri: String): Organization
  indexedOrganizations: [IndexedOrganization!]!
}

type IndexedOrganization {
  id: String!
  name: String!
}
```

- [ ] Blob URL resolution: For `coverImageUrl`, `logoUrl`, `shapefileUrl`, `dendogramUrl`, resolve CIDs to actual PDS blob URLs:
  ```
  https://<pds-host>/xrpc/com.atproto.sync.getBlob?did=<did>&cid=<cid>
  ```
- [ ] Implement pagination (cursor-based) for list queries
- [ ] Implement the `getIndexedOrganizations` query (maps to the lexicon query type)

#### 1.6 Health & Monitoring

- [ ] `/health` endpoint (HTTP) — returns consumer lag, DB connection status
- [ ] Metrics: records indexed, consumer lag (seconds behind real-time), errors
- [ ] Alerting on consumer disconnection or excessive lag

---

### Phase 2: ATProto Authentication in Green Globe

> **Deliverable:** Replace SIWE (wallet) auth with ATProto OAuth so users can log in with their AT Protocol identity.

#### 2.1 Remove SIWE Auth

- [ ] Remove `@reown/appkit` and related Web3 dependencies
- [ ] Remove Wagmi context and wallet provider components
- [ ] Remove `NEXT_PUBLIC_REOWN_PROJECT_ID` env var
- [ ] Remove SIWE NextAuth provider from `src/app/api/auth/options.ts`
- [ ] Remove `src/app/_contexts/` wagmi context
- [ ] Remove wallet-related components from `src/app/_components/`

#### 2.2 Implement ATProto OAuth

- [ ] Add `@atproto/oauth-client-node` dependency
- [ ] Implement ATProto OAuth flow:
  1. User enters their handle (e.g., `user.bsky.social`)
  2. App resolves handle → DID → PDS → authorization server
  3. Redirect to PDS authorization endpoint
  4. User approves, redirect back with auth code
  5. Exchange code for access/refresh tokens
  6. Store session (DID + tokens) in NextAuth JWT
- [ ] Create new NextAuth provider for ATProto
- [ ] Update session type to include `did` and `handle` instead of `address`
- [ ] Serve OAuth client metadata at `/.well-known/oauth-client-metadata`
- [ ] Handle token refresh automatically

#### 2.3 Update Protected Pages

- [ ] Update `/my-projects` to check `session.did` instead of `session.address`
- [ ] Update `UnauthorizedPage` to show ATProto login prompt instead of wallet connect
- [ ] Add user profile display (handle, avatar from PDS)

---

### Phase 3: Record Creation UI (Write Path)

> **Deliverable:** Green Globe users can create and manage `app.gainforest.*` records directly in their PDS through the app's UI.

#### 3.1 Organization Creation

- [ ] Build organization creation form at `/my-projects/new`:
  - `displayName` (text input, 8-255 chars)
  - `shortDescription` (textarea, 50-2000 chars)
  - `longDescription` (rich text editor, 50-5000 chars)
  - `objectives` (multi-select: Conservation, Research, Education, Community, Other)
  - `country` (dropdown, ISO 3166-1 alpha-2)
  - `startDate` (date picker, optional)
  - `website` (URL input, optional)
  - `visibility` (toggle: Public / Hidden)
  - `coverImage` (image upload, max 5MB)
  - `logo` (image upload, max 5MB)
- [ ] On submit, call the user's PDS via `com.atproto.repo.putRecord`:
  ```typescript
  await agent.com.atproto.repo.putRecord({
    repo: session.did,
    collection: "app.gainforest.organization.info",
    rkey: "self",
    record: { displayName, shortDescription, ... , createdAt: new Date().toISOString() }
  });
  ```
- [ ] Upload blobs (coverImage, logo) via `com.atproto.repo.uploadBlob` before creating the record
- [ ] Show success state and redirect to the project view on the map
- [ ] The AppView will automatically index this record via Jetstream

#### 3.2 Layer Management

- [ ] Build layer management UI within the project overlay (or `/my-projects/[did]/layers`):
  - `name` (text input)
  - `type` (dropdown: geojson_points, raster_tif, tms_tile, etc.)
  - `uri` (URL input — see Phase 4 for upload flow)
  - `description` (textarea, optional)
- [ ] Create layers via `com.atproto.repo.createRecord` with collection `app.gainforest.organization.layer`
- [ ] List layers from the AppView GraphQL API
- [ ] Delete layers via `com.atproto.repo.deleteRecord`

#### 3.3 Observations & Predictions

- [ ] Fauna/Flora observation creation:
  - GBIF taxon key search/autocomplete (query GBIF API)
  - Multi-select taxon keys
  - Submit as `app.gainforest.organization.observations.fauna` or `.flora`
- [ ] Measured trees cluster upload:
  - GeoJSON file picker (max 10MB)
  - Upload as blob, reference in record
- [ ] Dendogram upload:
  - SVG file picker (max 10MB)
  - Upload as blob, reference in record
- [ ] Prediction records (fauna/flora):
  - Same UI as observations but stored under `.predictions.*`

#### 3.4 Organization Editing

- [ ] Pre-fill form with current record data (fetch from PDS or AppView)
- [ ] Update via `com.atproto.repo.putRecord` (same rkey `self`, overwrites)
- [ ] Implement the existing "Edit" tab placeholder in the project overlay
- [ ] Handle blob updates (delete old blob, upload new one)

#### 3.5 Organization Deletion

- [ ] Delete via `com.atproto.repo.deleteRecord`
- [ ] Confirmation dialog
- [ ] AppView automatically removes from index via Jetstream delete event
- [ ] Also clean up related records (layers, observations, predictions)

---

### Phase 4: Large Asset Strategy (Drone Imagery, Large COGs)

> **Deliverable:** A strategy for handling assets that exceed ATProto's blob size limits (100MB max), particularly drone imagery (multi-GB GeoTIFFs/orthomosaics) and large COGs.

#### 4.1 Problem Statement

ATProto blob limits:
- `smallBlob`: max 10MB (used for shapefiles, dendograms)
- `largeBlob`: max 100MB
- `smallImage`: max 5MB (cover images, logos)
- `largeImage`: max 10MB

Drone imagery and large raster datasets can be **multiple gigabytes**. These cannot be stored in the PDS.

#### 4.2 Solution: URI-Referenced External Storage

The `app.gainforest.organization.layer` lexicon already uses a `uri` field (not a blob) for layer data. This is the pattern for large assets:

1. **Upload large files to S3** (or equivalent object storage) via presigned URLs
2. **Store the resulting URI** in the lexicon record's `uri` field
3. **The AppView indexes the URI** and serves it through GraphQL
4. **Green Globe fetches the asset** directly from S3 for rendering (same as current behavior)

#### 4.3 Upload Flow for Large Assets

```
User selects large file (e.g., 2GB drone orthomosaic)
    │
    ▼
Green Globe requests presigned upload URL from upload service
    │
    ▼
Upload service generates S3 presigned PUT URL
(scoped to: s3://bucket/organizations/<did>/<layer-type>/<filename>)
    │
    ▼
Browser uploads directly to S3 via presigned URL
    │
    ▼
On success, Green Globe creates the layer record in PDS:
  {
    name: "2024-03 Drone Survey",
    type: "raster_tif",
    uri: "https://bucket.s3.region.amazonaws.com/organizations/<did>/raster_tif/survey-2024-03.tif",
    createdAt: "..."
  }
    │
    ▼
AppView indexes the record via Jetstream
    │
    ▼
Green Globe renders via TiTiler using the indexed URI
```

#### 4.4 Upload Service

- [ ] Create a lightweight upload service (can be part of the AppView or separate):
  - `POST /api/uploads/presigned-url`
  - Input: `{ did, filename, contentType, layerType }`
  - Auth: Verify the ATProto session token (user can only upload for their own DID)
  - Output: `{ uploadUrl, assetUri }`
- [ ] Add S3 write credentials to the upload service:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_REGION` (us-east-1)
  - `AWS_S3_BUCKET` (gainforest-transparency-dashboard or a new dedicated bucket)
- [ ] S3 path convention: `organizations/<did>/<layer-type>/<tid>/<filename>`
- [ ] Set appropriate content-type and cache headers on uploaded objects

#### 4.5 Asset Lifecycle

- [ ] When a layer record is deleted from the PDS (and the delete event is consumed by the AppView), the AppView can optionally trigger S3 object cleanup
- [ ] Implement a garbage collection job that scans for orphaned S3 objects (URIs not referenced by any indexed record)
- [ ] Consider read-only access controls (S3 bucket policy allows public GET but not PUT/DELETE without presigned URLs)

---

### Phase 5: Green Globe Frontend Integration

> **Deliverable:** Update the Green Globe frontend to consume data from the new AppView GraphQL API instead of the legacy sources.

#### 5.1 Replace Data Sources

- [ ] Replace `fetchProjectData()` (GraphQL to `NEXT_PUBLIC_GAINFOREST_ENDPOINT`) with queries to the new AppView GraphQL endpoint
- [ ] Replace BigQuery project queries (`/api/projects/route.ts`, `action.ts`) with AppView GraphQL queries
- [ ] Update `NEXT_PUBLIC_GAINFOREST_ENDPOINT` to point to the AppView service (or add new env var `NEXT_PUBLIC_APPVIEW_ENDPOINT`)
- [ ] Remove BigQuery client code (`src/app/api/bigquery.ts`) and `@google-cloud/bigquery` dependency
- [ ] Remove `GOOGLE_APPLICATION_CREDENTIALS_JSON` env var

#### 5.2 Update Type Definitions

- [ ] Replace both `Project` types with a single type derived from the GraphQL schema:
  ```typescript
  // Generated from AppView GraphQL schema
  type Organization = {
    id: string;
    did: string;
    handle: string | null;
    atUri: string;
    displayName: string;
    shortDescription: string;
    longDescription: string;
    coverImageUrl: string | null;
    logoUrl: string | null;
    objectives: string[];
    startDate: string | null;
    website: string | null;
    country: string;
    visibility: "Public" | "Hidden";
    createdAt: string;
    layers: Layer[];
    defaultSite: DefaultSite | null;
    // ... observations, predictions
  };
  ```
- [ ] Remove `src/app/api/types.ts` (BigQuery Project type)
- [ ] Update `src/app/(map-routes)/(main)/_components/ProjectOverlay/store/types.ts`

#### 5.3 Update Map Overlay

- [ ] Update the project overlay store to work with `Organization` instead of `Project`
- [ ] Update layer rendering to use `layer.uri` for data fetching
- [ ] Update shapefile loading to fetch from PDS blob URLs (for small shapefiles) or S3 URIs (for large ones)
- [ ] Remove SORALO hardcoded shapefile overrides

#### 5.4 Update My Projects Page

- [ ] Replace mock data with real GraphQL query filtered by `session.did`
- [ ] Show organization cards with cover image, name, country, objectives
- [ ] Link to create/edit flows

---

### Phase 6: Migration & Cleanup

> **Deliverable:** Migrate existing project data from the legacy systems into ATProto records and remove legacy code.

#### 6.1 Data Migration Script

- [ ] Write a one-time migration script that:
  1. Fetches all existing projects from the Gainforest GraphQL API
  2. For each project, creates the corresponding ATProto records in the designated PDS (requires project owners to authorize, or a migration PDS)
  3. Uploads blobs (cover images, shapefiles) to the PDS
  4. Creates layer records with URIs pointing to existing S3 assets
- [ ] Decision: Who "owns" migrated projects? Options:
  - A dedicated Gainforest migration account (can be transferred later)
  - Reach out to project owners to onboard them individually

#### 6.2 Remove Legacy Code

- [ ] Remove `src/app/api/projects/` (BigQuery routes)
- [ ] Remove `src/app/api/bigquery.ts`
- [ ] Remove `@google-cloud/bigquery` from `package.json`
- [ ] Remove Wagmi/Reown dependencies
- [ ] Remove `src/app/_contexts/` (wagmi context)
- [ ] Remove SIWE-related auth code
- [ ] Clean up `next.config.ts` (remove BigQuery-related env references)

#### 6.3 Deprecation Path

- [ ] Run legacy and new systems in parallel during migration window
- [ ] AppView serves as the primary data source; legacy endpoints become fallback
- [ ] After migration verification, cut over fully and remove legacy code
- [ ] Monitor for data consistency issues during parallel operation

---

## Open Questions

| # | Question | Context | Status |
|---|----------|---------|--------|
| 1 | **PDS hosting for organizations** | Should each organization run their own PDS, or use a shared PDS (e.g., Bluesky's)? Self-hosted PDS gives more control but adds operational burden. | Open |
| 2 | **Blob permanence** | If a user deletes their PDS account, blobs (shapefiles, images) are lost. Should the AppView cache/mirror blobs for durability? | Open |
| 3 | **Large blob chunking** | For assets between 100MB-1GB (too large for ATProto blobs but not huge), should we chunk into multiple blobs or always use S3? | Use S3 for anything > 10MB in practice |
| 4 | **Multi-user organizations** | The current lexicon uses `literal:self` key, meaning one org per PDS. How do multi-member organizations work? Delegation? Shared PDS? | Open |
| 5 | **Leaflet integration** | The lexicons repo includes `pub.leaflet.*` schemas. Are these for rich text documents associated with projects? When should this be integrated? | Open |
| 6 | **Existing S3 bucket reuse** | Should large assets continue using `gainforest-transparency-dashboard` bucket, or a new dedicated bucket with stricter access controls? | Reuse existing bucket |
| 7 | **AppView availability** | If the AppView goes down, Green Globe loses its data source. Should Green Globe cache/fallback, or is AppView HA sufficient? | Design for HA |

---

## Dependencies & New Environment Variables

### AppView Service

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JETSTREAM_ENDPOINT` | Jetstream WebSocket URL (e.g., `wss://jetstream2.us-east.bsky.network`) |
| `AWS_ACCESS_KEY_ID` | S3 upload credentials (for presigned URLs) |
| `AWS_SECRET_ACCESS_KEY` | S3 upload credentials |
| `AWS_REGION` | S3 region (us-east-1) |
| `AWS_S3_BUCKET` | Target bucket for large asset uploads |
| `PORT` | HTTP server port for GraphQL + health endpoints |

### Green Globe (Updated)

| Variable | Keep/Remove/New | Purpose |
|----------|----------------|---------|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Keep | Mapbox GL JS |
| `NEXT_PUBLIC_AWS_STORAGE` | Keep | S3 base URL for reading assets |
| `NEXT_PUBLIC_TITILER_ENDPOINT` | Keep | COG tile rendering |
| `NEXT_PUBLIC_APPVIEW_ENDPOINT` | New | AppView GraphQL endpoint URL |
| `ATPROTO_CLIENT_ID` | New | ATProto OAuth client ID |
| `ATPROTO_CLIENT_SECRET` | New | ATProto OAuth client secret (if confidential client) |
| `NEXTAUTH_SECRET` | Keep | JWT signing (reused for ATProto sessions) |
| `NEXT_PUBLIC_GAINFOREST_ENDPOINT` | Remove | Replaced by AppView |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Remove | BigQuery no longer used |
| `NEXT_PUBLIC_REOWN_PROJECT_ID` | Remove | SIWE no longer used |
| `NICFI_API_KEY` | Keep | Planet satellite tiles |
| `NEXT_PUBLIC_BITQUERY_API_KEY` | Keep (if still needed) | Blockchain queries |

### New Dependencies

**AppView Service:**
```bash
# Core
npm init
npm add @skyware/jetstream        # Jetstream client
npm add @atproto/api              # ATProto API client (DID resolution, blob fetching)
npm add graphql graphql-yoga      # GraphQL server
npm add drizzle-orm postgres      # PostgreSQL ORM + driver
npm add zod                       # Validation
npm add ws                        # WebSocket (if not using @skyware)

# Dev
npm add -D typescript drizzle-kit @types/node
```

**Green Globe (changes):**
```bash
# Add
bun add @atproto/api @atproto/oauth-client-node

# Remove
bun remove @reown/appkit @reown/appkit-adapter-wagmi wagmi viem @tanstack/react-query  # (keep react-query if used elsewhere)
bun remove @google-cloud/bigquery
```

---

## Success Criteria

- [ ] Users can log in to Green Globe with an ATProto handle
- [ ] Users can create an organization (writes to their PDS)
- [ ] The AppView indexes the record within seconds via Jetstream
- [ ] The organization appears on the Green Globe map
- [ ] Users can add layers (shapefiles, rasters) with URIs to S3
- [ ] Drone imagery (multi-GB) can be uploaded via presigned URL and referenced in layer records
- [ ] The AppView GraphQL API fully replaces both the legacy Gainforest GraphQL API and BigQuery
- [ ] Existing project data is migrated to ATProto records
- [ ] No BigQuery, no SIWE, no Gainforest GraphQL dependency remains in production

---

## References

- [GainForest/lexicons](https://github.com/GainForest/lexicons) — ATProto lexicon definitions
- [ATProto Lexicon Specification](https://atproto.com/specs/lexicon)
- [Jetstream Documentation](https://github.com/bluesky-social/jetstream)
- [ATProto OAuth Guide](https://atproto.com/specs/oauth)
- [Bluesky Jetstream Blog Post](https://docs.bsky.app/blog/jetstream)
- [ATProto AppView Architecture](https://atproto.com/guides/applications)
- [@skyware/jetstream](https://skyware.js.org/guides/jetstream/introduction/getting-started/) — TypeScript Jetstream client
