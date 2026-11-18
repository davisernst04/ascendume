"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2, MessageSquareText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DiffView } from "@/components/ai/diff-view";
import { useSession } from "@/lib/auth-client";
import { INTERVIEW_QUESTIONS, type InterviewAnswers } from "@/lib/ai/questions";
import { requestDraft } from "@/lib/ai/rewrite-client";
import { inputClass } from "@/components/builder/form-styles";

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
      <Button type="button" size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => setOpen(true)}>
        <MessageSquareText className="h-3.5 w-3.5" />
        Answer questions, draft bullets
      </Button>
    );
  }

  if (!session?.user) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
        Drafting bullets from your answers uses AI, which needs a free account. Your draft here is kept.{" "}
        <Link href="/auth/sign-up?next=/new" className="text-primary hover:underline">
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

  const take = (i: number, accept: boolean) => {
    if (!proposals) return;
    if (accept) onAccept([proposals[i]]);
    const rest = proposals.filter((_, j) => j !== i);
    setProposals(rest.length ? rest : null);
    if (!rest.length) {
      setOpen(false);
      setAnswers(EMPTY);
    }
  };

  if (proposals) {
    return (
      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3 text-sm">
        <p className="font-medium">Drafted from your answers. Keep the ones that are right.</p>
        {proposals.map((p, i) => (
          <div key={`${i}-${p}`} className="flex items-start gap-2">
            <div className="flex-1">
              <DiffView before="" after={p} />
            </div>
            <Button type="button" size="sm" className="h-7 px-2" aria-label="Accept bullet" onClick={() => take(i, true)}>
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" size="sm" variant="ghost" className="h-7 px-2" aria-label="Reject bullet" onClick={() => take(i, false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            className="h-7"
            onClick={() => {
              onAccept(proposals);
              setProposals(null);
              setOpen(false);
              setAnswers(EMPTY);
            }}
          >
            Accept all
          </Button>
          <Button type="button" size="sm" variant="ghost" className="h-7" onClick={() => setProposals(null)}>
            Back to answers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="rounded-lg border border-border bg-muted/20 p-3 space-y-3 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        if (answers.did.trim()) draft();
      }}
    >
      <p className="text-muted-foreground">
        Answer in your own words. Class projects, hackathons, clubs and labs all count. We only write
        from what you say here.
      </p>
      {INTERVIEW_QUESTIONS.map((q) => (
        <div key={q.id}>
          <label className="block font-medium mb-1" htmlFor={`interview-${q.id}`}>
            {q.label}
          </label>
          <textarea
            id={`interview-${q.id}`}
            rows={q.id === "did" ? 3 : 2}
            className={`${inputClass} resize-none text-sm`}
            placeholder={q.placeholder}
            value={answers[q.id]}
            onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
            required={q.required}
            disabled={busy}
          />
        </div>
      ))}
      {error && <p className="text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="h-8 gap-1.5" disabled={busy || !answers.did.trim()}>
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Draft bullets
        </Button>
        <Button type="button" size="sm" variant="ghost" className="h-8" disabled={busy} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
