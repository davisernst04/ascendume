import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { extractPdfText } from "@/lib/pdf-text";

// JohnDoe.pdf is a LaTeX resume: its words are separated by positioning, not space glyphs.
test("keeps word spaces and cell order from a LaTeX PDF", async () => {
  const text = await extractPdfText(readFileSync("public/JohnDoe.pdf"));
  const lines = text.split("\n");
  assert.equal(lines[0], "John Doe");
  assert.ok(lines.includes("Massachusetts Institute of Technology | Cambridge, MA"));
  assert.ok(lines.some((l) => l.startsWith("• Architected distributed training infrastructure serving 2,000+ researchers")));
});
