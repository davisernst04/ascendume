import { test } from "node:test";
import assert from "node:assert/strict";
import { inventedNumbers, numbersIn } from "@/lib/ai/fabrication";
import { replaceBullet, formatBullets } from "@/lib/bullet-text";
import { diffWords } from "@/lib/text-diff";
import { questionFor } from "@/lib/ai/questions";

test("numbers are normalized", () => {
  assert.deepEqual([...numbersIn("Cut load time 1,200ms to 300ms (75%) for 3.50k users")].sort(), ["1200", "3.5", "300", "75"]);
});

test("a rewrite may only use numbers from the original or the answer", () => {
  const original = "Built a tutoring scheduler for the campus center";
  const answer = "about 40 tutors, saved maybe 5 hours a week";
  assert.deepEqual(inventedNumbers("Built a scheduler used by 40 tutors, saving 5 hours weekly", [original, answer]), []);
  assert.deepEqual(inventedNumbers("Built a scheduler used by 40 tutors, cutting booking time 30%", [original, answer]), ["30"]);
});

test("replaceBullet swaps one bullet and keeps its marker", () => {
  const raw = "• First bullet\n\n- Second bullet\n• Third";
  assert.equal(replaceBullet(raw, 1, "Second bullet", "New second"), "• First bullet\n\n- New second\n• Third");
});

test("replaceBullet refuses when the bullet changed meanwhile", () => {
  assert.equal(replaceBullet("• Edited text", 0, "Original text", "Rewrite"), null);
  assert.equal(replaceBullet("• Only one", 3, "Only one", "Rewrite"), null);
});

test("formatBullets", () => {
  assert.equal(formatBullets([" Built X ", "Led Y"]), "• Built X\n• Led Y");
});

test("word diff marks additions and removals", () => {
  const parts = diffWords("Built a scheduler", "Built a scheduler used by 40 tutors");
  assert.deepEqual(parts.map((p) => p.type), ["same", "added"]);
  assert.equal(parts[1].text, " used by 40 tutors");
  const swap = diffWords("Helped build an app", "Built an app");
  assert.ok(swap.some((p) => p.type === "removed" && p.text.includes("Helped")));
  assert.ok(swap.some((p) => p.type === "added" && p.text.includes("Built")));
});

test("number questions are targeted to the bullet", () => {
  assert.match(questionFor("Tutored first-year students in calculus"), /students/);
  assert.match(questionFor("Led the robotics club's outreach team"), /people/);
  assert.match(questionFor("Optimized the image pipeline"), /how much|%/i);
  assert.match(questionFor("Built a Discord bot for course announcements"), /people|users/);
});

test("import check: rewritten bullets are caught, wrapped and hyphenated ones are not", async () => {
  const { alteredBullets, importInventedNumbers } = await import("@/lib/resume-import");
  const source = "• Migrate 14 legacy cron jobs to a queued worker\nsystem using Redis\n• Built a dash-\nboard in React";
  assert.deepEqual(alteredBullets(["Migrate 14 legacy cron jobs to a queued worker system using Redis", "Built a dashboard in React"], source), []);
  assert.deepEqual(alteredBullets(["Migrated 14 legacy cron jobs to a queued worker system using Redis."], source), [
    "Migrated 14 legacy cron jobs to a queued worker system using Redis.",
  ]);
  assert.deepEqual(importInventedNumbers(["Cut costs 30%", "Migrate 14 jobs"], source), ["30"]);
});

test("pdf layout: two columns are read one after the other; one column stays in line order", async () => {
  const { layoutPage, findGutter } = await import("@/lib/pdf-text");
  const run = (x: number, y: number, text: string, width = text.length * 0.3) => ({ x, y, width, text });
  const sidebar = Array.from({ length: 8 }, (_, i) => run(1, 2 + i, `Sidebar item number ${i}`, 7));
  const main = Array.from({ length: 8 }, (_, i) => run(10, 2 + i, `Main column bullet text number ${i} with more words`, 20));
  const twoCol = layoutPage([...main, ...sidebar], 37);
  assert.ok(twoCol.indexOf("Sidebar item number 7") < twoCol.indexOf("Main column bullet text number 0"));
  // One column with right-aligned dates: titles and dates stay on the same line.
  const oneCol = [
    ...Array.from({ length: 8 }, (_, i) => run(2, 2 + i * 2, `Job title and company name ${i}`, 10)),
    ...Array.from({ length: 8 }, (_, i) => run(30, 2 + i * 2, "May 2025", 3)),
    ...Array.from({ length: 8 }, (_, i) => run(2.5, 3 + i * 2, `• A bullet that runs most of the way across the page ${i}`, 30)),
  ];
  assert.equal(findGutter(oneCol, 37), null);
  assert.match(layoutPage(oneCol, 37), /Job title and company name 0 \| May 2025/);
});

test("pdf layout: a wrapped bullet is joined; the next bullet is not", async () => {
  const { layoutPage } = await import("@/lib/pdf-text");
  const text = layoutPage(
    [
      { x: 2, y: 2, width: 25, text: "• Redesigned a bracket, reducing weight by" },
      { x: 2.6, y: 3, width: 10, text: "18% while passing load checks" },
      { x: 2, y: 4, width: 20, text: "• Wrote work instructions" },
    ],
    37
  );
  assert.equal(text, "• Redesigned a bracket, reducing weight by 18% while passing load checks\n• Wrote work instructions");
});

test("number question for 'Added …' bullets asks about users, not the fallback", () => {
  assert.match(questionFor("Added email notifications for ride requests"), /people used it|time or work/);
});
