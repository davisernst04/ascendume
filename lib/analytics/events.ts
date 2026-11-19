// The only analytics events Ascendume records (docs/plans/2026-11-relaunch.md,
// "Measuring"). Props are fixed enums, so no resume content can get in.
import { z } from "zod";

export const analyticsEventSchema = z.discriminatedUnion("name", [
  z.object({ name: z.literal("visited"), props: z.object({}).strict() }),
  z.object({ name: z.literal("resume_started"), props: z.object({ route: z.enum(["build", "review"]) }).strict() }),
  z.object({ name: z.literal("resume_imported"), props: z.object({}).strict() }),
  z.object({ name: z.literal("review_run"), props: z.object({}).strict() }),
  z.object({ name: z.literal("rewrite_accepted"), props: z.object({}).strict() }),
  z.object({ name: z.literal("exported"), props: z.object({ format: z.enum(["pdf", "tex"]) }).strict() }),
]);

export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;
