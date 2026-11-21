import { openai } from "@ai-sdk/openai";

// A stronger model for scoring; the cheapest current model for rewrites and
// for turning uploaded PDFs into fields.
export const reviewModel = () => openai("gpt-5.5");
export const rewriteModel = () => openai("gpt-6-luna");
export const parseModel = () => openai("gpt-6-luna");
