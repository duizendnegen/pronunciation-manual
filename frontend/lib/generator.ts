import type { Variant } from "./types";

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// [regex, replacement, hint description]
const PHONETIC_RULES: Array<[RegExp, string, string]> = [
  [/ph/g, "f", "ph → f"],
  [/tion/g, "shun", "tion → shun"],
  [/ture/g, "chur", "ture → chur"],
  [/ck/g, "k", "ck → k"],
  [/qu/g, "kw", "qu → kw"],
  [/wh/g, "w", "wh → w"],
  [/th/g, "d", "th → d"],
  [/ch/g, "sh", "ch → sh"],
  [/gh/g, "g", "gh → g"],
  [/wr/g, "r", "wr → r"],
];

function makePhoneticSwap(input: string): Variant {
  const lower = input.toLowerCase();
  for (const [pattern, replacement, desc] of PHONETIC_RULES) {
    if (pattern.test(lower)) {
      pattern.lastIndex = 0;
      return {
        text: lower.replace(pattern, replacement),
        style: "phonetic_swap",
        hint: `swapped '${desc}'`,
      };
    }
  }
  // Fallback: shift first vowel sound; if no vowels, insert a schwa
  let text = lower;
  let changed = false;
  text = lower.replace(/[aeiou]+/, (m) => {
    const map: Record<string, string> = { a: "ay", e: "ee", i: "eye", o: "oh", u: "oo" };
    const replacement = map[m[0]] ?? m;
    if (replacement !== m) { changed = true; }
    return replacement;
  });
  if (!changed) {
    // No vowels — insert a schwa after the first consonant
    text = lower[0] + "uh" + lower.slice(1);
  }
  return { text, style: "phonetic_swap", hint: "vowel sound shifted" };
}

type CreativeFn = (s: string) => string;

const CREATIVE_TECHNIQUES: Array<[CreativeFn, string]> = [
  [(s) => s + "-ington", "suffix '-ington' added for flair"],
  [(s) => s + "-y", "playful '-y' suffix added"],
  [(s) => s + "-oo", "whimsical '-oo' ending added"],
  [(s) => s.replace(/([aeiou])/i, "$1$1"), "first vowel doubled for emphasis"],
  [
    (s) => {
      const pos = Math.max(1, Math.floor(s.length / 4));
      return s.slice(0, pos) + "-" + s.slice(pos);
    },
    "stress dash inserted early",
  ],
  [
    (s) => s.replace(/([aeiou])/gi, (m) => m.toUpperCase()),
    "vowels capitalised for comic stress",
  ],
];

function makeCreative(input: string, seed: number, combineTwo: boolean): Variant {
  const lower = input.toLowerCase();
  const idx = seed % CREATIVE_TECHNIQUES.length;
  const [fn, hint] = CREATIVE_TECHNIQUES[idx];

  if (combineTwo) {
    const idx2 = (seed + 2) % CREATIVE_TECHNIQUES.length;
    const [fn2, hint2] = CREATIVE_TECHNIQUES[idx2];
    return {
      text: fn2(fn(lower)),
      style: "creative",
      hint: `${hint}; ${hint2}`,
    };
  }

  return { text: fn(lower), style: "creative", hint };
}

export async function generateVariants(input: string): Promise<Variant[]> {
  const h = hash(input);

  // Build candidate pool: phonetic + all 6 creative (single technique each)
  const pool: Variant[] = [makePhoneticSwap(input)];
  for (let i = 0; i < CREATIVE_TECHNIQUES.length; i++) {
    pool.push(makeCreative(input, h + i, false));
  }

  // Fisher-Yates shuffle seeded by hash
  let seed = h;
  for (let i = pool.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(seed) % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Pick 3 with unique text
  const seen = new Set<string>();
  const variants: Variant[] = [];
  for (const v of pool) {
    if (!seen.has(v.text)) {
      seen.add(v.text);
      variants.push(v);
      if (variants.length === 3) break;
    }
  }

  // Fallback: add combined-creative if needed
  for (let i = 0; variants.length < 3; i++) {
    const v = makeCreative(input, h + 10 + i, true);
    if (!seen.has(v.text)) {
      seen.add(v.text);
      variants.push(v);
    }
  }

  return variants;
}
