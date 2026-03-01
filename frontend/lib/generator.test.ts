import { test, expect, describe } from "bun:test";
import { generateVariants, makePhoneticVariants, PHONETIC_RULES, CREATIVE_TECHNIQUES } from "./generator";

// ---------------------------------------------------------------------------
// Rule / technique counts
// ---------------------------------------------------------------------------

describe("rule counts", () => {
  test("PHONETIC_RULES has at least 40 entries", () => {
    expect(PHONETIC_RULES.length).toBeGreaterThanOrEqual(40);
  });

  test("CREATIVE_TECHNIQUES has exactly 15 entries", () => {
    expect(CREATIVE_TECHNIQUES.length).toBe(15);
  });
});

// ---------------------------------------------------------------------------
// makePhoneticVariants
// ---------------------------------------------------------------------------

describe("makePhoneticVariants", () => {
  test("returns multiple variants for a word with several matching rules", () => {
    // "phone" matches ph→f at minimum; a rich rule set should match more
    const vs = makePhoneticVariants("phone");
    expect(vs.length).toBeGreaterThan(1);
  });

  test("ph→f rule fires on 'phone' → 'fone'", () => {
    const vs = makePhoneticVariants("phone");
    expect(vs.some((v) => v.text === "fone")).toBe(true);
  });

  test("th→d rule fires on 'the' → 'de'", () => {
    const vs = makePhoneticVariants("the");
    expect(vs.some((v) => v.text === "de")).toBe(true);
  });

  test("oo→ew rule fires on 'food' → 'fewd'", () => {
    const vs = makePhoneticVariants("food");
    expect(vs.some((v) => v.text === "fewd")).toBe(true);
  });

  test("kn→ken rule fires on 'knife' → 'kenife'", () => {
    const vs = makePhoneticVariants("knife");
    expect(vs.some((v) => v.text === "kenife")).toBe(true);
  });

  test("ll→l rule fires on 'hello' → 'helo'", () => {
    const vs = makePhoneticVariants("hello");
    expect(vs.some((v) => v.text === "helo")).toBe(true);
  });

  test("str→stur schwa insertion fires on 'string' → 'sturing'", () => {
    const vs = makePhoneticVariants("string");
    expect(vs.some((v) => v.text === "sturing")).toBe(true);
  });

  test("x→ks rule fires on 'fox' → 'foks'", () => {
    const vs = makePhoneticVariants("fox");
    expect(vs.some((v) => v.text === "foks")).toBe(true);
  });

  test("all returned variants have style 'phonetic_swap'", () => {
    const vs = makePhoneticVariants("phone");
    expect(vs.every((v) => v.style === "phonetic_swap")).toBe(true);
  });

  test("fallback emits exactly 1 variant when no rule matches", () => {
    // "by" has no vowels and no matching phonetic rules
    const vs = makePhoneticVariants("by");
    expect(vs.length).toBe(1);
    expect(vs[0].style).toBe("phonetic_swap");
  });

  test("s→z does not affect 'sh' (fish stays fishless of z)", () => {
    const vs = makePhoneticVariants("fish");
    const szVariant = vs.find((v) => v.hint.includes("s → z"));
    // If the s→z rule fires at all, 'sh' must not become 'zh'
    if (szVariant) {
      expect(szVariant.text).not.toContain("zh");
    }
  });

  test("g→gh does not fire on 'ng' cluster in 'sing'", () => {
    const vs = makePhoneticVariants("sing");
    const ghVariant = vs.find((v) => v.hint.includes("g → gh"));
    // If g→gh variant exists, 'ng' should not become 'ngh'
    if (ghVariant) {
      expect(ghVariant.text).not.toContain("ngh");
    }
  });
});

// ---------------------------------------------------------------------------
// Creative techniques
// ---------------------------------------------------------------------------

