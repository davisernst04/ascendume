"use client";

import Link from "next/link";
import { Check, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ResumeSection } from "@/lib/review/bullets";
import type { Finding } from "@/lib/review/findings";
import { getCriterion } from "@/lib/review/rubric";
import { NumberPrompt } from "@/components/ai/number-prompt";
import type { ReviewResult, ReviewStatus } from "@/lib/review/use-review";
import type { BodySection } from "@/lib/section-order";

interface ReviewPanelProps {
  status: ReviewStatus;
  result: ReviewResult | null;
  error: string | null;
  outdated: boolean;
  signedIn: boolean;
  onRun: () => void;
  onGoTo: (section: ResumeSection) => void;
  onReorder: (section: BodySection, above: BodySection) => void;
}

const SECTION_NAMES: Record<ResumeSection, string> = {
  personal: "Contact",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
};

export function ReviewPanel({ status, result, error, outdated, signedIn, onRun, onGoTo, onReorder }: ReviewPanelProps) {
  const busy = status === "waiting-for-preview" || status === "running";

  if (busy) {
    return (
      <div role="status" className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <Loader2 className="size-5 animate-spin text-brand" aria-hidden />
        <p className="font-semibold text-ink">
          {status === "waiting-for-preview" ? "Waiting for the page to finish typesetting…" : "Reading your resume…"}
        </p>
        <p className="max-w-xs text-sm text-ink-soft">
          {status === "waiting-for-preview"
            ? "The length check needs the real page count."
            : "This usually takes under half a minute."}
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col gap-5 py-6">
        <div>
          <h2 className="text-[1.5625rem] font-extrabold text-ink">Get it marked up</h2>
          <p className="mt-2 max-w-prose text-ink-soft">
            The review reads every bullet and leaves a note on the ones that need work: weak results, vague
            wording, inconsistent dates, anything that could trip up an applicant tracking system. Each note points
            at the line it&apos;s about.
          </p>
        </div>
        {!signedIn && (
          <p className="rounded-md bg-surface px-4 py-3 text-sm text-ink-soft">
            As a guest you get the automatic checks.{" "}
            <Link href="/auth/sign-up?next=/new" className="font-semibold text-brand hover:underline">
              Sign up free
            </Link>{" "}
            to add the AI read for results, readability and relevance.
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <Button variant="marker" size="lg" onClick={onRun} className="self-start">
          Review my resume
        </Button>
      </div>
    );
  }

  const withNotes = result.categories.filter((c) => c.findings.length > 0);

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {outdated && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-rule-strong bg-surface px-4 py-3">
          <p className="flex-1 text-sm text-ink">You&apos;ve edited since this review, so some notes may be out of date.</p>
          <Button size="sm" variant="outline" onClick={onRun}>
            <RefreshCw aria-hidden /> Run again
          </Button>
        </div>
      )}

      <div className={cn("flex flex-col gap-8", outdated && "opacity-60")}>
        <div>
          <h2 className="text-[1.5625rem] font-extrabold text-ink">
            {result.findingCount === 0
              ? "Nothing to fix in what was checked"
              : `${result.findingCount} ${result.findingCount === 1 ? "note" : "notes"} on your resume`}
          </h2>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-[auto_1fr_auto_1fr]">
            {result.categories.map((c) => (
              <div key={c.category} className="contents">
                <dt className="text-ink-soft">{c.label}</dt>
                <dd className="text-right font-semibold sm:text-left">
                  {c.score === null ? (
                    <span className="font-normal text-ink-soft">Not checked</span>
                  ) : c.findings.length === 0 ? (
                    <span className="inline-flex items-center gap-1 text-ok">
                      <Check className="size-3.5" aria-hidden /> Clear
                    </span>
                  ) : (
                    <a href={`#review-${c.category}`} className="text-brand hover:underline">
                      {c.findings.length} {c.findings.length === 1 ? "note" : "notes"}
                    </a>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 flex flex-col gap-1 text-xs text-ink-soft">
            {result.ai.status === "skipped" && (
              <p>
                The AI read (results, readability, relevance) needs an account.{" "}
                <Link href="/auth/sign-up?next=/new" className="font-semibold text-brand hover:underline">
                  Sign up free
                </Link>
              </p>
            )}
            {result.ai.status === "failed" && (
              <p className="text-danger">{result.ai.message} The automatic checks still ran.</p>
            )}
            {!result.lengthChecked && <p>Page length wasn&apos;t checked because the page didn&apos;t finish typesetting.</p>}
          </div>
        </div>

        {withNotes.map((c) => (
          <section key={c.category} id={`review-${c.category}`} aria-labelledby={`review-${c.category}-h`} className="scroll-mt-4">
            <h3 id={`review-${c.category}-h`} className="mb-3 text-lg font-bold text-ink">
              {c.label}
            </h3>
            <ol className="flex flex-col gap-3">
              {c.findings.map((f, i) => (
                <li key={i}>
                  <Note finding={f} result={result} signedIn={signedIn} onGoTo={onGoTo} onReorder={onReorder} />
                </li>
              ))}
            </ol>
          </section>
        ))}

        {/* The score is deliberately the least prominent element. */}
        <p className="border-t border-rule pt-4 text-xs text-ink-soft">
          {result.overall !== null
            ? `Overall score: ${result.overall} out of 100. Fix the notes first; the score follows.`
            : "No overall score yet. Add at least 3 bullets first."}
        </p>
      </div>
    </div>
  );
}

/** One margin note: what's wrong, the line it's about, and why it matters. */
function Note({
  finding,
  result,
  signedIn,
  onGoTo,
  onReorder,
}: {
  finding: Finding;
  result: ReviewResult;
  signedIn: boolean;
  onGoTo: (section: ResumeSection) => void;
  onReorder: (section: BodySection, above: BodySection) => void;
}) {
  const reorder = finding.reorder;
  const criterion = getCriterion(finding.criterionId);
  const t = finding.target;
  const bullet = t.kind === "bullet" ? result.bullets.get(t.bulletId) : undefined;
  const section: ResumeSection | null =
    t.kind === "bullet" ? (bullet?.section ?? null) : t.kind === "resume" ? null : t.section;
  const where = t.kind === "bullet" ? bullet?.entryLabel : t.kind === "entry" || t.kind === "field" ? t.label : null;

  return (
    <article className="rounded-md border-l-4 border-marker bg-raised py-3 pl-4 pr-3 shadow-[0_0_0_1px_var(--rule)]">
      <p className="font-semibold text-ink">{finding.detail}</p>
      {bullet && (
        <blockquote className="mt-2 rounded-sm bg-paper px-3 py-2 font-serif text-[0.9375rem] leading-snug text-[#2b2620] shadow-[0_0_0_1px_var(--rule)]">
          {bullet.text}
        </blockquote>
      )}
      <p className="mt-2 text-sm text-ink-soft">{criterion.reason}</p>
      {bullet && finding.criterionId === "impact.measurable" && (
        <div className="mt-3">
          <NumberPrompt bullet={bullet} signedIn={signedIn} />
        </div>
      )}
      {reorder && (
        <Button size="sm" variant="outline" className="mt-3" onClick={() => onReorder(reorder.section, reorder.above)}>
          Move {SECTION_NAMES[reorder.section]} above {SECTION_NAMES[reorder.above]}
        </Button>
      )}
      {(where || section) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
          {where && <span>{where}</span>}
          {section && (
            <button type="button" onClick={() => onGoTo(section)} className="font-semibold text-brand hover:underline">
              Edit in {SECTION_NAMES[section]}
            </button>
          )}
        </div>
      )}
    </article>
  );
}
