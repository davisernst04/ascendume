import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/auth";
import { analyticsEventSchema } from "@/lib/analytics/events";
import { recordEvent } from "@/lib/analytics/record";

const bodySchema = z.intersection(
  analyticsEventSchema,
  z.object({ anonymousId: z.uuid().or(z.literal("storage-unavailable")) })
);

// POST /api/events — first-party analytics counts. Only the fixed events in
// lib/analytics/events.ts are accepted; anything else is rejected.
export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 400 });

  const { anonymousId, ...event } = parsed.data;
  const session = await getServerSession({ headers: req.headers }).catch(() => null);
  await recordEvent(event, { anonymousId, userId: session?.user?.id });
  return new NextResponse(null, { status: 204 });
}
