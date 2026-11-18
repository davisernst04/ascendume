import { test } from "node:test";
import assert from "node:assert/strict";
import type { ResumeData } from "@/lib/resume-context";
import { dateFormat, runDeterministicChecks } from "@/lib/review/deterministic";
import { scoreReview } from "@/lib/review/findings";
import { verbTense } from "@/lib/review/verbs";
import type { CriterionId } from "@/lib/review/rubric";

function resume(overrides: Partial<ResumeData> = {}): ResumeData {
  return {
    title: "Test",
    personalInfo: {
      fullName: "Sam Lee",
      email: "sam@example.com",
      phone: "",
      location: "",
      summary: "",
      website: "",
      linkedin: "",
      github: "",
    },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    ...overrides,
  };
}

function job(bullets: string[], extra: Partial<ResumeData["experience"][number]> = {}) {
  return {
    id: "j1",
    company: "Acme",
    position: "Intern",
    location: "",
    startDate: "Jan 2024",
    endDate: "May 2024",
    current: false,
    bullets: bullets.map((b) => `• ${b}`).join("\n"),
    ...extra,
  };
}

function ids(data: ResumeData, pageCount: number | null = 1): CriterionId[] {
  return runDeterministicChecks({ data, pageCount }).findings.map((f) => f.criterionId);
}

const GOOD = "Built a scheduling tool in React used by 40 tutors, cutting booking time by 30%";

test("a strong bullet passes every bullet check", () => {
  assert.deepEqual(ids(resume({ experience: [job([GOOD])] })), []);
});

test("bullet without a number is flagged for impact", () => {
  assert.deepEqual(ids(resume({ experience: [job(["Built a scheduling tool in React for the campus tutoring center"])] })), [
    "impact.measurable",
  ]);
});

test("duty phrasing fails both action verb and weak phrasing", () => {
  const found = ids(resume({ experience: [job(["Responsible for maintaining 3 internal dashboards for the sales team"])] }));
  assert.ok(found.includes("language.action-verb"));
  assert.ok(found.includes("language.weak-phrasing"));
});

test("present tense in a finished role is flagged; in a current role it is not", () => {
  const bullet = "Build data pipelines in Python processing 2M events per day for analytics";
  assert.ok(ids(resume({ experience: [job([bullet])] })).includes("consistency.tense"));
  assert.ok(!ids(resume({ experience: [job([bullet], { current: true, endDate: "" })] })).includes("consistency.tense"));
});

test("verb tense classification", () => {
  assert.equal(verbTense("built"), "past");
  assert.equal(verbTense("optimized"), "past");
  assert.equal(verbTense("led"), "past");
  assert.equal(verbTense("build"), "present");
  assert.equal(verbTense("manages"), "present");
  assert.equal(verbTense("responsible"), null);
  assert.equal(verbTense("i"), null);
});

test("bullet length bounds", () => {
  assert.ok(ids(resume({ experience: [job(["Fixed 3 bugs"])] })).includes("clarity.length"));
  assert.ok(ids(resume({ experience: [job([`${GOOD}. ${GOOD}. ${GOOD}`])] })).includes("clarity.length"));
});

test("mixed date formats are flagged; seasons and Present mix freely", () => {
  assert.equal(dateFormat("Jan 2024"), "Jan 2025");
  assert.equal(dateFormat("January 2024"), "January 2025");
  assert.equal(dateFormat("Summer 2024"), null);
  assert.equal(dateFormat("Present"), null);
  assert.equal(dateFormat("Expected Dec 2026"), "Jan 2025");

  const mixed = resume({ experience: [job([GOOD], { startDate: "01/2024", endDate: "May 2024" })], education: [{ id: "e1", institution: "State U", degree: "BS", field: "CS", gpa: "", graduationDate: "December 2026" }] });
  assert.ok(ids(mixed).includes("consistency.dates"));

  const fine = resume({ experience: [job([GOOD], { startDate: "Summer 2024", endDate: "Aug 2024" })] });
  assert.ok(!ids(fine).includes("consistency.dates"));
});

