// The review rubric, as data. Deterministic criteria are checked in the browser
// (lib/review/deterministic.ts); LLM criteria are judgment calls made by
// app/api/review/route.ts, which may only return findings for LLM-kind
// criteria and must cite what each finding is about.

export type Category =
  | "impact"
  | "language"
  | "clarity"
  | "length"
  | "consistency"
  | "completeness"
  | "ats"
  | "relevance";

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "impact", label: "Impact" },
  { id: "language", label: "Language" },
  { id: "clarity", label: "Clarity" },
  { id: "length", label: "Length" },
  { id: "consistency", label: "Consistency" },
  { id: "completeness", label: "Completeness" },
  { id: "ats", label: "ATS-safety" },
  { id: "relevance", label: "Relevance" },
];

/**
 * What a criterion is measured over, which decides how it is scored:
 * - bullet: share of bullets that pass
 * - entry: share of entries (jobs, schools) that pass
 * - resume: passes or fails as a whole
 */
export type Scope = "bullet" | "entry" | "resume";

export type Kind = "deterministic" | "llm";

export interface Criterion {
  id: string;
  category: Category;
  kind: Kind;
  scope: Scope;
  /** What is checked, in plain words. */
  check: string;
  /** Why it matters, shown to the user next to a finding. */
  reason: string;
}

export const CRITERIA = [
  {
    id: "impact.measurable",
    category: "impact",
    kind: "deterministic",
    scope: "bullet",
    check: "Bullet has a measurable outcome (number, %, scale)",
    reason: "A number shows the size of what you did. Add one only if you know it: users, time saved, % improvement, team size.",
  },
  {
    id: "impact.result",
    category: "impact",
    kind: "llm",
    scope: "bullet",
    check: "Bullet describes a result, not just a duty",
    reason: "Recruiters want to know what changed because of your work, not just what you were assigned.",
  },
  {
    id: "language.action-verb",
    category: "language",
    kind: "deterministic",
    scope: "bullet",
    check: "Bullet starts with an action verb",
    reason: "Leading with a verb like \"Built\" or \"Led\" puts what you did first.",
  },
  {
    id: "language.weak-phrasing",
    category: "language",
    kind: "deterministic",
    scope: "bullet",
    check: "No weak or filler phrasing",
    reason: "Phrases like \"responsible for\" or \"helped with\" hide your part in the work. Say what you did.",
  },
  {
    id: "clarity.length",
    category: "clarity",
    kind: "deterministic",
    scope: "bullet",
    check: "Bullet is one to two lines long",
    reason: "Bullets longer than two lines get skimmed; very short ones don't say enough.",
  },
  {
    id: "clarity.standalone",
    category: "clarity",
    kind: "llm",
    scope: "bullet",
    check: "Bullet is readable on its own",
    reason: "Each bullet should make sense without the others, with no unexplained jargon or acronyms.",
  },
  {
    id: "length.one-page",
    category: "length",
    kind: "deterministic",
    scope: "resume",
    check: "Fits on one page",
    reason: "For students and new grads, one page is the expectation.",
  },
  {
    id: "consistency.dates",
    category: "consistency",
    kind: "deterministic",
    scope: "resume",
    check: "Dates use one format",
    reason: "Mixed date formats look careless. Pick one, like \"Jan 2025\".",
  },
  {
    id: "consistency.tense",
    category: "consistency",
    kind: "deterministic",
    scope: "bullet",
    check: "Past roles use past tense",
    reason: "Work you've finished reads in the past tense: \"Built\", not \"Build\".",
  },
  {
    id: "consistency.punctuation",
    category: "consistency",
    kind: "deterministic",
    scope: "resume",
    check: "Bullets end the same way",
    reason: "Either end every bullet with a period or none of them.",
  },
  {
    id: "completeness.contact",
    category: "completeness",
    kind: "deterministic",
    scope: "resume",
    check: "Name and email are present",
    reason: "A recruiter needs your name and a way to reach you.",
  },
  {
    id: "completeness.entry-dates",
    category: "completeness",
    kind: "deterministic",
    scope: "entry",
    check: "Every job and school has dates",
    reason: "Missing dates make readers guess when, and for how long.",
  },
  {
    id: "completeness.entry-bullets",
    category: "completeness",
    kind: "deterministic",
    scope: "resume",
    check: "Every job and project has bullet points",
    reason: "A job or project with no bullets says where you were, but not what you did there.",
  },
  {
    id: "completeness.substance",
    category: "completeness",
    kind: "deterministic",
    scope: "resume",
    check: "Enough content to review: at least 3 bullets",
    reason: "Most of the review looks at bullets. Add what you did in your jobs, projects, clubs or classes.",
  },
  {
    id: "ats.characters",
    category: "ats",
    kind: "deterministic",
    scope: "resume",
    check: "No characters the template can't render",
    reason: "Emoji, arrows and similar symbols can't be typeset and may break the PDF or confuse applicant tracking systems.",
  },
  {
    id: "ats.links",
    category: "ats",
    kind: "deterministic",
    scope: "resume",
    check: "Links are web addresses",
    reason: "A link that isn't a web address (like a handle or a phrase) can't be clicked in the PDF.",
  },
  {
    id: "relevance.section-order",
    category: "relevance",
    kind: "deterministic",
    scope: "resume",
    check: "The stronger of Experience and Projects comes first",
    reason: "Recruiters skim from the top. With little work history, lead with Projects; once your experience shows more, put Experience first.",
  },
  {
    id: "relevance.supports",
    category: "relevance",
    kind: "llm",
    scope: "resume",
    check: "Summary and skills support the experience shown",
    reason: "Skills and claims in your summary should be backed by something in your experience or projects.",
  },
] as const satisfies readonly Criterion[];

export type CriterionId = (typeof CRITERIA)[number]["id"];

const BY_ID = new Map<string, Criterion>(CRITERIA.map((c) => [c.id, c]));

export function getCriterion(id: CriterionId): Criterion {
  return BY_ID.get(id)!;
}

export function isCriterionId(id: string): id is CriterionId {
  return BY_ID.has(id);
}

export const LLM_CRITERION_IDS = CRITERIA.filter((c) => c.kind === "llm").map((c) => c.id) as [
  CriterionId,
  ...CriterionId[],
];
