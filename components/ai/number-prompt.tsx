"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
 * "Add a number" on a bullet with no measurable outcome: a targeted
 * question, a rewrite that uses only the answer, and a diff to accept or
 * reject. Skipping leaves the bullet as it is.
 */
export function NumberPrompt({ bullet, signedIn }: { bullet: Bullet; signedIn: boolean }) {
  const { isCurrent, applyRewrite } = useBulletEdits();
  const [step, setStep] = useState<Step>({ kind: "closed" });
  const question = questionFor(bullet.text);

  if (!signedIn) {
    return (
      <p className="text-sm text-ink-soft">
        <Link href="/auth/sign-up?next=/new" className="font-semibold text-brand hover:underline">
          Sign up free
        </Link>{" "}
        and we&apos;ll help you work a number into this bullet.
      </p>
    );
  }

  if (step.kind === "closed") {
    return (
      <Button size="sm" variant="outline" className="border-brand/50 text-brand hover:bg-brand-wash" onClick={() => setStep({ kind: "asking", answer: "" })}>
        Add a number
      </Button>
    );
  }

  if (step.kind === "applied") {
    return (
      <p role="status" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ok">
        <Check className="size-4" aria-hidden /> Bullet updated. Run the review again to re-check it.
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
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-ink">Here&apos;s the bullet with your number in it:</p>
        <DiffView before={bullet.text} after={step.proposal} />
        {step.error && (
          <p role="alert" className="text-sm text-danger">
            {step.error}
          </p>
        )}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="marker"
            onClick={() => {
              if (applyRewrite(bullet, step.proposal)) {
                track("rewrite_accepted", {});
                setStep({ kind: "applied" });
              } else {
                setStep({ ...step, error: "This bullet changed since you asked. Run the review again." });
              }
            }}
          >
            Use this
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setStep({ kind: "closed" })}>
            Keep mine
          </Button>
        </div>
      </div>
    );
  }

  const answer = step.answer;
  const busy = step.kind === "rewriting";
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (answer.trim()) submit(answer.trim());
      }}
    >
      <label className="text-sm font-semibold text-ink" htmlFor={`num-${bullet.id}`}>
        {question}
      </label>
      <Input
        id={`num-${bullet.id}`}
        autoFocus
        placeholder="A rough number is fine. Skip if you don't know."
        value={answer}
        disabled={busy}
        onChange={(e) => setStep({ kind: "asking", answer: e.target.value })}
      />
      {step.kind === "asking" && step.error && (
        <p role="alert" className="text-sm text-danger">
          {step.error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" variant="marker" disabled={busy || !answer.trim()}>
          {busy && <Loader2 className="animate-spin" aria-hidden />}
          {busy ? "Rewriting…" : "Rewrite with this"}
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => setStep({ kind: "closed" })}>
          Skip
        </Button>
      </div>
    </form>
  );
}
