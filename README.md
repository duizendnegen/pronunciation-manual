# Pronunciation Manual

A one-page web app where you type a word or phrase and hear it mispronounced in funny ways.
Powered by an algorithmic generator and the browser's native Web Speech API.

Live: **[pronounce.plusx.black](https://pronounce.plusx.black)**

---

## Development

**Requirements:** [Bun](https://bun.sh)

```bash
bun install          # install dependencies
bun run dev          # start Vite dev server → http://localhost:5173
bun run build        # production build → dist/
bun run preview      # serve the production build locally
```

## E2E tests

Tests run against a live server. Start one first, then run Playwright:

```bash
# Against Vite dev server (default)
bun run dev &
bun run test:e2e

# Against a production build
bun run build
bunx vite preview --port 5173 &
bun run test:e2e
```

## Deployment

The app is a static bundle (HTML + CSS + JS) deployed to AWS S3 + CloudFront via GitHub Actions on every push to `main`.

See `specs/4-public-launch-specification.md` for the full AWS setup guide.

Required GitHub Actions secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`.

## Project structure

```
frontend/           Source files (HTML, CSS, TypeScript)
  app.ts            Main app logic
  lib/
    generator.ts    Algorithmic variant generation
    types.ts        Shared TypeScript types
e2e/                Playwright E2E tests
specs/              Brainstorming & implementation specs
dist/               Build output (git-ignored)
```
