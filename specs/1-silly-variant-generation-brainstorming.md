# Epic 1 — Silly Variant Generation (Backend) — Brainstorming

> Core intelligence: a thin API server that generates mispronunciations algorithmically (no AI until Epic 4).
> Epic 1 covers:
> - Set up minimal backend (Bun + Hono)
> - Algorithmic variant generation across three styles (phonetic swap, spelling-literal, creative)
> - Return structured JSON: `[{ text, style, hint }]`
> - Basic error handling & input validation

---

## Round 1 — Tech / Infrastructure

### Q1.1 — Runtime & framework

Which backend runtime and framework should power the API server?

- [x] Bun + Hono ← recommended: fast startup, TypeScript-native, minimal boilerplate; Hono is featherweight and Bun runs it without a build step
- [ ] Node + Express
- [ ] Node + Fastify
- [ ] Python + FastAPI

> **Your answer / freetext:**
>

---

### Q1.2 — LLM provider

Which LLM provider/SDK should generate the silly variants?

- [ ] Anthropic Claude (claude-haiku-4-5 or claude-sonnet-4-6) ← deferred to Epic 4
- [ ] OpenAI GPT-4o-mini
- [ ] Google Gemini Flash
- [ ] Local model (Ollama)
- [x] No LLM — algorithmic rule-based generation ← chosen: runs fully offline, no API key, unblocks Epics 2 & 3 immediately

> **Your answer / freetext:**
> AI/LLM integration moved to Epic 4. Epic 1 uses pure algorithmic generation so the full stack (backend + UI + audio) can be built and tested locally without any external dependencies.

---

### Q1.3 — Structured output strategy

How should the generator return structured output?

- [x] Pure TypeScript functions that return `Variant[]` directly ← chosen: no parsing needed; LLM tool-use deferred to Epic 4
- [ ] Prompt with explicit JSON schema + Claude's tool-use / structured output feature ← deferred to Epic 4
- [ ] Prompt only — instruct model to reply with raw JSON, parse response manually
- [ ] Response schema enforced via Zod/validation after free-text parse

> **Your answer / freetext:**
>

---

### Q1.4 — Deployment target

Where will the backend be hosted?

- [ ] Fly.io (single small machine) ← recommended: always-on, cheap, easy Docker deploy
- [ ] Vercel Edge Functions / serverless
- [ ] Railway
- [x] Self-hosted / Docker Compose locally only for now

> **Your answer / freetext:**
>

---

## Round 3 — Business Logic & Prompt Engineering

### Q3.1 — Style distribution when count > 3

When the server picks 4 or 5 variants, how should the extra slots be filled?

```
Base: always 1 phonetic_swap + 1 spelling_literal + 1 ai_creative = 3

Extra slot options:
  A) Extra ai_creative variants (most creative freedom)
  B) One extra of each style, cycling through
  C) Server picks randomly which style gets the extra(s)
```

- [s] Extra slots are always ai_creative variants ← recommended: consistent base, extras showcase creativity
- [ ] Cycle through styles (4th = phonetic_swap, 5th = spelling_literal)
- [ ] Randomly assign extra slots to any style

> **Your answer / freetext:**
>

---

### Q3.2 — Which Claude model?

> **Deferred to Epic 4.** No LLM is used in Epic 1.

- [ ] claude-haiku-4-5 (fast & cheap — recommended when AI is introduced)
- [ ] claude-sonnet-4-6 (more capable but slower/pricier)
- [ ] Try haiku first, fall back to sonnet on parse failure

> **Your answer / freetext:**
> Decision deferred to Epic 4 brainstorming.

---

### Q3.3 — Error response shape

What should the API return on validation errors and LLM failures?

```
Proposed:
  400 Bad Request  → { "error": "input_invalid", "message": "…" }
  500 Server Error → { "error": "generation_failed", "message": "…" }
```

- [x] Simple `{ error, message }` object ← recommended: easy for the UI to handle
- [ ] RFC 7807 Problem Details (`{ type, title, status, detail }`)
- [ ] Just HTTP status code, no body

> **Your answer / freetext:**
>

---

### Q3.4 — CORS

The frontend (Epic 2) will run in the browser and call this API. Should CORS be configured now?

- [x] Allow all origins (`*`) for local dev ← recommended: unblocks Epic 2 development immediately
- [ ] Restrict to specific origin from day one
- [ ] No CORS handling yet (deal with it in Epic 2)

> **Your answer / freetext:**
>


### Q2.1 — Response shape

The roadmap proposes `[{ text, style, hint }]`. Should we lock that down or expand it?

```
Proposed:
{
  "variants": [
    { "text": "FOO-netic",   "style": "phonetic_swap",    "hint": "swapped the 'ph' to 'f'" },
    { "text": "Foe-neh-tic", "style": "spelling_literal", "hint": "every letter sounded out" },
    { "text": "Fuh-NET-ick", "style": "ai_creative",      "hint": "emphasis shifted for effect" }
  ]
}
```

- [x] Keep exactly `{ text, style, hint }` per variant ← recommended: minimal, sufficient for Epic 2 UI
- [ ] Add `pronunciation_ipa` (IPA string) for each variant
- [ ] Add `audio_hint` (speech rate / pitch suggestion) for Web Speech API (Epic 3 concern)
- [ ] Add top-level `input` echo field

> **Your answer / freetext:**
>

---

### Q2.2 — Number of variants

How many silly variants should the API return per request?

- [ ] Always exactly 3 (one per style) ← recommended: keeps prompt simple, result predictable
- [ ] Always exactly 5 (mix of styles, allow duplicates per style)
- [ ] Configurable via query param `?count=3`
- [ ] Let the LLM decide (3–5)

> **Your answer / freetext:**
> Decide randomly on the server side (3-5)

---

### Q2.3 — API endpoint shape

What should the single endpoint look like?

```
Option A (POST JSON body):
  POST /variants
  { "input": "pneumonia" }

Option B (GET with query param):
  GET /variants?q=pneumonia
```

- [x] POST /variants with JSON body ← recommended: cleaner for structured input, easier to extend
- [ ] GET /variants?q=…

> **Your answer / freetext:**
>

---

### Q2.4 — Input validation rules

What constraints should be applied to the input before hitting the LLM?

- [x] Non-empty, strip whitespace, max 100 characters ← recommended: prevents abuse, keeps prompts focused
- [ ] Non-empty only, no length limit
- [ ] Also reject non-Latin characters / digits
- [ ] Allow up to 500 characters (whole sentences)

> **Your answer / freetext:**
>
