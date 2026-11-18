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
