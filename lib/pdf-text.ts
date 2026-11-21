// Turns a PDF into plain text in reading order for the resume parser.
//
// Content-stream order is bottom-to-top or interleaved for many generators
// (LibreOffice, Word), so the positioned text runs from pdf.js are laid out
// again: split into columns if the page has a sidebar, grouped into lines by
// y, and ordered left to right. pdf.js turns positioning gaps into spaces,
// which LaTeX PDFs need: they draw no space glyphs between words.
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import * as pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.mjs";

// Run pdf.js on the main thread. A static import keeps the worker in the
// server bundle; pdf.js otherwise loads it by a path the bundler can't see.
(globalThis as { pdfjsWorker?: unknown }).pdfjsWorker = pdfWorker;

export interface TextRun {
  x: number;
  y: number;
  /** Width in page units. */
  width: number;
  text: string;
}

/** Runs whose baselines are this close (page units) sit on the same line. */
const SAME_LINE = 0.3;
/** Runs closer than this are one word ("P" + "RIYA" in small caps). */
const JOIN_GAP = 0.12;
/** Runs farther apart than this are separate cells (a title and its right-aligned date). */
const CELL_GAP = 2;

function lineText(runs: TextRun[]): string {
  const sorted = [...runs].sort((a, b) => a.x - b.x);
  let out = "";
  let end = -Infinity;
  for (const r of sorted) {
    const gap = r.x - end;
    if (out && gap > CELL_GAP) out += " | ";
    else if (out && gap > JOIN_GAP && !out.endsWith(" ") && !r.text.startsWith(" ")) out += " ";
    out += r.text;
    end = r.x + r.width;
  }
  return out.replace(/\s+/g, " ").trim();
}

const BULLET = /^[•\-*–]\s*/;

/**
 * Groups runs into lines, then joins a bullet's wrapped continuation lines to
 * it: a line with no bullet glyph that starts just right of the previous
 * bullet's glyph (where its text begins), directly below it.
 */
function linesOf(runs: TextRun[]): string[] {
  const sorted = [...runs].sort((a, b) => a.y - b.y || a.x - b.x);
  const groups: TextRun[][] = [];
  for (const r of sorted) {
    const current = groups.at(-1);
    if (current && Math.abs(current[0].y - r.y) < SAME_LINE) current.push(r);
    else groups.push([r]);
  }

  const lines: { text: string; x: number; y: number; bulletX: number | null }[] = [];
  for (const g of groups) {
    const text = lineText(g)
      .replace(/\s+•$/, "") // an emoji or icon glyph at the end of a line
      .trim();
    if (!text) continue;
    const x = Math.min(...g.map((r) => r.x));
    const y = g[0].y;
    const prev = lines.at(-1);
    const isContinuation =
      prev !== undefined &&
      prev.bulletX !== null &&
      !BULLET.test(text) &&
      x > prev.bulletX + 0.2 &&
      x < prev.bulletX + 1.5 &&
      y - prev.y < 1.6;
    // "linkedin.com/in/name-" + "suffix": a hyphen wrap at the same indent.
    const isHyphenWrap =
      prev !== undefined && prev.text.endsWith("-") && /^[a-z0-9]/.test(text) && Math.abs(x - prev.x) < 0.3 && y - prev.y < 1.6;
    if (isContinuation || isHyphenWrap) {
      prev.text = prev.text.endsWith("-") ? prev.text + text : `${prev.text} ${text}`;
      prev.y = y;
      continue;
    }
    lines.push({ text, x, y, bulletX: BULLET.test(text) ? x : null });
  }
  return lines.map((l) => l.text);
}

/**
 * The x position where a second column starts, or null for a single-column
 * page. A column start is a left edge in the middle of the page where several
 * runs begin, that text from the left side (almost) never runs across, and
 * with a fair share of the text on each side. A run may overhang the edge
 * slightly.
 */
export function findGutter(runs: TextRun[], pageWidth: number): number | null {
  if (runs.length < 10) return null;
  const OVERHANG = 0.5;
  const chars = (rs: TextRun[]) => rs.reduce((n, r) => n + r.text.trim().length, 0);
  const total = chars(runs);
  const edgeCounts = new Map<number, number>();
  for (const r of runs) {
    const edge = Math.round(r.x * 10) / 10;
    edgeCounts.set(edge, (edgeCounts.get(edge) ?? 0) + 1);
  }
  const candidates = [...edgeCounts.entries()]
    .filter(([edge, count]) => count >= 3 && edge >= pageWidth * 0.2 && edge <= pageWidth * 0.7)
    .map(([edge]) => edge)
    .sort((x, y) => x - y);

  const allowedCrossing = Math.max(1, Math.floor(runs.length * 0.05));
  for (const edge of candidates) {
    const left = runs.filter((r) => r.x < edge - 0.05);
    const right = runs.filter((r) => r.x >= edge - 0.05);
    const crossing = left.filter((r) => r.x + r.width > edge + OVERHANG).length;
    if (crossing > allowedCrossing) continue;
    // Both sides must hold real text. A column of right-aligned dates in a
    // one-column resume is mostly short runs, so it fails the character share.
    if (chars(left) < total * 0.2 || chars(right) < total * 0.2) continue;
    return edge - 0.05;
  }
  return null;
}

/** Lays out one page's text runs as reading-order text. */
export function layoutPage(runs: TextRun[], pageWidth: number): string {
  const gutter = findGutter(runs, pageWidth);
  if (gutter === null) return linesOf(runs).join("\n");
  const left = runs.filter((r) => r.x < gutter);
  const right = runs.filter((r) => r.x >= gutter);
  return `${linesOf(left).join("\n")}\n\n${linesOf(right).join("\n")}`;
}

// Word and many templates draw bullets with Symbol/Wingdings glyphs in the
// Unicode private-use area. Built from char codes to keep the source ASCII.
const PRIVATE_USE = new RegExp(`[${String.fromCharCode(0xe000)}-${String.fromCharCode(0xf8ff)}]`, "g");

/** Layout constants are in units of 16 PDF points (1/4.5 inch). */
const UNIT = 16;

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const task = getDocument({ data: new Uint8Array(buffer) });
  try {
    const doc = await task.promise;
    const pages: string[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const [, , width, height] = page.view;
      const content = await page.getTextContent();
      const runs: TextRun[] = [];
      for (const item of content.items) {
        if (!("str" in item) || item.str.trim() === "") continue;
        runs.push({
          x: item.transform[4] / UNIT,
          y: (height - item.transform[5]) / UNIT,
          width: item.width / UNIT,
          text: item.str.replace(PRIVATE_USE, "•"),
        });
      }
      pages.push(layoutPage(runs, width / UNIT));
    }
    return pages.join("\n\n");
  } finally {
    await task.destroy();
  }
}
