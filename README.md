# Green Globe

An interactive 3D globe for visualizing conservation projects worldwide. Built with Next.js 15, Mapbox GL JS, and React 19. Live at [gainforest.app](https://gainforest.app/).

Users can explore conservation project sites on a satellite-rendered globe, view biodiversity data, inspect measured tree inventories, browse community members, and interact with multi-layer spatial datasets (GeoJSON, raster COGs, TMS tiles).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| UI | [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) |
| Map | [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) (globe projection, satellite-streets-v12) |
| State | [Zustand](https://zustand-demo.pmnd.rs/) + [Immer](https://immerjs.github.io/immer/) |
| Data Fetching | [TanStack React Query](https://tanstack.com/query/) (client), Server Actions (server) |
| Auth | SIWE ([Reown AppKit](https://reown.com/) + [NextAuth](https://next-auth.js.org/)) |
| Database | [Google BigQuery](https://cloud.google.com/bigquery) |
| Runtime | [Bun](https://bun.sh/) |
| Deployment | [Vercel](https://vercel.com/) |
| License | LGPL-3.0 |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.0+)
- A [Mapbox](https://www.mapbox.com/) access token
- Node.js 18+ (for compatibility with some dependencies)

### Install

```bash
git clone https://github.com/GainForest/green_globe.git
cd green_globe
bun install
```

### Environment Variables

Create a `.env.local` file in the project root:

```bash
# Required
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx              # Mapbox GL JS access token
NEXT_PUBLIC_GAINFOREST_ENDPOINT=https://...   # Gainforest GraphQL API base URL
NEXT_PUBLIC_AWS_STORAGE=https://gainforest-transparency-dashboard.s3.us-east-1.amazonaws.com
NEXT_PUBLIC_TITILER_ENDPOINT=https://...      # TiTiler COG tile server
NEXT_PUBLIC_REOWN_PROJECT_ID=xxx             # Reown AppKit project ID (Web3 wallet)
GOOGLE_APPLICATION_CREDENTIALS_JSON='{...}'  # BigQuery service account (JSON string)
NEXTAUTH_SECRET=xxx                          # NextAuth JWT signing secret

# Optional
NICFI_API_KEY=xxx                            # Planet NICFI satellite tile proxy
NEXT_PUBLIC_BITQUERY_API_KEY=xxx             # Blockchain transaction queries
```

### Development

```bash
bun dev
```

Open [http://localhost:8910](http://localhost:8910) in your browser.

### Build

```bash
bun run build   # Production build
bun start       # Start production server
```

### Lint

```bash
bun run lint
```

A pre-commit hook (Husky) runs `bun run lint` automatically before every commit.

## Project Structure

```
src/
├── app/                              # Next.js App Router
│   ├── (map-routes)/                 # Route group: map experiences
│   │   ├── (main)/                   # Globe view with project overlays
│   │   │   ├── _components/
│   │   │   │   ├── Map/             # Mapbox instance, sources, layers
│   │   │   │   ├── ProjectOverlay/  # Project detail panel + Zustand store
│   │   │   │   ├── Search/          # Project search UI
│   │   │   │   └── Layers/          # Map layer controls
│   │   │   └── _features/
│   │   │       └── navigation/      # URL ↔ state sync (store, utils)
│   │   └── (shapefile-related)/      # Shapefile viewer
│   ├── (non-map-routes)/             # Route group: non-map pages
│   │   └── my-projects/             # Auth-gated user projects
│   ├── _components/                  # Shared app components (Providers, Wallet)
│   ├── _contexts/                    # Wagmi/Web3 context
│   └── api/                          # API routes
│       ├── auth/                     # NextAuth + SIWE config
│       ├── projects/                 # GET /api/projects (BigQuery)
│       ├── bigquery.ts               # BigQuery client
│       └── types.ts                  # API types
├── components/
│   └── ui/                           # shadcn/ui components (do not edit)
├── config/                           # Map, metadata, SIWE, Wagmi config
├── constants.ts                      # App-wide constants
├── hooks/                            # Shared hooks
└── lib/                              # Utilities (utils.ts, types.ts)

scripts/                              # Developer helper scripts
docs/                                 # Project documentation
```

## Data Sources

The app consumes project data from three external services (all read-only):

| Source | Purpose | Env Var |
|--------|---------|---------|
| **Gainforest GraphQL API** | Full project data (assets, community members, shapefiles) | `NEXT_PUBLIC_GAINFOREST_ENDPOINT` |
| **Google BigQuery** | Paginated project metadata list | `GOOGLE_APPLICATION_CREDENTIALS_JSON` |
| **AWS S3** | Static assets (GeoJSON, images, COGs, predictions) | `NEXT_PUBLIC_AWS_STORAGE` |
| **TiTiler** | Cloud Optimized GeoTIFF tile rendering | `NEXT_PUBLIC_TITILER_ENDPOINT` |

See [docs/MANUAL.md](docs/MANUAL.md) for detailed architecture documentation.

## Adding a New Project

Projects are currently added manually by uploading data to S3 and registering in the GraphQL API. See [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) for the full step-by-step process.

### Quick Start (with helper scripts)

```bash
# 1. Check how your project name maps to S3 paths
bun run scripts/kebab-name.ts --show-paths "My Conservation Project"

# 2. Validate your GeoJSON files
bun run scripts/validate-geojson.ts --type site ./boundary.geojson
bun run scripts/validate-geojson.ts --type trees ./trees.geojson

# 3. Convert CSV data to expected formats
bun run scripts/csv-to-trees-geojson.ts --input ./measurements.csv --project "My Project"
bun run scripts/csv-to-predictions.ts --validate ./species.csv

# 4. Generate layer configuration
bun run scripts/create-layer-config.ts --project "My Project" --dir ./layers/

# 5. Upload everything to S3
bash scripts/upload-project.sh --name "My Project" --dir ./my-project-data/

# 6. Add to the master map
bun run scripts/create-project-point.ts \
  --name "My Project" --id "abc123..." \
  --lat -1.3 --lon 36.8 --country "Kenya"
```

## Helper Scripts

| Script | Purpose |
|--------|---------|
| `scripts/kebab-name.ts` | Show how a project name maps to S3 paths |
| `scripts/create-project-point.ts` | Add a project to the master GeoJSON on S3 |
| `scripts/create-layer-config.ts` | Generate `layerData.json` from a directory of files |
| `scripts/validate-geojson.ts` | Validate GeoJSON against expected schemas |
| `scripts/csv-to-trees-geojson.ts` | Convert CSV to measured trees GeoJSON format |
| `scripts/csv-to-predictions.ts` | Validate/normalize species predictions CSV |
| `scripts/upload-project.sh` | Upload all project files to correct S3 paths |

All TypeScript scripts run via `bun run scripts/<name>.ts --help`.

## Development Conventions

### File Naming

| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase | `ProjectOverlay.tsx` |
| Hooks | camelCase with `use` | `useMapbox.ts` |
| Stores | `store.ts` in feature dirs | `_features/navigation/store.ts` |
| Route groups | Parenthesized | `(map-routes)` |
| Private dirs | Underscore prefix | `_components/`, `_features/` |

### Imports

- Use `@/` alias for imports from `src/` (e.g., `@/lib/utils`)
- Use relative imports only for co-located modules (e.g., `./store`)
- Use `import type { ... }` for type-only imports

### Components

- Server Components by default (no directive needed)
- Client Components: `"use client"` as first line
- Default-export page/layout components; named-export utility components

### Styling

- Tailwind CSS utility classes only (no CSS modules)
- Use `cn()` from `@/lib/utils` for conditional classes
- Dark mode is permanently enabled (`dark` class on body)
- Do not edit `src/components/ui/` directly (shadcn/ui generated)

### State Management

```typescript
// Zustand pattern with separated State and Actions types
type State = { count: number };
type Actions = { increment: () => void };

const useStore = create<State & Actions>((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}));
```

### API Routes

```typescript
// Response pattern
NextResponse.json({ success: true, data });
NextResponse.json({ success: false, error: message }, { status: 500 });
```

## Documentation

| Document | Description |
|----------|-------------|
| [docs/MANUAL.md](docs/MANUAL.md) | Current architecture, data sources, type definitions, environment vars |
| [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) | Step-by-step guide for adding projects (S3 file formats, upload process) |
| [docs/FUTURE.md](docs/FUTURE.md) | Roadmap: ATProto migration, AppView service, Jetstream indexer |
| [AGENTS.md](AGENTS.md) | AI agent instructions (code style, project structure, conventions) |

## Roadmap

Green Globe is migrating to an [AT Protocol](https://atproto.com/) architecture:

- **Data ownership**: Projects become ATProto records in user-owned Personal Data Servers
- **Decentralized identity**: ATProto OAuth replaces SIWE wallet auth
- **AppView service**: A Jetstream consumer indexes `app.gainforest.*` records into PostgreSQL and serves a GraphQL API
- **Lexicons**: Data schemas defined at [GainForest/lexicons](https://github.com/GainForest/lexicons)

See [docs/FUTURE.md](docs/FUTURE.md) for the full implementation plan.

## License

[LGPL-3.0](LICENSE)
