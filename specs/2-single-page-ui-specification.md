# Epic 2 — Single-Page UI (Input + Results) — Specification

## Overview

A single HTML page served by the existing Hono backend that lets users type a word or phrase, submit it to `POST /variants`, and see 3–5 silly mispronunciation cards. The frontend is plain HTML, CSS, and TypeScript with no frontend framework. `app.ts` is bundled once at server startup via `Bun.build` and served as a JS asset; `index.html` and `style.css` are served as static files via Hono's `serveStatic` middleware. The whole app stays in one Docker Compose service.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Markup | Plain HTML5 | Single `index.html` |
| Styles | Plain CSS | Single `style.css`, no preprocessor |
| Scripting | TypeScript (strict) | Compiled once at startup via `Bun.build`, no framework |
| Bundler | `Bun.build` | Called in `src/index.ts` on startup; output served from memory or a temp file |
| HTTP / static serving | Hono `serveStatic` | Same Hono app as the API; serves `frontend/` directory |
| Type-checking | `tsc --noEmit` | CI/pre-commit check only; not part of the serve path |

---

## Project Structure

```
/
├── src/
│   ├── index.ts          ← Hono app entry; registers API routes + static serving + Bun.build call
│   ├── routes/
│   │   └── variants.ts
│   ├── lib/
│   │   └── generator.ts
│   └── validation.ts
├── frontend/
│   ├── index.html        ← page shell
│   ├── style.css         ← all styles
│   └── app.ts            ← all client-side logic
├── Dockerfile
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

---

## Frontend Build Integration

At startup, `src/index.ts` calls `Bun.build` to compile `frontend/app.ts` into a single JS bundle, then registers it on a fixed route:

```
GET /app.js   ← serves the Bun.build output (in-memory or written to a temp file)
GET /         ← serveStatic serves frontend/index.html
GET /style.css← serveStatic serves frontend/style.css
```

`index.html` references `<script type="module" src="/app.js"></script>` and `<link rel="stylesheet" href="/style.css">`.

If `Bun.build` fails at startup the process exits with a non-zero code so Docker Compose restarts it rather than serving a broken page.

---

## Page Layout

Centered single-column layout, max-width `560px`, horizontally centered, with comfortable vertical padding. Stacks naturally into a single column on narrow viewports — no breakpoint logic required.

```
┌──────────────────────────────────────────┐
│                                          │
│            SAY SILLY                     │  ← h1, centered
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  Type a word or phrase…      [→]  │  │  ← input + button, full-width row
│  └────────────────────────────────────┘  │
│                                          │
│  ← results / loading / error area →      │
│                                          │
│  ┌──────────────┐  ┌──────────────┐      │
│  │ variant card │  │ variant card │  …   │  ← cards, wrapping flex row
│  └──────────────┘  └──────────────┘      │
│                                          │
└──────────────────────────────────────────┘
```

The results area is initially empty and is replaced in-place by whichever of the three states is active: loading text, error message, or the card grid.

---

## UI States

| State | Trigger | What the results area shows |
|---|---|---|
| **Empty** | Page load, or after clearing input | Nothing (hidden) |
| **Loading** | Submit fired, response pending | Animated ellipsis text: `"mangling your word…"` |
| **Results** | Successful API response | 1–5 variant cards in a wrapping flex row |
| **Error** | API returns 4xx/5xx or network failure | Soft warning message (see below) |

### Submit button behaviour

| Condition | Button state |
|---|---|
| Input is empty (after trim) | Disabled |
| Input is non-empty, not loading | Enabled |
| Request in flight | Disabled |

---

## Variant Card

Each card displays three pieces of data from the API response:

```
┌─────────────────────────────┐
│  FOO-netic                  │  ← .card-text  (large, prominent)
│                             │
│  [phonetic swap]            │  ← .card-badge (small pill/badge)
│                             │
│  swapped 'ph' → 'f'         │  ← .card-hint  (small, muted colour)
└─────────────────────────────┘
```

| Element | CSS class | Content source |
|---|---|---|
| Silly text | `.card-text` | `variant.text` |
| Style badge | `.card-badge` | `variant.style` — rendered as human-readable label (see table below) |
| Hint | `.card-hint` | `variant.hint` |

### Style label mapping

| API value | Displayed label |
|---|---|
| `phonetic_swap` | phonetic swap |
| `spelling_literal` | spelling literal |
| `creative` | creative |

---

## Loading State

While a request is in flight:

- The results area shows the text `"mangling your word…"` with a CSS `@keyframes` animation that cycles the trailing ellipsis (`. → .. → …`).
- The submit button is `disabled`.
- No card elements are present in the DOM.

---

## Error State

If the API returns a non-2xx response or the `fetch` rejects:

- The results area shows a single `<p class="error-message">` element.
- Message text:
  - Input validation errors (400 `input_invalid` or `input_too_long`): use the `message` field from the API error body.
  - Server errors (500) or network failure: `"Something went wrong — please try again."`
- The error is styled as a soft warning (e.g. amber/red-tinted background, no modal, no toast).
- Submitting again clears the error and transitions to the loading state.

---

## API Integration

The frontend calls the same-origin API. No base URL configuration is needed.

| Detail | Value |
|---|---|
| Endpoint | `POST /variants` |
| Request headers | `Content-Type: application/json` |
| Request body | `{ "input": "<trimmed value>" }` |
| Success response | `200 { "variants": Variant[] }` |
| Error response | `4xx/5xx { "error": string, "message": string }` |

The input value is trimmed client-side before sending. If the trimmed value is empty, the submit handler returns early without making a network request (the button is already disabled, so this is a safety check only).

### TypeScript types (shared understanding, defined in `frontend/app.ts`)

```ts
type Style = "phonetic_swap" | "spelling_literal" | "creative";

