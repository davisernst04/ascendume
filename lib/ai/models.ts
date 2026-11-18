import { openai } from "@ai-sdk/openai";

// Model choices live here so the plan's split (a stronger model for scoring,
// a cheaper one for rewrites, milestone 4) is a one-line change.
export const reviewModel = () => openai("gpt-4o");
