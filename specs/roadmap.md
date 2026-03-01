# Pronunciation Manual — Roadmap

## Vision
A one-page web app where you type a word or phrase and hear it mispronounced.

---

## Epic 1 — Silly Variant Generation (Backend)
> Core intelligence: a thin API server that generates mispronunciations algorithmically.

**Goal:** Accept a word/phrase, return 3–5 structured silly variants — no external AI dependency, runs fully offline.

Key work:
- Set up minimal backend (Bun + Hono)
- Algorithmic variant generation across three styles:
  - **Phonetic swap** — swap or shift sounds within the word using substitution rules
  - **Spelling-literal** — pronounce every letter exactly as written (reverse silent-letter rules)
  - **Creative** — randomised syllable additions, stress shifts, playful distortions
- Return structured JSON: `[{ text, style, hint }]`
- Basic error handling & input validation

---

## Epic 2 — Single-Page UI (Input + Results)
> The one-page experience users interact with.

**Goal:** Clean, fast UI for submitting a word and seeing the variants.

Key work:
- Text input + submit button
- Loading state while backend responds
- Results: 3–5 variant cards, each showing silly text + style label
- Responsive layout, works on mobile

---

## Epic 3 — Audio Playback
> Make the variants actually speakable.

**Goal:** Play each silly variant using the browser's Web Speech API.

Key work:
- Integrate `SpeechSynthesis` API
- Per-card "Play" button speaks the silly text
- Visual feedback while speaking (card highlight / animation)
- "Play all" button plays variants in sequence
- Voice/rate tuning for comedic effect
