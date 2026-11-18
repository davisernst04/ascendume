import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/auth";
import { LIMIT_MESSAGES, refundAiUse, takeAiUse } from "@/lib/ai/usage";
import { draftBullets, FabricationError, rewriteWithNumber } from "@/lib/ai/rewrite";

export const maxDuration = 60;

const text = (max: number) => z.string().trim().max(max);

const requestSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("add-number"),
    bullet: text(500).min(1),
    context: text(300),
    question: text(300),
    answer: text(500).min(1),
    current: z.boolean(),
  }),
  z.object({
    mode: z.literal("draft"),
    kind: z.enum(["experience", "project"]),
    heading: text(300),
    current: z.boolean(),
    answers: z.object({
      role: text(500),
      did: text(1500).min(1),
      result: text(1000),
      tools: text(500),
    }),
  }),
]);

// POST /api/ai/rewrite — returns a proposal; the client shows it as a diff to accept or reject.
export async function POST(req: NextRequest) {
  const session = await getServerSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to use AI rewrites" }, { status: 401 });
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "AI rewrites are not available yet" }, { status: 503 });
  }

  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const userId = session.user.id;
  if (!(await takeAiUse(userId, "rewrite"))) {
    return NextResponse.json({ error: LIMIT_MESSAGES.rewrite }, { status: 429 });
  }

  try {
    const body = parsed.data;
    if (body.mode === "add-number") {
      const proposal = await rewriteWithNumber(body);
      return NextResponse.json({ proposal });
    }
    const bullets = await draftBullets(body);
    return NextResponse.json({ bullets });
  } catch (error) {
    await refundAiUse(userId, "rewrite");
    if (error instanceof FabricationError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("Rewrite error:", error);
    return NextResponse.json({ error: "The rewrite failed. Try again." }, { status: 500 });
  }
}