describe("creative techniques", () => {
  // Helper: run all creative techniques directly via generateVariants on a long
  // enough word that has no phonetic matches (so pool is all creative variants)
  // We can't call makeCreative directly, so we test via the exported arrays.

  test("CREATIVE_TECHNIQUES includes mc- prefix", () => {
    const lower = "banana";
    const hasMc = CREATIVE_TECHNIQUES.some(([fn]) => fn(lower).startsWith("mc"));
    expect(hasMc).toBe(true);
  });

  test("CREATIVE_TECHNIQUES includes -inski suffix", () => {
    const lower = "banana";
    const has = CREATIVE_TECHNIQUES.some(([fn]) => fn(lower).includes("inski"));
    expect(has).toBe(true);
  });

  test("CREATIVE_TECHNIQUES includes -ola suffix", () => {
    const lower = "banana";
    const has = CREATIVE_TECHNIQUES.some(([fn]) => fn(lower).includes("ola"));
    expect(has).toBe(true);
  });

  test("CREATIVE_TECHNIQUES includes -inator suffix", () => {
    const lower = "banana";
    const has = CREATIVE_TECHNIQUES.some(([fn]) => fn(lower).includes("inator"));
    expect(has).toBe(true);
  });

  test("CREATIVE_TECHNIQUES includes -eroo suffix", () => {
    const lower = "banana";
    const has = CREATIVE_TECHNIQUES.some(([fn]) => fn(lower).includes("eroo"));
    expect(has).toBe(true);
  });

  test("CREATIVE_TECHNIQUES includes word reversal", () => {
    const lower = "banana";
    const has = CREATIVE_TECHNIQUES.some(([fn]) => fn(lower) === "ananab");
    expect(has).toBe(true);
  });

  test("CREATIVE_TECHNIQUES includes first-syllable stutter", () => {
    const lower = "banana";
    const has = CREATIVE_TECHNIQUES.some(([fn]) => fn(lower) === "ba-banana");
    expect(has).toBe(true);
  });

  test("CREATIVE_TECHNIQUES includes waka insertion", () => {
    const lower = "banana";
    const has = CREATIVE_TECHNIQUES.some(([fn]) => fn(lower).includes("waka"));
    expect(has).toBe(true);
  });

  test("CREATIVE_TECHNIQUES includes pig latin (consonant-start word)", () => {
    const lower = "banana";
    // b + anana + ay = "ananabay"
    const has = CREATIVE_TECHNIQUES.some(([fn]) => fn(lower) === "ananabay");
    expect(has).toBe(true);
  });

  test("CREATIVE_TECHNIQUES pig latin handles vowel-start word", () => {
    const lower = "apple";
    const has = CREATIVE_TECHNIQUES.some(([fn]) => fn(lower) === "appleay");
    expect(has).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// generateVariants contract
// ---------------------------------------------------------------------------

describe("generateVariants", () => {
  test("returns exactly 3 variants", async () => {
    const vs = await generateVariants("hello");
    expect(vs.length).toBe(3);
  });

  test("all 3 variants have unique text", async () => {
    const vs = await generateVariants("hello");
    const texts = vs.map((v) => v.text);
    expect(new Set(texts).size).toBe(3);
  });

  test("is deterministic — same input gives same output", async () => {
    const a = await generateVariants("pronunciation");
    const b = await generateVariants("pronunciation");
    expect(a.map((v) => v.text)).toEqual(b.map((v) => v.text));
  });

  test("each variant has text, style, and hint", async () => {
    const vs = await generateVariants("hello");
    for (const v of vs) {
      expect(typeof v.text).toBe("string");
      expect(["phonetic_swap", "creative"]).toContain(v.style);
      expect(typeof v.hint).toBe("string");
    }
  });

  test("short single-char input still returns 3 unique variants", async () => {
    const vs = await generateVariants("a");
    expect(vs.length).toBe(3);
    expect(new Set(vs.map((v) => v.text)).size).toBe(3);
  });
});
