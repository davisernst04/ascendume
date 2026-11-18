// The LLM judgment pass: prompt, output schema, and validation of what the
// model returns. The model may only report findings for LLM-kind criteria and
// must cite an id we gave it; anything else is dropped.
import { z } from "zod";
import type { ResumeData } from "@/lib/resume-context";
import type { Bullet } from "@/lib/review/bullets";
import type { Finding } from "@/lib/review/findings";
import { CRITERIA, LLM_CRITERION_IDS, getCriterion, isCriterionId } from "@/lib/review/rubric";

// No .default() or .optional(): OpenAI structured output needs every field required.
export const llmReviewSchema = z.object({
  findings: z.array(
    z.object({
      criterionId: z.enum(LLM_CRITERION_IDS),
      targetId: z
        .string()
        .describe('A bullet id from the list, or "summary" / "skills" for relevance.supports'),
      detail: z
        .string()
        .describe("One sentence, at most 25 words, naming the specific problem in this item"),
    })
  ),
});

export type LlmReviewOutput = z.infer<typeof llmReviewSchema>;

const RESUME_LEVEL_TARGETS = {
  summary: { kind: "field", section: "personal", label: "Summary" },
  skills: { kind: "field", section: "skills", label: "Skills" },
} as const;

export function buildReviewPrompt(data: ResumeData, bullets: Bullet[]): string {
  const llmCriteria = CRITERIA.filter((c) => c.kind === "llm")
    .map((c) => `- ${c.id} (${c.scope === "bullet" ? "cite a bullet id" : 'cite "summary" or "skills"'}): ${c.check}. ${c.reason}`)
    .join("\n");

  const bulletList = bullets.map((b) => `[${b.id}] (${b.entryLabel}) ${b.text}`).join("\n") || "(no bullets)";
  const skills = data.skills
    .filter((c) => c.items.trim())
    .map((c) => (c.label ? `${c.label}: ${c.items}` : c.items))
    .join("\n");

  return `You review resumes for students and new graduates. Judge ONLY these criteria:
${llmCriteria}

Rules:
- Report only clear problems. A strong bullet gets no finding. Returning no findings is fine.
- Every finding must cite exactly one id from the lists below. Do not invent ids.
- Do not flag missing numbers, verb choice, length, dates or formatting: other checks cover those.
- Never suggest specific numbers, tools, or claims that are not already in the resume.
- Write each detail to the student, plainly, saying what is missing or unclear in that item.

Bullets:
${bulletList}

[summary] ${data.personalInfo.summary.trim() || "(none)"}

[skills]
${skills || "(none)"}`;
}

/** Keeps only findings for LLM criteria that cite a real target, mapped to the panel's target shape. */
export function validateLlmFindings(output: LlmReviewOutput, bullets: Bullet[]): Finding[] {
  const bulletIds = new Set(bullets.map((b) => b.id));
  const seen = new Set<string>();
  const findings: Finding[] = [];

  for (const f of output.findings) {
    if (!isCriterionId(f.criterionId)) continue;
    const criterion = getCriterion(f.criterionId);
    if (criterion.kind !== "llm") continue;

    const key = `${f.criterionId}|${f.targetId}`;
    if (seen.has(key)) continue;

    let target: Finding["target"] | null = null;
    if (criterion.scope === "bullet" && bulletIds.has(f.targetId)) {
      target = { kind: "bullet", bulletId: f.targetId };
    } else if (criterion.scope === "resume" && f.targetId in RESUME_LEVEL_TARGETS) {
      target = RESUME_LEVEL_TARGETS[f.targetId as keyof typeof RESUME_LEVEL_TARGETS];
    }
    if (!target) continue;

    seen.add(key);
    findings.push({ criterionId: f.criterionId, target, detail: f.detail.trim() });
  }
  return findings;
}
