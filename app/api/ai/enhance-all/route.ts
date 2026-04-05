// app/api/ai/enhance-all/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { ResumeData } from "@/lib/resume-context";

export const maxDuration = 60;

const enhancedSchema = z.object({
  summary: z
    .string()
    .describe("Rewritten professional summary, 2-4 sentences, compelling and concise"),
  experience: z.array(
    z.object({
      id: z.string(),
      bullets: z
        .string()
        .describe(
          "Enhanced bullet points, newline-separated, each starting with • and an action verb"
        ),
    })
  ),
  projects: z.array(
    z.object({
      id: z.string(),
      description: z.string().describe("Enhanced one-sentence project description"),
    })
  ),
});

export async function POST(req: NextRequest) {
  try {
    const data: ResumeData = await req.json();

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: enhancedSchema,
      prompt: `You are a professional resume writer. Enhance the following resume content to be more impactful, achievement-oriented, and ATS-friendly.

Rules:
- Use strong action verbs for all bullet points
- Quantify achievements where plausible (add realistic numbers/percentages)
- Keep each bullet to one punchy sentence, starting with •
- Keep the summary to 2-4 sentences
- Do NOT change IDs — return every experience and project entry with its original ID
- Do NOT alter names, company names, job titles, dates, or skills

Resume content:
${JSON.stringify(
  {
    summary: data.personalInfo.summary,
    experience: data.experience.map((e) => ({
      id: e.id,
      position: e.position,
      company: e.company,
      bullets: e.bullets,
    })),
    projects: data.projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
    })),
  },
  null,
  2
)}`,
    });

    const enhanced: ResumeData = {
      ...data,
      personalInfo: {
        ...data.personalInfo,
        summary: object.summary,
      },
      experience: data.experience.map((exp) => {
        const found = object.experience.find((e) => e.id === exp.id);
        return found ? { ...exp, bullets: found.bullets } : exp;
      }),
      projects: data.projects.map((proj) => {
        const found = object.projects.find((p) => p.id === proj.id);
        return found ? { ...proj, description: found.description } : proj;
      }),
    };

    return NextResponse.json(enhanced);
  } catch (error) {
    console.error("Enhance-all error:", error);
    return NextResponse.json(
      { error: "Failed to enhance resume" },
      { status: 500 }
    );
  }
}
