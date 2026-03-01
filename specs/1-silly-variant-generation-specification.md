# Epic 1 — Silly Variant Generation (Backend) — Specification

## Overview

A thin HTTP API server that accepts a word or phrase and returns 3–5 silly mispronunciation variants generated **algorithmically** — no external AI or API key required. The server is built with Bun + Hono and runs locally via Docker Compose. It forms the complete backend contract that Epic 2 (UI) will consume. AI-powered generation is deferred to Epic 4, which will swap in Claude while keeping this API contract unchanged.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Runtime | Bun | Fast startup, TypeScript-native, no build step |
| HTTP framework | Hono | Minimal, TypeScript-first, runs on Bun |
| Variant generation | Algorithmic (rule-based) | Pure TypeScript, no external dependencies |
| Containerisation | Docker + Docker Compose | Local dev & self-hosted deployment |
| Language | TypeScript (strict) | |

---

## Data Model

### Variant object

| Field | Type | Constraints | Description |
|---|---|---|---|
| `text` | `string` | non-empty | The silly mispronunciation (e.g. `"FOO-netic"`) |
| `style` | `"phonetic_swap" \| "spelling_literal" \| "creative"` | enum | Which style produced this variant |
| `hint` | `string` | non-empty | Short explanation of the transformation (e.g. `"swapped 'ph' → 'f'"`) |

### Response envelope

```ts
{
  variants: Variant[]   // 3–5 items
}
```

### Error object

```ts
{
  error:   string   // machine-readable code
  message: string   // human-readable description
}
```

---

## Business Logic & Rules

### Variant count

- The server picks a random integer `n` in `[3, 5]` on each request.
- The first 3 variants are always one of each style, in order: `phonetic_swap`, `spelling_literal`, `creative`.
- Any extra variants (4th, 5th) are always style `creative`.

### Style definitions (algorithmic)

| Style | Algorithm |
|---|---|
| `phonetic_swap` | Apply a fixed table of sound-substitution rules (e.g. `ph→f`, `ck→k`, `qu→kw`, vowel cluster shifts) to produce a plausible-but-wrong pronunciation. Include the applied rule in the hint. |
| `spelling_literal` | Reverse common silent-letter and digraph conventions: re-insert the silent `p` in `pn`, pronounce the `k` in `kn`, split `ea`/`oo`/`gh` into individual letter sounds, etc. |
| `creative` | Apply one or more of: random syllable duplication, stress-marker insertion (`-`), suffix addition (`-y`, `-oo`, `-ington`), vowel doubling. Combine two rules for 4th/5th variants. |

All three algorithms are deterministic given the same input seed; but because the server picks `n` randomly each request, the count will vary.

### Input validation (executed before generation)

| Rule | Behaviour on failure |
|---|---|
| Body must be valid JSON with an `input` field | 400 `input_invalid` |
| `input` after trimming must be non-empty | 400 `input_invalid` |
| `input` after trimming must be ≤ 100 characters | 400 `input_too_long` |
| `input` is stored trimmed; original is discarded | — |

### CORS

- All origins allowed (`*`) via Hono's CORS middleware.
- Applied globally to every route.

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/variants` | none | Generate silly variants for an input word/phrase |
| `GET` | `/health` | none | Liveness check — returns `{ status: "ok" }` |

### POST /variants

**Request**
```json
{ "input": "pneumonia" }
```

**Response 200**
```json
{
  "variants": [
    { "text": "new-MOH-nee-ah", "style": "phonetic_swap",    "hint": "silent 'p' cluster shifted" },
    { "text": "Puh-new-moh-nee-ah", "style": "spelling_literal", "hint": "every letter pronounced" },
    { "text": "Nyoo-MOE-nya-ington",  "style": "creative",    "hint": "suffix '-ington' added for flair" }
  ]
}
```

**Response 400**
```json
{ "error": "input_invalid", "message": "input must not be empty" }
```
```json
{ "error": "input_too_long", "message": "input must be 100 characters or fewer" }
```

**Response 500**
```json
{ "error": "generation_failed", "message": "could not generate variants, please try again" }
```

---

## Project Structure

```
/
├── src/
│   ├── index.ts          # Hono app entry point, route registration
│   ├── routes/
│   │   └── variants.ts   # POST /variants handler
│   ├── lib/
│   │   └── generator.ts  # Algorithmic variant generator (phonetic_swap, spelling_literal, creative)
│   └── validation.ts     # Input validation logic
├── Dockerfile
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

> **Note:** `src/lib/generator.ts` will be replaced by `src/lib/claude.ts` (Anthropic SDK wrapper) in Epic 4. The route handler in `variants.ts` calls the generator through a shared interface so the swap is a one-file change.

---

## Docker Compose

```yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"
```

No environment variables required for local operation. The `ANTHROPIC_API_KEY` variable is introduced in Epic 4.

---

## Out of Scope

The following are explicitly deferred to later epics:

- Frontend / UI (Epic 2)
- Audio playback via Web Speech API (Epic 3)
- AI/LLM-powered generation (Epic 4)
- Rate limiting or API key auth on the server
- Cloud deployment (Fly.io, Vercel, etc.) — local Docker Compose only (Epic 5)
- Non-English / non-Latin input rejection
- Caching of results
- Logging / observability infrastructure
