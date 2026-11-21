import type { ResumeSection } from "@/lib/review/bullets";
import type { BodySection } from "@/lib/section-order";
import { CATEGORIES, CRITERIA, type Category, type CriterionId, getCriterion } from "@/lib/review/rubric";

/** No overall score below this many bullets: a nearly empty resume would otherwise score high. */
export const MIN_BULLETS_FOR_SCORE = 3;

/** What a finding is about, so the panel can quote it and send the user to fix it. */
export type FindingTarget =
  | { kind: "bullet"; bulletId: string }
  | { kind: "entry"; section: ResumeSection; entryId: string; label: string }
  | { kind: "field"; section: ResumeSection; label: string }
  | { kind: "resume" };

export interface Finding {
  criterionId: CriterionId;
  target: FindingTarget;
  /** The specific problem in this case, e.g. `Starts with "Responsible".` */
  detail: string;
  /** A one-click fix for section order: put `section` directly above `above`. */
  reorder?: { section: BodySection; above: BodySection };
}

export interface CategoryScore {
  category: Category;
  label: string;
  /** 0–100, or null when none of the category's criteria were checked. */
  score: number | null;
  findings: Finding[];
}

export interface ScoreInput {
  findings: Finding[];
  /** Criteria that actually ran. LLM criteria are absent for guests; length is absent if the page count is unknown. */
  checked: ReadonlySet<CriterionId>;
  bulletCount: number;
  entryCount: number;
}

function findingKey(f: Finding): string {
  const t = f.target;
  switch (t.kind) {
    case "bullet":
      return t.bulletId;
    case "entry":
      return t.entryId;
    case "field":
      return `${t.section}:${t.label}`;
    case "resume":
      return "resume";
  }
}

/** Share (0–1) of items that pass one criterion, or null if there was nothing to check. */
function criterionPassRate(id: CriterionId, findings: Finding[], input: ScoreInput): number | null {
  const own = findings.filter((f) => f.criterionId === id);
  const flagged = new Set(own.map(findingKey)).size;
  const { scope } = getCriterion(id);
  if (scope === "bullet") {
    if (input.bulletCount === 0) return null;
    return Math.max(0, 1 - flagged / input.bulletCount);
  }
  if (scope === "entry") {
    if (input.entryCount === 0) return null;
    return Math.max(0, 1 - flagged / input.entryCount);
  }
  return flagged === 0 ? 1 : 0;
}

export function scoreReview(input: ScoreInput): { categories: CategoryScore[]; overall: number | null } {
  const categories = CATEGORIES.map(({ id, label }) => {
    const rates = CRITERIA.filter((c) => c.category === id && input.checked.has(c.id))
      .map((c) => criterionPassRate(c.id, input.findings, input))
      .filter((r): r is number => r !== null);
    const score = rates.length ? Math.round((100 * rates.reduce((a, b) => a + b, 0)) / rates.length) : null;
    const findings = input.findings.filter((f) => getCriterion(f.criterionId).category === id);
    return { category: id, label, score, findings };
  });
  const scored = categories.map((c) => c.score).filter((s): s is number => s !== null);
  const overall =
    scored.length && input.bulletCount >= MIN_BULLETS_FOR_SCORE
      ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length)
      : null;
  return { categories, overall };
}
