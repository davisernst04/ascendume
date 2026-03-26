import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

export const maxDuration = 30;

const PROMPTS = {
  bullets: `You are a professional resume writer. Enhance the following bullet points to be more impactful and achievement-oriented. Use strong action verbs and quantify results where possible. Maintain a professional tone. Return ONLY the enhanced bullet points, one per line, each starting with a bullet point (•).`,
  
  summary: `You are a professional resume writer. Rewrite the following professional summary to be more compelling and highlight key achievements. Keep it concise (2-4 sentences). Return ONLY the rewritten summary.`,
  
  description: `You are a professional resume writer. Enhance the following project or role description to be more compelling and highlight key achievements. Keep it concise and professional. Return ONLY the enhanced description.`,
};

interface RequestBody {
  text: string;
  type: "bullets" | "summary" | "description";
}

export async function POST(req: Request) {
  try {
    const { text, type }: RequestBody = await req.json();

    if (!text || !type) {
      return new Response(JSON.stringify({ error: "Missing text or type" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = PROMPTS[type] || PROMPTS.description;

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: text,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("AI enhancement error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to enhance text" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}