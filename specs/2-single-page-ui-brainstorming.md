# Epic 2 — Single-Page UI (Input + Results) — Brainstorming

> The one-page experience users interact with.
> Epic 2 covers:
> - Text input + submit button
> - Loading state while backend responds
> - Results: 3–5 variant cards, each showing silly text + style label
> - Responsive layout, works on mobile

---

## Round 1 — Tech / Infrastructure

### Q1.1 — Frontend framework

Which framework (or no framework) for the single-page UI?

- [x] Vanilla HTML + CSS + TypeScript (no framework) ← recommended: zero dependencies, trivially hostable as static files, fits the "one-page" scope
- [ ] React (Vite)
- [ ] Svelte (SvelteKit or Vite)
- [ ] Vue 3 (Vite)

> **Your answer / freetext:**
>

---

### Q1.2 — CSS approach

How should the UI be styled?

- [x] Plain CSS (one stylesheet, no build step) ← recommended: keeps complexity low for a small app
- [ ] Tailwind CSS
- [ ] CSS Modules (only useful with a component framework)
- [ ] A UI component library (e.g. shadcn, DaisyUI)

> **Your answer / freetext:**
>

---

### Q1.3 — Build / hosting strategy

How should the frontend be built and served?

- [x] Static HTML file(s) served by the Hono backend (same origin, no separate server) ← recommended: simplest local dev, single Docker Compose service
- [ ] Separate dev server (Vite) with the API proxied — keep frontend and backend as separate services
- [ ] Deploy frontend to Vercel/Netlify separately (defer to Epic 4)

> **Your answer / freetext:**
>

---

## Round 2 — UI / UX

### Q2.1 — Page layout

Which overall page structure?

```
Option A — Centered column (narrow, content-focused)
┌─────────────────────────────────┐
│                                 │
│         SAY SILLY               │
│                                 │
│  ┌──────────────────────────┐   │
│  │  Type a word…        [→] │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────┐  ┌──────────┐     │
│  │ variant  │  │ variant  │ …   │
│  └──────────┘  └──────────┘     │
│                                 │
└─────────────────────────────────┘

Option B — Full-width, cards in a responsive grid
┌─────────────────────────────────┐
│ SAY SILLY        [input]  [Go]  │
├─────────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌──────┐ │
│ │variant │ │variant │ │ …    │ │
│ └────────┘ └────────┘ └──────┘ │
└─────────────────────────────────┘
```

- [x] Option A — Centered column ← recommended: feels focused and playful; works naturally on mobile without extra breakpoints
- [ ] Option B — Full-width header + grid

> **Your answer / freetext:**
>

---

### Q2.2 — Variant card content

What should each result card display? The backend returns `{ text, style, hint }`.

- [x] Silly text (large) + style label (small badge) + hint (small muted text) ← recommended: shows all available data without clutter
- [ ] Silly text only (keep it minimal)
- [ ] Silly text + hint only (skip the style label)

> **Your answer / freetext:**
>

---

### Q2.3 — Loading state

What should happen while the API call is in flight?

- [x] Disable the submit button + show a short animated text in the results area (e.g. "mangling your word…") ← recommended: fun and on-brand; simple to implement
- [ ] Skeleton cards (grey placeholder cards where results will appear)
- [ ] Spinner icon only

> **Your answer / freetext:**
>

---

### Q2.4 — Error display

If the API returns an error (400 or 500), how should the UI surface it?

- [x] Inline message below the input field, styled as a soft warning (no modal, no toast) ← recommended: unobtrusive; replaces the results area
- [ ] Alert/modal dialog
- [ ] Toast notification (top-right corner)

> **Your answer / freetext:**
>

---

## Round 3 — API integration & project structure

### Q3.1 — TypeScript build step for the frontend

The backend is compiled TypeScript. How should the frontend TS be handled?

- [x] `tsc --noEmit` for type-checking only; ship the `.ts` file directly via a `<script type="module">` using Bun's built-in bundler at server startup ← recommended: no separate build tool, stays within the Bun ecosystem
- [ ] Compile `.ts` → `.js` with `tsc` into a `public/` dir at build time (Dockerfile step)
- [ ] Add Vite as a bundler (brings HMR + tree-shaking, but adds complexity)

> **Your answer / freetext:**
>

---

### Q3.2 — Project structure for frontend files

Where should the frontend source files live?

```
Option A — frontend/ directory at project root
/
├── src/           ← backend TS
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.ts
└── ...

Option B — public/ directory (conventional static-files name)
/
├── src/           ← backend TS
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.ts
└── ...
```

- [x] `frontend/` ← recommended: explicit separation from a conventional `public/` output dir
- [ ] `public/`

> **Your answer / freetext:**
>

---

### Q3.3 — Hono static file serving

How should Hono serve the frontend files?

- [x] Use Hono's `serveStatic` middleware pointing at `frontend/` for HTML/CSS; bundle `app.ts` via `Bun.build` on startup and serve the result inline ← recommended: no runtime TS transpilation per-request, deterministic output
- [ ] Serve raw `.ts` files and let the browser handle them (not supported natively)
- [ ] Only serve `index.html`; link to a CDN-hosted TS/JS (overkill for local dev)

> **Your answer / freetext:**
>

---

### Q3.4 — Out of scope for this epic

Which of the following should be explicitly deferred to later epics?

- [x] All of the below ← recommended
- [ ] Pick individually

Items to defer:
- Audio playback (Epic 3)
- Keyboard shortcut: Space to replay (Epic 4)
- Playful animations / micro-interactions (Epic 4)
- Cloud deployment (Epic 4)
- Non-English / very-long input edge-case UX beyond basic error message (Epic 4)

> **Your answer / freetext:**
>
