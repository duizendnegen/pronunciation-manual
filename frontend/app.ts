import { generateVariants } from "./lib/generator";
import type { Variant } from "./lib/types";

// ── Audio ─────────────────────────────────────────────────────────────────────

const speechSupported = !!window.speechSynthesis;
let voices: SpeechSynthesisVoice[] = [];
let playing = false;
let seqTimeoutId: ReturnType<typeof setTimeout> | null = null;
let currentVariants: Variant[] = [];

if (speechSupported) {
  voices = speechSynthesis.getVoices();
  speechSynthesis.addEventListener("voiceschanged", () => {
    voices = speechSynthesis.getVoices();
  });
}

function pickVoice(): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  const lang = document.documentElement.lang || "en";
  const langVoices = voices.filter((v) => v.lang.startsWith(lang));
  const pool = langVoices.length > 0 ? langVoices : voices;
  return pool.find((v) => !v.default) ?? pool[0];
}

function cancelSpeech(): void {
  playing = false;
  if (seqTimeoutId !== null) {
    clearTimeout(seqTimeoutId);
    seqTimeoutId = null;
  }
  speechSynthesis.cancel();
}

function speakAtSeqIdx(idx: number): void {
  if (idx >= currentVariants.length) {
    playing = false;
    return;
  }
  const u = new SpeechSynthesisUtterance(currentVariants[idx].text);
  const v = pickVoice();
  if (v) u.voice = v;
  u.rate = 0.8;
  u.onend = () => {
    if (!playing) return;
    if (idx < currentVariants.length - 1) {
      seqTimeoutId = setTimeout(() => speakAtSeqIdx(idx + 1), 500);
    } else {
      playing = false;
    }
  };
  speechSynthesis.speak(u);
}

function startSequence(): void {
  if (seqTimeoutId !== null) {
    clearTimeout(seqTimeoutId);
    seqTimeoutId = null;
  }
  speechSynthesis.cancel();
  playing = true;
  speakAtSeqIdx(0);
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("input-form") as HTMLFormElement;
  const input = document.getElementById("word-input") as HTMLInputElement;
  const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement;

  input.addEventListener("input", () => {
    submitBtn.disabled = input.value.trim().length === 0;
  });

  if (speechSupported) {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && playing) {
        cancelSpeech();
      }
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const trimmed = input.value.trim();
    if (!trimmed) return;

    if (playing) cancelSpeech();
    submitBtn.disabled = true;

    const variants = await generateVariants(trimmed);
    currentVariants = variants;
    if (speechSupported && variants.length > 0) {
      startSequence();
    }

    submitBtn.disabled = input.value.trim().length === 0;
  });
});
