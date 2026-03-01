# Epic 3 — Audio Playback — Specification

## Overview

This epic adds audio playback to the Say Silly UI using the browser's native Web Speech API (`SpeechSynthesis`). When variant results arrive, all variants auto-play in sequence. Each variant card has a ▶ Play / ■ Stop button for individual control. A global "Play all" button replays the full sequence; while a sequence is running it becomes a "Stop" button. Pressing Escape cancels any active speech. The feature degrades gracefully: on browsers that do not support `SpeechSynthesis` all audio controls are hidden silently.

---

## Tech stack

| Technology | Choice | Notes |
|---|---|---|
| Speech engine | `window.SpeechSynthesis` + `SpeechSynthesisUtterance` | Built-in browser API, no dependency |
| Language | TypeScript (existing `frontend/app.ts`) | No new files required |
| Voice selection | Auto-pick at runtime | Prefer first non-default voice; fall back to browser default |
| Rate | 1.0 (normal) | No per-style variation |
| Pitch | 1.0 (normal) | No pitch modification |

---

## Feature behaviour

### Detection & graceful degradation

- On page load check `'speechSynthesis' in window`.
- If `false`: do not render any Play buttons or the Play-all button. No error message is shown.
- If `true`: render all audio controls as described below.

### Auto-play on results

- Immediately after the variant cards are rendered, start playing all variants in sequence (no delay).
- Sequence playback uses the same logic as "Play all" (see below).

### Sequence playback ("Play all")

1. Cancel any in-progress speech (`speechSynthesis.cancel()`).
2. Speak each variant's `text` field in order (index 0 → last).
3. Wait 500 ms between variants (use `setTimeout` after each utterance's `onend` event).
4. While a sequence is playing the "Play all" button label/icon changes to "■ Stop".
5. Clicking "■ Stop" cancels speech and resets the button to "▶ Play all".
6. When the sequence finishes naturally, reset the button to "▶ Play all".

### Per-card Play button

- Default state: `▶ Play`
- While that card's variant is being spoken: `■ Stop`
- Clicking `▶ Play` while another variant (or sequence) is already speaking:
  - Cancel current speech immediately.
  - Start speaking the clicked card's variant.
- Clicking `■ Stop` on the active card:
  - Cancel current speech.
  - Reset all buttons to `▶ Play`.
  - Reset "Play all" to `▶ Play all`.

### Card visual feedback

- No card highlight or animation while speaking.
- Button label/icon change (▶ / ■) is the sole visual indicator of active state.

### Escape key

- Pressing `Escape` at any time cancels all active speech.
- Resets all per-card buttons to `▶ Play`.
- Resets "Play all" button to `▶ Play all`.

### Voice selection algorithm

```
1. Call speechSynthesis.getVoices()
2. Filter to voices matching the page's document.documentElement.lang (or 'en' as fallback)
3. Pick the first voice that is NOT the browser's default (isDefault === false)
4. If none found, use the first available voice
5. If voice list is empty, use no voice override (browser picks)
```

Note: `getVoices()` may return an empty array synchronously; listen to `speechSynthesis.onvoiceschanged` and cache the result for subsequent calls.

---

## UI components

| Component | Location | States |
|---|---|---|
| Per-card Play button | Bottom of each variant card | `▶ Play` (idle) / `■ Stop` (speaking) |
| Play-all button | Below variant card list | `▶ Play all` (idle) / `■ Stop` (sequence playing) |

Both buttons are hidden entirely when `SpeechSynthesis` is unsupported.

---

## State model

```
IDLE
  ├─ results arrive          → start sequence → SEQUENCE_PLAYING
  ├─ card Play clicked       → speak variant  → CARD_PLAYING
  └─ (no speech)

SEQUENCE_PLAYING
  ├─ variant ends + more remaining  → pause 500 ms → speak next → SEQUENCE_PLAYING
  ├─ last variant ends              → IDLE
  ├─ Stop button / Escape           → cancel → IDLE
  └─ card Play clicked              → cancel + speak card → CARD_PLAYING

CARD_PLAYING
  ├─ utterance ends                 → IDLE
  ├─ card Stop / Escape             → cancel → IDLE
  ├─ different card Play clicked    → cancel + speak new card → CARD_PLAYING
  └─ Play-all clicked               → cancel + start sequence → SEQUENCE_PLAYING
```

---

## Implementation notes

- All speech logic lives in `frontend/app.ts` (or a new `frontend/audio.ts` module imported by it).
- Attach a single `keydown` listener on `document` for Escape; remove it if the page is torn down.
- Store a reference to the currently active utterance and a `sequenceActive` flag to manage state transitions.
- Reset all button states in a single `resetAudioUI()` helper called from every transition to IDLE.

---

## Out of scope

- Voice picker UI (deferred to Epic 5 polish, if desired)
- Rate or pitch controls (fixed at 1.0)
- Per-style rate/pitch variation
- Subtitle / karaoke word highlighting
- Mobile-specific long-press to replay
