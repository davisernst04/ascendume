// Server-side: stores an analytics event. Failures are logged, never thrown.
import { getDb } from "@/lib/db";
import { analyticsEvents } from "@/lib/db/schema";
import type { AnalyticsEvent } from "@/lib/analytics/events";

export async function recordEvent(
  event: AnalyticsEvent,
  who: { anonymousId: string; userId?: string | null }
): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  try {
    await getDb().insert(analyticsEvents).values({
      name: event.name,
      props: event.props,
      anonymousId: who.anonymousId,
      userId: who.userId ?? null,
    });
  } catch (error) {
    console.error("Failed to record analytics event:", error);
  }
}