test("mixed trailing periods are flagged once for the resume", () => {
  const found = ids(resume({ experience: [job([`${GOOD}.`, GOOD])] }));
  assert.equal(found.filter((f) => f === "consistency.punctuation").length, 1);
});

test("missing contact info and entry dates", () => {
  const data = resume({
    personalInfo: { ...resume().personalInfo, fullName: "", email: "not-an-email" },
    experience: [job([GOOD], { startDate: "", endDate: "" })],
    education: [{ id: "e1", institution: "State U", degree: "BS", field: "CS", gpa: "", graduationDate: "" }],
  });
  const found = ids(data);
  assert.equal(found.filter((f) => f === "completeness.contact").length, 2);
  assert.equal(found.filter((f) => f === "completeness.entry-dates").length, 2);
});

test("emoji and links without a scheme are flagged; accents and dashes are fine", () => {
  const data = resume({
    personalInfo: { ...resume().personalInfo, fullName: "José Núñez", linkedin: "linkedin.com/in/jose", github: "https://github.com/jose" },
    experience: [job(["Built a tutoring app – used by 40 students 🚀 weekly"])],
  });
  const findings = runDeterministicChecks({ data, pageCount: 1 }).findings;
  const chars = findings.filter((f) => f.criterionId === "ats.characters");
  assert.equal(chars.length, 1);
  assert.match(chars[0].detail, /🚀/);
  const links = findings.filter((f) => f.criterionId === "ats.links");
  assert.equal(links.length, 1);
  assert.deepEqual(links[0].target, { kind: "field", section: "personal", label: "LinkedIn" });
});

test("page count: flagged over one page, unchecked when unknown", () => {
  assert.ok(ids(resume(), 2).includes("length.one-page"));
  const unknown = runDeterministicChecks({ data: resume(), pageCount: null });
  assert.ok(!unknown.checked.has("length.one-page"));
});

test("scoring: bullet criteria score by share of bullets; unchecked criteria are ignored", () => {
  const data = resume({ experience: [job([GOOD, "Built a scheduling tool in React for the campus tutoring center"])] });
  const r = runDeterministicChecks({ data, pageCount: 1 });
  const { categories, overall } = scoreReview({ findings: r.findings, checked: r.checked, bulletCount: r.bullets.length, entryCount: r.entryCount });
  const impact = categories.find((c) => c.category === "impact")!;
  assert.equal(impact.score, 50); // 1 of 2 bullets measurable; impact.result (LLM) not checked
  assert.equal(categories.find((c) => c.category === "relevance")!.score, null);
  assert.ok(overall !== null && overall < 100);
});

test("LLM findings: only LLM criteria citing real targets survive", async () => {
  const { validateLlmFindings } = await import("@/lib/review/llm");
  const { extractBullets } = await import("@/lib/review/bullets");
  const bullets = extractBullets(resume({ experience: [job([GOOD])] }));
  const kept = validateLlmFindings(
    {
      findings: [
        { criterionId: "impact.result", targetId: bullets[0].id, detail: "ok" },
        { criterionId: "impact.result", targetId: bullets[0].id, detail: "duplicate" },
        { criterionId: "impact.result", targetId: "experience:nope:0", detail: "made-up id" },
        { criterionId: "clarity.standalone", targetId: "summary", detail: "wrong scope" },
        { criterionId: "relevance.supports", targetId: "skills", detail: "ok" },
        // A deterministic criterion slipped past the schema
        { criterionId: "impact.measurable" as "impact.result", targetId: bullets[0].id, detail: "not allowed" },
      ],
    },
    bullets
  );
  assert.deepEqual(
    kept.map((f) => [f.criterionId, f.detail]),
    [
      ["impact.result", "ok"],
      ["relevance.supports", "ok"],
    ]
  );
});
