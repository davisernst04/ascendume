"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Delete a resume from the list, with an inline confirmation (it can't be undone). */
export function ResumeRowDelete({ resumeId, title }: { resumeId: string; title: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [failed, setFailed] = useState(false);

  async function remove() {
    setDeleting(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/resumes/${resumeId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setFailed(true);
      setDeleting(false);
    }
  }

  if (!confirming) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setConfirming(true)}
        aria-label={`Delete ${title}`}
        className="text-ink-soft hover:text-danger"
      >
        <Trash2 />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1.5" role="group" aria-label={`Delete ${title}?`}>
      <span className="hidden text-sm text-ink-soft sm:inline">{failed ? "Couldn't delete." : "Delete for good?"}</span>
      <Button size="xs" variant="destructive" onClick={remove} disabled={deleting} autoFocus>
        {deleting && <Loader2 className="animate-spin" />}
        Delete
      </Button>
      <Button size="xs" variant="ghost" onClick={() => setConfirming(false)} disabled={deleting}>
        Keep
      </Button>
    </div>
  );
}
