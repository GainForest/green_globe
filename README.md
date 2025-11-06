This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
bun run dev
```

Open [http://localhost:8910](http://localhost:8910) with your browser to see the result.

## Development

- Install dependencies: `bun install`
- Run dev server: `bun run dev` (http://localhost:8910)
- Lint: `bun run lint`
- Build: `bun run build`
- Unit tests: `bun run test` (Vitest)

### Environment

- Set `NEXT_PUBLIC_APP_ORIGIN` in production to your deployed origin.
- In development, it defaults to `http://127.0.0.1:8910`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Testing

- `bun run test` executes our Vitest suite. At the moment this covers `src/lib/geojson.ts`, which is the centroid/area helper used by `/api/shapefiles`. The tests feed in single polygons, collections, multi-polygons, and non-polygon geometries to ensure we detect regressions in area or centroid math if the implementation changes later.
