// The rewrite engine shared by "ask for a number" and the guided interview.
// Both write only from what the user typed, and every output is checked for
// numbers the user never gave before it is returned as a proposal.
import { generateText, Output } from "ai";
import { z } from "zod";
import { rewriteModel } from "@/lib/ai/models";
import { inventedNumbers } from "@/lib/ai/fabrication";
import type { InterviewAnswers } from "@/lib/ai/questions";

const RULES = `Hard rules:
- Use ONLY facts stated in the material below. Never add a number, metric, tool, outcome, team size, or claim that isn't there.
- If the material doesn't say what changed, describe what was done; do not invent a result.
- Start with a strong action verb, in TENSE tense. No "I", "my", or "we".
- One to two lines: at most 200 characters.
- Plain, specific language. No buzzwords ("synergy", "leveraged", "spearheaded cutting-edge").`;

function rules(current: boolean) {
  return RULES.replace("TENSE", current ? "present" : "past");
}

export class FabricationError extends Error {
  constructor() {
    super("The AI kept adding numbers you didn't give, so nothing was changed. Try rewording your answer.");
  }
}

/** Runs `attempt`; if the output invents numbers, retries once with a correction, then gives up. */
async function withoutInventedNumbers<T>(
  attempt: (correction: string) => Promise<T>,
  textsOf: (result: T) => string[],
  sources: string[]
): Promise<T> {
  let correction = "";
  for (let tries = 0; tries < 2; tries++) {
    const result = await attempt(correction);
    const invented = textsOf(result).flatMap((t) => inventedNumbers(t, sources));
    if (invented.length === 0) return result;
    correction = `\n\nYour previous answer used numbers that are not in the material (${[...new Set(invented)].join(", ")}). Remove them.`;
  }
  throw new FabricationError();
}

export interface NumberRewriteInput {
  bullet: string;
  /** "Software Intern, Acme" — context only, never copied in. */
  context: string;
  question: string;
  answer: string;
  current: boolean;
}

/** Rewrites one bullet to include the measurable outcome the user just supplied. */
export async function rewriteWithNumber(input: NumberRewriteInput): Promise<string> {
  const keepPeriod = input.bullet.trim().endsWith(".");
  const { text } = await withoutInventedNumbers(
    async (correction) => {
      const { output } = await generateText({
        model: rewriteModel(),
        output: Output.object({ schema: z.object({ text: z.string() }) }),
        prompt: `Rewrite this resume bullet so it includes the outcome the student describes in their answer.
${rules(input.current)}
- Keep the bullet's meaning; change only what's needed to work the answer in.
- ${keepPeriod ? "End with a period." : "Do not end with a period."}

Role (context only): ${input.context}
Bullet: ${input.bullet}
Question asked: ${input.question}
Student's answer: ${input.answer}${correction}`,
      });
      return output;
    },
    (r) => [r.text],
    [input.bullet, input.answer]
  );
  return text.trim();
}

export interface DraftInput {
  kind: "experience" | "project";
  /** Position and company, or the project name — context only. */
  heading: string;
  answers: InterviewAnswers;
  current: boolean;
}

/** Drafts 1–4 bullets for a job or project from the interview answers. */
export async function draftBullets(input: DraftInput): Promise<string[]> {
  const a = input.answers;
  const material = [
    a.role && `Role: ${a.role}`,
    `What they did: ${a.did}`,
    a.result && `What changed: ${a.result}`,
    a.tools && `Tools / methods: ${a.tools}`,
  ]
    .filter(Boolean)
    .join("\n");

  const { bullets } = await withoutInventedNumbers(
    async (correction) => {
      const { output } = await generateText({
        model: rewriteModel(),
        output: Output.object({ schema: z.object({ bullets: z.array(z.string()) }) }),
        prompt: `Write resume bullets for a student or new grad from their own answers below. Class projects, hackathons, clubs and labs are real experience: write them with the same care as a job.
${rules(input.current)}
- Write 1 to 4 bullets; fewer is better than padding. Each bullet covers a different thing they did.
- Credit the student only with what they say they did themselves. If they worked with others, describe their own part, or say "with a teammate" / "on a team of N" when they gave that.
- Do not end bullets with a period.

${input.kind === "experience" ? "Job" : "Project"} (context only): ${input.heading || "(untitled)"}
${material}${correction}`,
      });
      return output;
    },
    (r) => r.bullets,
    [a.role, a.did, a.result, a.tools, input.heading]
  );
  return bullets.map((b) => b.replace(/^[•\-*]\s*/, "").trim()).filter(Boolean).slice(0, 4);
}
