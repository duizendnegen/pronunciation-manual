import type { Variant } from "./types";

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// [regex, replacement, hint description]
export const PHONETIC_RULES: Array<[RegExp, string, string]> = [
  // --- Existing ---
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

  // --- Vowel shifts (digraphs) ---
  [/oo/g, "ew", "oo → ew"],
  [/ou/g, "ow", "ou → ow"],
  [/ai/g, "ay", "ai → ay"],
  [/ea/g, "ee", "ea → ee"],
  [/ow/g, "oh", "ow → oh"],
  [/igh/g, "eye", "igh → eye"],
  [/au/g, "aw", "au → aw"],
  [/ew/g, "yoo", "ew → yoo"],

  // --- Vowel shifts (single) ---
  [/a/g, "ay", "a → ay"],
  [/e/g, "ee", "e → ee"],
  [/i/g, "eye", "i → eye"],
  [/o/g, "oh", "o → oh"],
  [/u/g, "oo", "u → oo"],

  // --- Consonant softening ---
  [/ce/g, "se", "ce → se"],
  [/ci/g, "si", "ci → si"],
  [/ge/g, "je", "ge → je"],
  [/gi/g, "ji", "gi → ji"],
  [/s(?!h)/g, "z", "s → z"],

  // --- Consonant hardening ---
  [/(?<!n)g(?!h)/g, "gh", "g → gh"],
  [/j/g, "dj", "j → dj"],
  [/v/g, "b", "v → b"],
  [/f/g, "ph", "f → ph"],

  // --- Digraph expansion ---
  [/x/g, "ks", "x → ks"],
  [/ng/g, "ngg", "ng → ngg"],
  [/mb/g, "mm", "mb → mm"],

  // --- Silent-letter reveal ---
  [/kn/g, "ken", "kn → ken (silent k revealed)"],
  [/gn/g, "gun", "gn → gun (silent g revealed)"],
  [/mb/g, "mub", "mb → mub (silent b revealed)"],
  [/ld/g, "lud", "ld → lud (dark l revealed)"],

  // --- Double-letter collapse ---
  [/ll/g, "l", "ll → l"],
  [/ss/g, "s", "ss → s"],
  [/ff/g, "f", "ff → f"],
  [/tt/g, "t", "tt → t"],
  [/rr/g, "r", "rr → r"],

  // --- Schwa insertion ---
  [/str/g, "stur", "str → stur (schwa inserted)"],
  [/spr/g, "spur", "spr → spur (schwa inserted)"],
  [/scr/g, "skur", "scr → skur (schwa inserted)"],
  [/spl/g, "spul", "spl → spul (schwa inserted)"],
  [/thr/g, "thur", "thr → thur (schwa inserted)"],
];

export function makePhoneticVariants(input: string): Variant[] {
  const lower = input.toLowerCase();
  const variants: Variant[] = [];

  for (const [pattern, replacement, desc] of PHONETIC_RULES) {
    pattern.lastIndex = 0;
    if (pattern.test(lower)) {
      pattern.lastIndex = 0;
      variants.push({
        text: lower.replace(pattern, replacement),
        style: "phonetic_swap",
        hint: `swapped '${desc}'`,
      });
    }
    pattern.lastIndex = 0;
  }

  // Fallback: only fires when zero rules matched
  if (variants.length === 0) {
    let text = lower;
    let changed = false;
    text = lower.replace(/[aeiou]+/, (m) => {
      const map: Record<string, string> = { a: "ay", e: "ee", i: "eye", o: "oh", u: "oo" };
      const repl = map[m[0]] ?? m;
      if (repl !== m) { changed = true; }
      return repl;
    });
    if (!changed) {
      text = lower[0] + "uh" + lower.slice(1);
    }
    variants.push({ text, style: "phonetic_swap", hint: "vowel sound shifted" });
  }

  return variants;
}

type CreativeFn = (s: string) => string;

export const CREATIVE_TECHNIQUES: Array<[CreativeFn, string]> = [
  // --- Existing ---
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

  // --- New suffix / prefix ---
  [(s) => "mc" + s, "'mc' prefix for instant silliness"],
  [(s) => s + "-inski", "suffix '-inski' added"],
  [(s) => s + "-ola", "suffix '-ola' added"],
  [(s) => s + "-inator", "suffix '-inator' added"],
  [(s) => s + "-eroo", "suffix '-eroo' added"],

  // --- New structural ---
  [
    (s) => s.split("").reverse().join(""),
    "word reversed",
  ],
  [
    (s) => s.slice(0, 2) + "-" + s,
    "first syllable stuttered",
  ],
  [
    (s) => {
      const mid = Math.floor(s.length / 2);
      return s.slice(0, mid) + "-waka-" + s.slice(mid);
    },
    "'-waka-' inserted mid-word",
  ],
  [
    (s) => {
      if (/[aeiou]/i.test(s[0])) return s + "ay";
      const vowelIdx = s.split("").findIndex((c) => /[aeiou]/i.test(c));
      if (vowelIdx === -1) return s + "ay";
      return s.slice(vowelIdx) + s.slice(0, vowelIdx) + "ay";
    },
    "pig latin",
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

  // Build candidate pool: all matching phonetic rules + all creative techniques
  const pool: Variant[] = [...makePhoneticVariants(input)];
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

  // Fallback: combined-creative if still < 3
  for (let i = 0; variants.length < 3; i++) {
    const v = makeCreative(input, h + 10 + i, true);
    if (!seen.has(v.text)) {
      seen.add(v.text);
      variants.push(v);
    }
  }

  return variants;
}
