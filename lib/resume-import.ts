// Checks that the AI parser copied the resume instead of rewriting it.
import { inventedNumbers } from "@/lib/ai/fabrication";

/** Lowercase letters and digits only, so line wraps, hyphenation and bullet glyphs don't matter. */
function squash(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Bullets in the parsed output that don't appear word for word in the extracted text. */
export function alteredBullets(bullets: string[], sourceText: string): string[] {
  const source = squash(sourceText);
  return bullets.filter((b) => {
    const s = squash(b.replace(/^[•\-*]\s*/, ""));
    return s.length > 0 && !source.includes(s);
  });
}

/** Numbers in the parsed output that aren't in the extracted text. */
export function importInventedNumbers(outputTexts: string[], sourceText: string): string[] {
  return [...new Set(outputTexts.flatMap((t) => inventedNumbers(t, [sourceText])))];
}

/** Splits a newline-separated bullet field into bullet texts. */
export function bulletLines(field: string): string[] {
  return field
    .split("\n")
    .map((l) => l.replace(/^\s*[•\-*]\s*/, "").trim())
    .filter(Boolean);
}
