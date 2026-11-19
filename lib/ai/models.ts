import { openai } from "@ai-sdk/openai";

// The plan's split: a stronger model for scoring, a cheaper current mini model
// for rewrites and for turning uploaded PDFs into fields.
export const reviewModel = () => openai("gpt-5.5");
export const rewriteModel = () => openai("gpt-5.4-mini");
export const parseModel = () => openai("gpt-5.4-mini");
