"use client";

import { useId, useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  type?: "text" | "email" | "tel" | "url";
  autoComplete?: string;
  disabled?: boolean;
  className?: string;
  /** Rendered at the right end of the label row, e.g. a "Present" checkbox. */
  labelAside?: React.ReactNode;
}

/** A labelled single-line input. Hints are kept to one short line so forms stay compact. */
export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = "text",
  autoComplete,
  disabled,
  className,
  labelAside,
}: FieldProps) {
  const id = useId();
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {labelAside}
      </div>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete ?? "off"}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="h-9"
      />
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-ink-soft">
          {hint}
        </p>
      )}
    </div>
  );
}

/** A labelled multi-line input. Bullet fields hold one bullet per line. */
export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  rows = 4,
  disabled,
  className,
}: Omit<FieldProps, "type" | "autoComplete" | "labelAside"> & { rows?: number }) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {hint && (
          <p id={`${id}-hint`} className="truncate text-xs text-ink-soft">
            {hint}
          </p>
        )}
      </div>
      <Textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="py-1.5"
      />
    </div>
  );
}

/**
 * One job, school, project or certification. Entries fold to a single row so a
 * section with several of them still fits on screen; only the open one shows
 * its fields.
 */
export function EntryBlock({
  heading,
  placeholderHeading,
  summary,
  open,
  onToggle,
  onRemove,
  disabled,
  children,
}: {
  heading: string;
  placeholderHeading: string;
  /** A short line shown beside the heading, like the dates. */
  summary?: string;
  open: boolean;
  onToggle: () => void;
  onRemove: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const name = heading.trim() || placeholderHeading;
  const bodyId = useId();
  return (
    <section className={cn("rounded-lg border bg-raised", open ? "border-rule-strong" : "border-rule")} aria-label={name}>
      <header className="flex min-h-11 items-center gap-2 pr-1.5">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={bodyId}
          className="flex min-w-0 flex-1 items-center gap-2 self-stretch rounded-l-lg py-2 pl-3.5 text-left"
        >
          <ChevronDown
            className={cn("size-4 shrink-0 text-ink-soft transition-transform", !open && "-rotate-90")}
            aria-hidden
          />
          <span className={cn("truncate font-medium", heading.trim() ? "text-ink" : "text-ink-soft")}>{name}</span>
          {summary && !open && <span className="ml-auto shrink-0 pl-2 text-sm text-ink-soft">{summary}</span>}
        </button>
        <ConfirmRemove what={name} onRemove={onRemove} disabled={disabled} />
      </header>
      {open && (
        <div id={bodyId} className="flex flex-col gap-3 border-t border-rule px-3.5 pb-3.5 pt-3">
          {children}
        </div>
      )}
    </section>
  );
}

/** Which entry in a list is unfolded: one at a time, and a newly added entry opens. */
export function useOpenEntry(initial: string | null) {
  const [openId, setOpenId] = useState<string | null>(initial);
  return {
    isOpen: (id: string) => openId === id,
    toggle: (id: string) => setOpenId((cur) => (cur === id ? null : id)),
    open: (id: string) => setOpenId(id),
  };
}

/** Remove with a second click: entries hold typing that has no undo. */
export function ConfirmRemove({ what, onRemove, disabled }: { what: string; onRemove: () => void; disabled?: boolean }) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => setConfirming(true)}
        disabled={disabled}
        aria-label={`Remove ${what}`}
        className="text-ink-soft hover:text-danger"
      >
        <Trash2 />
      </Button>
    );
  }
  return (
    <div className="flex shrink-0 items-center gap-1" role="group" aria-label={`Remove ${what}?`}>
      <Button type="button" size="xs" variant="destructive" onClick={onRemove} autoFocus>
        Remove
      </Button>
      <Button type="button" size="xs" variant="ghost" onClick={() => setConfirming(false)}>
        Keep
      </Button>
    </div>
  );
}

export function AddButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-rule-strong text-[0.9375rem] font-medium text-ink-soft transition-colors hover:border-ink-soft hover:bg-mist/50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Plus className="size-4" aria-hidden /> {children}
    </button>
  );
}

/** A row of fields that stacks on narrow screens. */
export function FieldRow({ cols = 2, children }: { cols?: 2 | 3; children: React.ReactNode }) {
  return <div className={cn("grid gap-3", cols === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3")}>{children}</div>;
}
