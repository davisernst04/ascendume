// Daily AI caps, counted in the database per user and UTC day.
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { aiUsage } from "@/lib/db/schema";

export type AiUsageKind = "review" | "rewrite" | "import";

export const DAILY_LIMITS: Record<AiUsageKind, number> = {
  review: 3, // full AI reviews
  rewrite: 30, // bullet rewrites and interview drafts
  import: 5, // PDF uploads parsed by the AI
};

export const LIMIT_MESSAGES: Record<AiUsageKind, string> = {
  review: `You've used today's ${DAILY_LIMITS.review} AI reviews. The automatic checks still work, and the AI review resets at midnight UTC.`,
  rewrite: `You've used today's ${DAILY_LIMITS.rewrite} AI rewrites. They reset at midnight UTC.`,
  import: `You've imported ${DAILY_LIMITS.import} resumes today. Imports reset at midnight UTC.`,
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Atomically takes one use of `kind` for today. Returns false (and takes
 * nothing) if the user is already at the limit.
 */
export async function takeAiUse(userId: string, kind: AiUsageKind): Promise<boolean> {
  const rows = await getDb()
    .insert(aiUsage)
    .values({ userId, day: today(), kind, count: 1 })
    .onConflictDoUpdate({
      target: [aiUsage.userId, aiUsage.day, aiUsage.kind],
      set: { count: sql`${aiUsage.count} + 1` },
      setWhere: sql`${aiUsage.count} < ${DAILY_LIMITS[kind]}`,
    })
    .returning({ count: aiUsage.count });
  return rows.length > 0;
}

/** Gives a use back when the AI call failed, so errors don't eat into the cap. */
export async function refundAiUse(userId: string, kind: AiUsageKind): Promise<void> {
  try {
    await getDb()
      .update(aiUsage)
      .set({ count: sql`greatest(${aiUsage.count} - 1, 0)` })
      .where(and(eq(aiUsage.userId, userId), eq(aiUsage.day, today()), eq(aiUsage.kind, kind)));
  } catch (error) {
    console.error("Failed to refund AI use:", error);
  }
}
