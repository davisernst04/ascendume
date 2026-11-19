"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2, MessageSquareText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { DiffView } from "@/components/ai/diff-view";
import { useSession } from "@/lib/auth-client";
import { INTERVIEW_QUESTIONS, type InterviewAnswers } from "@/lib/ai/questions";
import { requestDraft } from "@/lib/ai/rewrite-client";
import { track } from "@/lib/analytics/track";

const EMPTY: InterviewAnswers = { role: "", did: "", result: "", tools: "" };

interface GuidedDraftProps {
  kind: "experience" | "project";
  /** Position and company, or project name. */
  heading: string;
  current: boolean;
  /** Adds accepted bullets to the end of the entry. */
  onAccept: (bullets: string[]) => void;
  initiallyOpen?: boolean;
}

/**
 * The guided interview for one job or project: plain questions, a draft built
 * only from the answers, and each drafted bullet accepted or rejected.
 */
export function GuidedDraft({ kind, heading, current, onAccept, initiallyOpen = false }: GuidedDraftProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(initiallyOpen);
  const [answers, setAnswers] = useState<InterviewAnswers>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposals, setProposals] = useState<string[] | null>(null);

  if (!open) {
    return (
      <Button type="button" size="sm" variant="ghost" className="self-start text-brand hover:text-brand-deep" onClick={() => setOpen(true)}>
        <MessageSquareText aria-hidden />
        Draft bullets by answering questions
      </Button>
    );
  }

  const shell = "rounded-lg border border-brand/40 bg-brand-wash/50 p-4";

  if (!session?.user) {
    return (
      <div className={`${shell} text-sm text-ink`}>
        Drafting bullets from your answers uses AI, which needs a free account. What you&apos;ve typed here is kept.{" "}
        <Link href="/auth/sign-up?next=/new" className="font-semibold text-brand hover:underline">
          Sign up
        </Link>
      </div>
    );
  }

  const draft = async () => {
    setBusy(true);
    setError(null);
    try {
      setProposals(await requestDraft({ kind, heading, current, answers }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "The draft failed.");
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    setProposals(null);
    setOpen(false);
    setAnswers(EMPTY);
  };

  const take = (i: number, accept: boolean) => {
    if (!proposals) return;
    if (accept) {
      onAccept([proposals[i]]);
      track("rewrite_accepted", {});
    }
    const rest = proposals.filter((_, j) => j !== i);
    if (rest.length) setProposals(rest);
    else close();
  };

  if (proposals) {
    return (
      <div className={`${shell} flex flex-col gap-3`}>
        <div>
          <p className="font-semibold text-ink">Drafted from your answers</p>
          <p className="text-sm text-ink-soft">Keep the ones that are true and sound like you. Kept bullets go below your others.</p>
        </div>
        <ul className="flex flex-col gap-2">
          {proposals.map((p, i) => (
            <li key={`${i}-${p}`} className="flex items-start gap-2">
              <div className="flex-1">
                <DiffView before="" after={p} />
              </div>
              <Button type="button" size="icon-sm" variant="marker" aria-label="Keep this bullet" onClick={() => take(i, true)}>
                <Check />
              </Button>
              <Button type="button" size="icon-sm" variant="ghost" aria-label="Discard this bullet" onClick={() => take(i, false)}>
                <X />
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="marker"
            onClick={() => {
              onAccept(proposals);
              track("rewrite_accepted", {});
              close();
            }}
          >
            Keep all
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setProposals(null)}>
            Back to my answers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className={`${shell} flex flex-col gap-4`}
      onSubmit={(e) => {
        e.preventDefault();
        if (answers.did.trim()) draft();
      }}
    >
      <p className="text-sm text-ink-soft">
        Answer in your own words. Rough notes are fine. Bullets are written only from what you put here.
      </p>
      {INTERVIEW_QUESTIONS.map((q) => (
        <div key={q.id} className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-ink" htmlFor={`interview-${q.id}`}>
            {q.label}
            {!q.required && !/optional/i.test(q.label) && <span className="font-normal text-ink-soft"> (optional)</span>}
          </label>
          <Textarea
            id={`interview-${q.id}`}
            rows={q.id === "did" ? 3 : 2}
            placeholder={q.placeholder}
            value={answers[q.id]}
            onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
            required={q.required}
            disabled={busy}
          />
        </div>
      ))}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" variant="marker" disabled={busy || !answers.did.trim()}>
          {busy && <Loader2 className="animate-spin" aria-hidden />}
          {busy ? "Drafting…" : "Draft bullets"}
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
