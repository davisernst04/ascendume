"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardCheck, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ResumeSection } from "@/lib/review/bullets";
import type { Finding } from "@/lib/review/findings";
import { getCriterion } from "@/lib/review/rubric";
import type { ReviewResult, ReviewStatus } from "@/lib/review/use-review";

interface ReviewPanelProps {
  status: ReviewStatus;
  result: ReviewResult | null;
  outdated: boolean;
  signedIn: boolean;
  onRun: () => void;
  onGoTo: (section: ResumeSection) => void;
}

export function ReviewPanel({ status, result, outdated, signedIn, onRun, onGoTo }: ReviewPanelProps) {
  const busy = status === "waiting-for-preview" || status === "running";

  if (busy) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        {status === "waiting-for-preview" ? "Waiting for the preview to finish…" : "Reviewing your resume…"}
      </div>
    );
  }

  if (!result) {
    return (
      <div className="space-y-4 py-6 text-sm">
        <p className="text-muted-foreground">
          Checks your resume for impact, language, clarity, length, consistency, completeness,
          ATS-safety and relevance. Every finding points at the bullet or field it&apos;s about.
        </p>
        {!signedIn && (
          <p className="text-muted-foreground">
            As a guest you get the automatic checks.{" "}
            <Link href="/auth/sign-up?next=/new" className="text-primary hover:underline">
              Sign up
            </Link>{" "}
            to add the AI pass for results, readability and relevance.
          </p>
        )}
        <Button onClick={onRun} className="w-full gap-2 font-bold">
          <ClipboardCheck className="h-4 w-4" />
          Review my resume
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 text-sm">
      {outdated && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
          <span className="flex-1">You&apos;ve edited since this review.</span>
          <Button size="sm" variant="outline" className="h-7 gap-1.5" onClick={onRun}>
            <RefreshCw className="h-3.5 w-3.5" />
            Run again
          </Button>
        </div>
      )}

      <div className={cn("space-y-5", outdated && "opacity-60")}>
        {/* Category breakdown */}
        <ul className="divide-y divide-border rounded-lg border border-border">
          {result.categories.map((c) => (
            <li key={c.category}>
              <a
                href={c.findings.length ? `#review-${c.category}` : undefined}
                className={cn(
                  "flex items-center justify-between px-3 py-2",
                  c.findings.length && "hover:bg-muted/50"
                )}
              >
                <span className="font-medium">{c.label}</span>
                <span className="text-muted-foreground">
                  {c.score === null ? (
                    "Not checked"
                  ) : c.findings.length === 0 ? (
                    <span className="inline-flex items-center gap-1 text-emerald-500">
                      <CheckCircle2 className="h-3.5 w-3.5" /> No issues
                    </span>
                  ) : (
                    `${c.findings.length} to fix`
                  )}
                </span>
              </a>
            </li>
          ))}
        </ul>

        {/* Notes about what wasn't checked */}
        <div className="space-y-1 text-xs text-muted-foreground">
          {result.ai.status === "skipped" && (
            <p>
              AI checks (results, readability, relevance) need an account.{" "}
              <Link href="/auth/sign-up?next=/new" className="text-primary hover:underline">
                Sign up free
              </Link>
              .
            </p>
          )}
          {result.ai.status === "failed" && <p className="text-destructive">{result.ai.message} The automatic checks still ran.</p>}
          {!result.lengthChecked && <p>Page length wasn&apos;t checked because the preview didn&apos;t finish compiling.</p>}
        </div>

        {/* Findings, grouped by category */}
        {result.categories
          .filter((c) => c.findings.length > 0)
          .map((c) => (
            <section key={c.category} id={`review-${c.category}`} className="space-y-2 scroll-mt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</h4>
              {c.findings.map((f, i) => (
                <FindingCard key={i} finding={f} result={result} onGoTo={onGoTo} />
              ))}
            </section>
          ))}

        {result.findingCount === 0 && (
          <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
            Nothing to fix in what was checked.
          </p>
        )}

        {/* The score is deliberately the least prominent element. */}
        {result.overall !== null && (
          <p className="text-xs text-muted-foreground">Overall: {result.overall}/100</p>
        )}
      </div>
    </div>
  );
}

function FindingCard({
  finding,
  result,
  onGoTo,
}: {
  finding: Finding;
  result: ReviewResult;
  onGoTo: (section: ResumeSection) => void;
}) {
  const criterion = getCriterion(finding.criterionId);
  const t = finding.target;
  const bullet = t.kind === "bullet" ? result.bullets.get(t.bulletId) : undefined;
  const section: ResumeSection | null =
    t.kind === "bullet" ? (bullet?.section ?? null) : t.kind === "resume" ? null : t.section;
  const where =
    t.kind === "bullet" ? bullet?.entryLabel : t.kind === "entry" || t.kind === "field" ? t.label : null;

  return (
    <div className="rounded-lg border border-border bg-background p-3 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{finding.detail}</p>
        {section && (
          <button
            type="button"
            onClick={() => onGoTo(section)}
            className="shrink-0 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Go to <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
      {bullet && (
        <blockquote className="border-l-2 border-border pl-2 text-muted-foreground line-clamp-2">{bullet.text}</blockquote>
      )}
      {where && <p className="text-xs text-muted-foreground">{where}</p>}
      <p className="text-xs text-muted-foreground/80">{criterion.reason}</p>
    </div>
  );
}
