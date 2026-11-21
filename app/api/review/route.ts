import { NextRequest, NextResponse } from "next/server";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getServerSession } from "@/lib/auth";
import { reviewModel } from "@/lib/ai/models";
import { LIMIT_MESSAGES, refundAiUse, takeAiUse } from "@/lib/ai/usage";
import type { ResumeData } from "@/lib/resume-context";
import { extractBullets } from "@/lib/review/bullets";
import { DEFAULT_SECTION_ORDER } from "@/lib/section-order";
import { buildReviewPrompt, llmReviewSchema, validateLlmFindings } from "@/lib/review/llm";

export const maxDuration = 60;

// Lenient: missing or wrong-typed fields become empty, so a malformed body can't crash the review.
const str = z.string().catch("");
const id = z.string().min(1).max(100);
const requestSchema = z.object({
  personalInfo: z.object({ summary: str }).catch({ summary: "" }),
  experience: z
    .array(z.object({ id, company: str, position: str, endDate: str, current: z.boolean().catch(false), bullets: str }))
    .max(30),
  projects: z.array(z.object({ id, name: str, description: str })).max(30),
  skills: z.array(z.object({ label: str, items: str })).max(30).catch([]),
});

// POST /api/review — the LLM judgment pass. Returns findings for LLM-kind criteria only.
export async function POST(req: NextRequest) {
  const session = await getServerSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to use the AI review" }, { status: 401 });
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "The AI review is not available yet" }, { status: 503 });
  }

  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid resume" }, { status: 400 });
  }
  // Only the fields the review reads are passed on; the rest stay empty.
  const data = {
    title: "",
    personalInfo: { fullName: "", email: "", phone: "", location: "", website: "", linkedin: "", github: "", ...parsed.data.personalInfo },
    experience: parsed.data.experience.map((e) => ({ ...e, location: "", startDate: "" })),
    projects: parsed.data.projects.map((p) => ({ ...p, url: "", technologies: "" })),
    skills: parsed.data.skills.map((s, i) => ({ id: String(i), ...s })),
    education: [],
    certifications: [],
    sectionOrder: [...DEFAULT_SECTION_ORDER],
  } satisfies ResumeData;

  const bullets = extractBullets(data);
  if (bullets.length === 0 && !data.personalInfo.summary.trim()) {
    return NextResponse.json({ findings: [] });
  }

  if (!(await takeAiUse(session.user.id, "review"))) {
    return NextResponse.json({ error: LIMIT_MESSAGES.review }, { status: 429 });
  }

  try {
    const { output } = await generateText({
      model: reviewModel(),
      output: Output.object({ schema: llmReviewSchema }),
      prompt: buildReviewPrompt(data, bullets),
    });
    return NextResponse.json({ findings: validateLlmFindings(output, bullets) });
  } catch (error) {
    await refundAiUse(session.user.id, "review");
    console.error("Review error:", error);
    return NextResponse.json({ error: "The AI review failed. Try again." }, { status: 500 });
  }
}
