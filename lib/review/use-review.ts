"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CompileResult } from "@/components/latex-pdf-preview";
import type { ResumeData } from "@/lib/resume-context";
import { buildLatex } from "@/lib/resume-latex";
import type { Bullet } from "@/lib/review/bullets";
import { runDeterministicChecks } from "@/lib/review/deterministic";
import { type CategoryScore, type Finding, scoreReview } from "@/lib/review/findings";
import { LLM_CRITERION_IDS } from "@/lib/review/rubric";

/** If the preview hasn't compiled the current resume by then, review without the page count. */
const COMPILE_WAIT_MS = 15_000;

export type AiPass =
  | { status: "done" }
  | { status: "skipped" } // guest
  | { status: "failed"; message: string };

export interface ReviewResult {
  categories: CategoryScore[];
  overall: number | null;
  bullets: Map<string, Bullet>;
  findingCount: number;
  lengthChecked: boolean;
  ai: AiPass;
  /** The reviewed content; any difference from the current resume makes the review outdated. */
  snapshot: string;
}

export type ReviewStatus = "idle" | "waiting-for-preview" | "running" | "done";

/** The parts of a resume a review looks at (not its title or id). */
function snapshotOf(data: ResumeData): string {
  const { personalInfo, experience, education, skills, projects, certifications } = data;
  return JSON.stringify({ personalInfo, experience, education, skills, projects, certifications });
}

interface UseReviewOptions {
  data: ResumeData;
  /** The builder has finished loading the resume. */
  loaded: boolean;
  compiled: CompileResult | null;
  signedIn: boolean;
}

export function useReview({ data, loaded, compiled, signedIn }: UseReviewOptions) {
  const [status, setStatus] = useState<ReviewStatus>("idle");
  const [result, setResult] = useState<ReviewResult | null>(null);
  const requestedAtRef = useRef<number | null>(null);

  const run = useCallback(
    async (pageCount: number | null) => {
      setStatus("running");
      const snapshot = snapshotOf(data);
      const det = runDeterministicChecks({ data, pageCount });
      let findings: Finding[] = det.findings;
      const checked = new Set(det.checked);
      let ai: AiPass = { status: "skipped" };

      if (signedIn) {
        try {
          const res = await fetch("/api/review", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          const body = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(body.error ?? "The AI review failed. Try again.");
          findings = [...findings, ...(body.findings as Finding[])];
          LLM_CRITERION_IDS.forEach((id) => checked.add(id));
          ai = { status: "done" };
        } catch (err) {
          ai = { status: "failed", message: err instanceof Error ? err.message : "The AI review failed." };
        }
      }

      const { categories, overall } = scoreReview({
        findings,
        checked,
        bulletCount: det.bullets.length,
        entryCount: det.entryCount,
      });
      setResult({
        categories,
        overall,
        bullets: new Map(det.bullets.map((b) => [b.id, b])),
        findingCount: findings.length,
        lengthChecked: pageCount !== null,
        ai,
        snapshot,
      });
      setStatus("done");
    },
    [data, signedIn]
  );

  /** Ask for a review. It runs once the resume is loaded and the preview has compiled it. */
  const request = useCallback(() => {
    requestedAtRef.current = Date.now();
    setStatus("waiting-for-preview");
  }, []);

  useEffect(() => {
    if (status !== "waiting-for-preview" || !loaded) return;
    // Run as soon as the preview has compiled exactly this resume; otherwise give up
    // waiting after COMPILE_WAIT_MS and review without the page count.
    const matches = compiled !== null && compiled.latex === buildLatex(data);
    const waited = Date.now() - (requestedAtRef.current ?? Date.now());
    const timer = matches
      ? setTimeout(() => run(compiled.pages), 0)
      : setTimeout(() => run(null), Math.max(0, COMPILE_WAIT_MS - waited));
    return () => clearTimeout(timer);
  }, [status, loaded, data, compiled, run]);

  const outdated = useMemo(
    () => result !== null && status === "done" && snapshotOf(data) !== result.snapshot,
    [result, status, data]
  );

  return { status, result, outdated, request };
}
