"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DiffView } from "@/components/ai/diff-view";
import { questionFor } from "@/lib/ai/questions";
import { requestNumberRewrite } from "@/lib/ai/rewrite-client";
import type { Bullet } from "@/lib/review/bullets";
import { useBulletEdits } from "@/lib/use-bullet-edits";
import { track } from "@/lib/analytics/track";

type Step =
  | { kind: "closed" }
  | { kind: "asking"; answer: string; error?: string }
  | { kind: "rewriting"; answer: string }
  | { kind: "proposed"; answer: string; proposal: string; error?: string }
  | { kind: "applied" };

/**
 * "Ask for a number" on a bullet with no measurable outcome: a targeted
 * question, a rewrite that uses only the answer, and a diff to accept or
 * reject. Skipping leaves the bullet as it is.
 */
export function NumberPrompt({ bullet, signedIn }: { bullet: Bullet; signedIn: boolean }) {
  const { isCurrent, applyRewrite } = useBulletEdits();
  const [step, setStep] = useState<Step>({ kind: "closed" });
  const question = questionFor(bullet.text);

  if (!signedIn) {
    return (
      <p className="text-xs text-muted-foreground">
        <Link href="/auth/sign-up?next=/new" className="text-primary hover:underline">
          Sign up free
        </Link>{" "}
        and we&apos;ll help you work a number into this bullet.
      </p>
    );
  }

  if (step.kind === "closed") {
    return (
      <Button size="sm" variant="outline" className="h-7 gap-1.5" onClick={() => setStep({ kind: "asking", answer: "" })}>
        <Hash className="h-3.5 w-3.5" /> Add a number
      </Button>
    );
  }

  if (step.kind === "applied") {
    return (
      <p className="inline-flex items-center gap-1 text-xs text-emerald-500">
        <Check className="h-3.5 w-3.5" /> Updated. Run the review again to re-check.
      </p>
    );
  }

  const submit = async (answer: string) => {
    setStep({ kind: "rewriting", answer });
    try {
      const proposal = await requestNumberRewrite({
        bullet: bullet.text,
        context: bullet.entryLabel,
        question,
        answer,
        current: isCurrent(bullet),
      });
      setStep({ kind: "proposed", answer, proposal });
    } catch (err) {
      setStep({ kind: "asking", answer, error: err instanceof Error ? err.message : "The rewrite failed." });
    }
  };

  if (step.kind === "proposed") {
    return (
      <div className="space-y-2">
        <DiffView before={bullet.text} after={step.proposal} />
        {step.error && <p className="text-xs text-destructive">{step.error}</p>}
        <div className="flex gap-2">
          <Button
            size="sm"
            className="h-7"
            onClick={() => {
              if (applyRewrite(bullet, step.proposal)) {
                track("rewrite_accepted", {});
                setStep({ kind: "applied" });
              } else {
                setStep({ ...step, error: "This bullet changed since you asked. Run the review again." });
              }
            }}
          >
            Accept
          </Button>
          <Button size="sm" variant="ghost" className="h-7" onClick={() => setStep({ kind: "closed" })}>
            Reject
          </Button>
        </div>
      </div>
    );
  }

  const answer = step.answer;
  const busy = step.kind === "rewriting";
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (answer.trim()) submit(answer.trim());
      }}
    >
      <label className="block text-xs font-medium" htmlFor={`num-${bullet.id}`}>
        {question}
      </label>
      <input
        id={`num-${bullet.id}`}
        autoFocus
        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        placeholder="A rough number is fine. Skip if you don't know."
        value={answer}
        disabled={busy}
        onChange={(e) => setStep({ kind: "asking", answer: e.target.value })}
      />
      {step.kind === "asking" && step.error && <p className="text-xs text-destructive">{step.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="h-7 gap-1.5" disabled={busy || !answer.trim()}>
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Rewrite with this
        </Button>
        <Button type="button" size="sm" variant="ghost" className="h-7" disabled={busy} onClick={() => setStep({ kind: "closed" })}>
          Skip
        </Button>
      </div>
    </form>
  );
}
