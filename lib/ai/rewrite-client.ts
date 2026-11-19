"use client";

import type { InterviewAnswers } from "@/lib/ai/questions";

type RewriteRequest =
  | { mode: "add-number"; bullet: string; context: string; question: string; answer: string; current: boolean }
  | { mode: "draft"; kind: "experience" | "project"; heading: string; current: boolean; answers: InterviewAnswers };

async function post<T>(body: RewriteRequest): Promise<T> {
  const res = await fetch("/api/ai/rewrite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "The rewrite failed. Try again.");
  return data as T;
}

export async function requestNumberRewrite(input: Omit<Extract<RewriteRequest, { mode: "add-number" }>, "mode">) {
  const { proposal } = await post<{ proposal: string }>({ mode: "add-number", ...input });
  return proposal;
}

export async function requestDraft(input: Omit<Extract<RewriteRequest, { mode: "draft" }>, "mode">) {
  const { bullets } = await post<{ bullets: string[] }>({ mode: "draft", ...input });
  return bullets;
}
