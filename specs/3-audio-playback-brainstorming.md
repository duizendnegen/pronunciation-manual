# Epic 3 — Audio Playback — Brainstorming

> Make the variants actually speakable.
> Epic 3 covers:
> - Integrate `SpeechSynthesis` API
> - Per-card "Play" button speaks the silly text
> - Visual feedback while speaking (card highlight / animation)
> - "Play all" button plays variants in sequence
> - Voice/rate tuning for comedic effect

---

## Round 1 — Tech / Speech API behaviour

### Q1.1 — What to speak: variant text or hint?

Each variant has a `text` field (the silly spelling, e.g. "tuh-MAY-toe") and a `hint` field (a pronunciation guide). Which should be passed to `SpeechSynthesis.speak()`?

- [x] Speak `text` (the silly variant itself) ← recommended: it's the mispronounced form the user wants to hear
- [ ] Speak `hint` (the pronunciation guide, more phonetically explicit)
- [ ] Speak both: text first, then hint as a follow-up utterance

> **Your answer / freetext:**
>

---

### Q1.2 — Unsupported browser handling

`SpeechSynthesis` is unavailable on some older browsers. What should happen?

- [x] Hide the Play button(s) silently — no error shown ← recommended: keeps UI clean; user just doesn't see feature
- [ ] Show Play buttons but display a tooltip "Not supported in this browser"
- [ ] Show a banner at the top of the page: "Audio not available in this browser"

> **Your answer / freetext:**
>

---

### Q1.3 — Concurrency: what happens when Play is clicked while another variant is already speaking?

- [ ] Cancel the current speech and immediately start the new one ← recommended: simple and intuitive
- [ ] Ignore the click until current speech finishes
- [ ] Queue it — play new variant after current one ends

> **Your answer / freetext:**
> Speak all variants after one another automatically. Then after, when the suer clicks a play button, cancel the current speech and immediately start the new one.

---

## Round 2 — Auto-play & "Play all" behaviour

Since variants auto-play in sequence when results arrive, the "Play all" button becomes a replay control.

### Q2.1 — "Play all" button purpose

Given auto-play on load, what should the "Play all" button do?

- [x] Replay all variants from the start (restart the sequence) ← recommended: lets user replay the full set after it finishes
- [ ] Remove the button entirely — auto-play covers it
- [ ] Rename it "Replay all" to make the purpose clear

> **Your answer / freetext:**
>

---

### Q2.2 — Auto-play trigger

When exactly should auto-play start?

- [x] Immediately when the results appear (no delay) ← recommended: feels responsive and fun
- [ ] After a short delay (~1 s) so the user can see the cards first
- [ ] Only if the user has previously interacted with a Play button (opt-in)

> **Your answer / freetext:**
>

---

### Q2.3 — Gap between variants during sequence playback

Should there be a pause between each variant when playing in sequence?

- [x] Short pause (~500 ms) between variants ← recommended: gives listener time to appreciate each one
- [ ] No pause — play back-to-back
- [ ] Longer pause (~1 s)

> **Your answer / freetext:**
>

---

## Round 3 — Voice & rate tuning

### Q3.1 — Voice selection

Should the app pick a voice or use the browser default?

- [x] App auto-picks for comedic effect — prefer a non-default or slightly unusual voice if available ← recommended: maximises silliness without extra UI
- [ ] Expose a voice picker dropdown in the UI
- [ ] Use whatever the browser default is, no selection logic

> **Your answer / freetext:**
>

---

### Q3.2 — Speech rate

- [ ] Slightly slower than normal (rate ≈ 0.8) ← recommended: exaggerates the mispronunciation, funnier
- [x] Normal rate (rate = 1.0)
- [ ] Fast (rate ≈ 1.3) — rapid-fire delivery
- [ ] Per-style: phonetic_swap slow, creative fast

> **Your answer / freetext:**
>

---

### Q3.3 — Pitch tuning

- [ ] Slightly elevated pitch (pitch ≈ 1.2) ← recommended: adds to comedic effect
- [x] Normal pitch (pitch = 1.0)
- [ ] No pitch control — leave it to the browser

> **Your answer / freetext:**
>

---

## Round 4 — Visual feedback

### Q4.1 — Speaking indicator on the card

While a variant is being spoken, how should its card be highlighted?

- [ ] Border/outline highlight + subtle pulse animation ← recommended: clear without being distracting
- [ ] Background colour change (e.g. yellow flash)
- [ ] Bouncing speaker icon on the card

> **Your answer / freetext:**
> No highlight.

---

### Q4.2 — Per-card Play button state

What should the Play button look like while that card is speaking?

- [ ] Icon toggles: ▶ when idle, ■ while speaking ← recommended: compact, universally understood
- [ ] Text label: "Play" / "Stop"
- [x] Icon + label: "▶ Play" / "■ Stop"

> **Your answer / freetext:**
>

---

### Q4.3 — Stop / cancel control

While any speech is playing, should there be a global stop control?

- [ ] Yes — a "Stop" button near the "Play all" / "Replay all" button ← recommended: lets user silence everything quickly
- [ ] No global stop — only per-card buttons handle cancellation
- [ ] Pressing Escape cancels speech (no visible button)

> **Your answer / freetext:**
> When all is playing, the Play all button changes to be a Stop button. The escape button should also cancel speech.
