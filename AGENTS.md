# AGENTS.md

## Project Overview

Green Globe (package name: `impact-trace`) is a Next.js 15 App Router application with React 19, TypeScript (strict), and Bun as the package manager. It renders an interactive Mapbox globe for visualizing conservation projects, with Web3 authentication (SIWE via Reown AppKit + NextAuth).

## Build / Lint / Test Commands

```bash
# Install dependencies
bun install

# Dev server (runs on port 8910)
bun dev

# Production build
bun run build

# Start production server
bun start

# Lint (ESLint with next/core-web-vitals + next/typescript)
bun run lint
```

**Pre-commit hook:** Husky runs `bun run lint` before every commit.

**Testing:** No test framework is currently configured. There are no test files, test scripts, or test dependencies. The `.gitignore` includes `/coverage` for future use.

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── (map-routes)/           # Route group: map experiences
│   │   ├── (main)/            # Globe view with project overlays
│   │   │   ├── _components/   # Map, Overlay, Search, Layers
│   │   │   ├── _features/     # Navigation (store, url sync, utils)
│   │   │   └── [projectId]/   # Dynamic project pages
│   │   └── (shapefile-related)/ # Shapefile viewer
│   ├── (non-map-routes)/       # Route group: non-map pages
│   │   └── my-projects/       # Auth-gated user projects
│   ├── _components/            # Shared app components (Providers, Wallet)
│   ├── _contexts/              # Wagmi/Web3 context
│   └── api/                    # API routes (auth, projects, users, tiles)
├── components/                 # Shared reusable components
│   └── ui/                     # shadcn/ui components (do not edit directly)
├── config/                     # App config (map, metadata, siwe, wagmi)
├── constants.ts                # App-wide constants
├── hooks/                      # Shared hooks
└── lib/                        # Utilities (utils.ts, types.ts)
```

## Code Style Guidelines

### TypeScript

- Strict mode is enabled. Do not use `any` without justification.
- Use `import type { ... }` for type-only imports.
- Path alias: use `@/` for imports from `src/` (e.g., `@/lib/utils`, `@/components/ui/button`).
- Use relative imports only for co-located modules (e.g., `./store`, `../_hooks/useBlurAnimate`).

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Components (files) | PascalCase | `ProjectOverlay.tsx` |
| Hooks (files) | camelCase with `use` prefix | `useMapbox.ts`, `use-mobile.tsx` |
| Stores | `store.ts` inside feature dirs | `_features/navigation/store.ts` |
| Utils/config | camelCase | `utils.ts`, `map.ts` |
| Route groups | Parenthesized | `(map-routes)`, `(main)` |
| Private/co-located dirs | Underscore prefix | `_components/`, `_features/`, `_hooks/` |
| Types/Interfaces | PascalCase, named exports | `type AsyncData<T>`, `interface Project` |

### Component Patterns

- **Server Components** are the default (no directive needed).
- **Client Components** must have `"use client"` as the first line.
- Use functional components (arrow functions or function declarations).
- Default-export page/layout components. Named-export utility components.
- Props: type inline for simple components, separate `interface` for complex ones.

### State Management

- **Zustand** with separated `State` and `Actions` types:
  ```typescript
  type State = { count: number }
  type Actions = { increment: () => void }
  const useStore = create<State & Actions>((set) => ({
    count: 0,
    increment: () => set((s) => ({ count: s.count + 1 })),
  }))
  ```
- Use **Immer** (`produce`) for complex nested state updates.
- Async data follows discriminated union pattern:
  ```typescript
  type AsyncData<T> =
    | { _status: "loading"; data: null }
    | { _status: "success"; data: T }
    | { _status: "error"; data: null }
  ```

### Styling

- **Tailwind CSS** utility classes throughout. No CSS modules.
- Use `cn()` from `@/lib/utils` for conditional/merged class names:
  ```typescript
  import { cn } from "@/lib/utils"
  <div className={cn("base-class", condition && "conditional-class")} />
  ```
- shadcn/ui components use `class-variance-authority` (cva) for variants.
- Dark mode is permanently enabled (hardcoded `dark` class on body).
- Theme tokens defined as CSS variables in `globals.css`.

### API Routes & Data Fetching

- API routes: export named HTTP method handlers in `route.ts` files.
- Response pattern: `NextResponse.json({ success: true, data })` or `NextResponse.json({ success: false, error }, { status })`.
- Server actions in `action.ts` for direct BigQuery queries from server components.
- Client data fetching: `@tanstack/react-query` with custom hooks.
- Pagination: `PaginatedApiResponse<T>` type from `@/lib/types`.

### Error Handling

- Wrap async operations in try/catch blocks.
- Log errors with `console.error`.
- API routes: return structured error responses with appropriate HTTP status codes.
- Cast errors to typed interfaces when needed: `error as BigQueryError`.
- Provide graceful fallbacks (return empty arrays, null checks, optional chaining).
- Use bare `catch` (no error variable) for non-critical paths where the error is not used.

### Formatting

- No Prettier is configured; formatting relies on ESLint rules only.
- ESLint config extends `next/core-web-vitals` and `next/typescript`.
- Indentation: 2 spaces (inferred from codebase).
- Semicolons: used consistently.
- Quotes: double quotes for strings (JSX convention).
- Trailing commas: used in multi-line structures.

## Environment & Deployment

- **Runtime:** Bun
- **Deployment:** Vercel
- **Dev port:** 8910
- **Key env vars needed:** `NEXT_PUBLIC_MAPBOX_TOKEN`, `NEXT_PUBLIC_REOWN_PROJECT_ID`, `NEXTAUTH_SECRET`, `GOOGLE_APPLICATION_CREDENTIALS` (BigQuery)
- **Map:** Mapbox GL JS with globe projection, satellite-streets style

## Important Notes

- The `src/components/ui/` directory contains shadcn/ui generated components. Avoid editing these directly; instead customize via the cva variants or wrapper components.
- Navigation state is synced bidirectionally with URL query parameters via the navigation store.
- Auth uses SIWE (Sign-In With Ethereum) through Reown AppKit; sessions are managed by NextAuth with JWT strategy.
- The app is licensed under LGPL-3.0.

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
