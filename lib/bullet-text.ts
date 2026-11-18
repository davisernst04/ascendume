// Editing one bullet inside a newline-separated bullet field without
// disturbing the others. Indexes match parseBullets in lib/resume-latex.ts.
import { parseBullets } from "@/lib/resume-latex";

const PREFIX = /^(\s*[•\-*]\s*)/;

/**
 * Replaces the bullet at `index` with `text`, keeping that line's bullet
 * marker. Returns null if the bullet is no longer `expected` (the user edited
 * it while a rewrite was pending).
 */
export function replaceBullet(raw: string, index: number, expected: string, text: string): string | null {
  if (parseBullets(raw)[index] !== expected) return null;
  const lines = raw.split("\n");
  let seen = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].replace(PREFIX, "").trim() === "") continue;
    seen++;
    if (seen === index) {
      const prefix = lines[i].match(PREFIX)?.[1] ?? "";
      lines[i] = `${prefix}${text}`;
      return lines.join("\n");
    }
  }
  return null;
}

/** Bullets as the builder stores them: one per line, each starting with "• ". */
export function formatBullets(bullets: string[]): string {
  return bullets.map((b) => `• ${b.trim()}`).join("\n");
}

/** Adds bullets after the existing ones. */
export function appendBullets(raw: string, bullets: string[]): string {
  const added = formatBullets(bullets);
  return raw.trim() ? `${raw.trimEnd()}\n${added}` : added;
}
