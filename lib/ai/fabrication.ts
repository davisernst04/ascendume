// The no-fabrication guard: a rewrite may only contain numbers the user gave us.

const NUMBER = /\d[\d,]*(?:\.\d+)?/g;

/** Numbers in `text`, normalized ("1,200" -> "1200", "3.50" -> "3.5"). */
export function numbersIn(text: string): Set<string> {
  const found = new Set<string>();
  for (const match of text.matchAll(NUMBER)) {
    const n = Number(match[0].replace(/,/g, ""));
    if (Number.isFinite(n)) found.add(String(n));
  }
  return found;
}

/**
 * Numbers in `output` that appear in none of `sources` (the original text and
 * the user's answers). A non-empty result means the model made a number up.
 */
export function inventedNumbers(output: string, sources: string[]): string[] {
  const allowed = new Set(sources.flatMap((s) => [...numbersIn(s)]));
  return [...numbersIn(output)].filter((n) => !allowed.has(n));
}
