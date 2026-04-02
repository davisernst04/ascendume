import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const resumeData = await req.json();

    // 1. Generate LaTeX using OpenAI
    const { text: latexString } = await generateText({
      model: openai("gpt-4o"),
      system: `You are an expert LaTeX formatter and resume writer. 
You will be provided with structured resume data. 
Your task is to output a single, complete LaTeX document that perfectly follows the classic "Jake's Resume" template (which is a popular, clean, single-page professional resume template).
Ensure you escape special LaTeX characters (like %, &, $, #, _, {, }, ~, ^, \\) in the content.
Enhance the bullet points slightly for maximum impact and professional tone, ensuring they begin with strong action verbs.
DO NOT wrap the output in markdown code blocks. OUTPUT ONLY THE RAW LATEX STRING.`,
      prompt: `Generate the LaTeX for this resume data:
${JSON.stringify(resumeData, null, 2)}

Requirements for the LaTeX document:
- Use \\documentclass[letterpaper,11pt]{article}
- Include necessary packages: latexsym, fullpage, titlesec, marvosym, color, verbatim, enumitem, hyperref, fancyhdr, babel.
- Margins should be tight (e.g. 0.5in) to fit on one page.
- Section titles should use uppercase letters and a horizontal rule below.
- Handle missing fields gracefully (e.g. if no github URL, don't show the icon/link).
- The document must compile perfectly.
`,
    });

    // Strip markdown code blocks if the model ignored the system prompt
    const cleanedLatex = latexString.replace(/^```(latex)?\n/, '').replace(/```$/, '').trim();

    // 2. Compile to PDF using a free public LaTeX compilation API
    // We'll use latexonline.cc or a similar service.
    // Note: In production, setting up a microservice with texlive/tectonic is highly recommended.
    const compileResponse = await fetch("https://latexonline.cc/compile?command=pdflatex", {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: cleanedLatex,
    });

    if (!compileResponse.ok) {
      console.error("LaTeX Compilation Failed", await compileResponse.text());
      throw new Error("Failed to compile LaTeX to PDF");
    }

    const pdfBuffer = await compileResponse.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${resumeData.title || "resume"}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Export Error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
