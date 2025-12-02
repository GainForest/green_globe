This is the repository for the green globe (available on https://gainforest.app/). 

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

### Environment

- Set `NEXT_PUBLIC_APP_ORIGIN` in production to your deployed origin.
- In development, it defaults to `http://127.0.0.1:8910`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