interface Variant {
  text:  string;
  style: Style;
  hint:  string;
}

interface VariantsResponse {
  variants: Variant[];
}

interface ErrorResponse {
  error:   string;
  message: string;
}
```

---

## DOM Structure (`index.html` skeleton)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Say Silly</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <main class="container">
    <h1>Say Silly</h1>

    <form id="input-form">
      <input id="word-input" type="text" placeholder="Type a word or phrase…" maxlength="100" autocomplete="off">
      <button id="submit-btn" type="submit" disabled>→</button>
    </form>

    <section id="results" hidden></section>
  </main>

  <script type="module" src="/app.js"></script>
</body>
</html>
```

The `#results` section is toggled between three child states (loading text, error paragraph, card grid) by `app.ts` — the section itself is never removed from the DOM, only its `hidden` attribute and content are updated.

---

## CSS Notes

No utility framework; one flat `style.css`. Key rules to implement:

| Selector | Purpose |
|---|---|
| `.container` | `max-width: 560px; margin: 0 auto; padding: 2rem 1rem` |
| `#input-form` | `display: flex; gap: 0.5rem` |
| `#word-input` | `flex: 1` |
| `#submit-btn:disabled` | Visually muted (opacity / cursor) |
| `.card-grid` | `display: flex; flex-wrap: wrap; gap: 1rem` |
| `.card` | `flex: 1 1 160px; padding: 1rem; border: 1px solid …; border-radius: …` |
| `.card-text` | Large font size (e.g. `1.25rem`), bold |
| `.card-badge` | Small pill: `font-size: 0.75rem; padding: 0.1em 0.5em; border-radius: 999px` |
| `.card-hint` | `font-size: 0.8rem; color: <muted colour>` |
| `.loading-text` | CSS `@keyframes` ellipsis animation |
| `.error-message` | Soft warning background tint |

Exact colours and values are intentionally left to the implementer — Epic 4 (Polish & Delight) owns the final visual design.

---

## `app.ts` Responsibilities

1. On `DOMContentLoaded`: attach `input` listener to `#word-input` to enable/disable `#submit-btn`.
2. On form `submit`:
   a. Prevent default.
   b. Trim input; return early if empty.
   c. Set loading state (disable button, show loading text in `#results`).
   d. `fetch('POST /variants', { body: JSON.stringify({ input }) })`.
   e. On success: render card grid into `#results`.
   f. On error: render error message into `#results`.
   g. Re-enable submit button.

No state management library; plain DOM manipulation only.

---

## Hono Route Registration (`src/index.ts` additions)

```ts
// 1. Bundle frontend/app.ts at startup
const build = await Bun.build({
  entrypoints: ["frontend/app.ts"],
  target: "browser",
});
if (!build.success) {
  console.error("Frontend build failed", build.logs);
  process.exit(1);
}
const [appBundle] = build.outputs;
const appJs = await appBundle.text();

// 2. Serve the bundle
app.get("/app.js", (c) =>
  c.body(appJs, 200, { "Content-Type": "application/javascript" })
);

// 3. Serve static files (index.html, style.css)
app.use("/*", serveStatic({ root: "./frontend" }));
```

API routes (`/variants`, `/health`) must be registered **before** the `serveStatic` catch-all.

---

## Out of Scope

The following are explicitly deferred to later epics:

- Audio playback via Web Speech API (Epic 3)
- "Play" and "Play all" buttons on cards (Epic 3)
- AI/LLM-powered generation (Epic 4)
- Keyboard shortcut: Space to replay last result (Epic 5)
- Playful micro-animations and visual polish (Epic 5)
- Fun loading copy variations beyond a single string (Epic 5)
- Cloud deployment (Epic 5)
- Edge-case UX for non-English or very long input beyond the basic error message (Epic 5)
- Rate limiting or authentication on any route
