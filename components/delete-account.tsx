"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { clearDraft } from "@/lib/resume-draft";

const CONFIRM = "delete";

export function DeleteAccount() {
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await authClient.deleteUser({ callbackURL: "/" });
      if (result.error) {
        // better-auth requires a recent sign-in to delete an account.
        setError(
          result.error.code === "SESSION_EXPIRED"
            ? "For safety, sign out and sign back in, then delete your account."
            : (result.error.message ?? "Couldn't delete your account. Try again.")
        );
        setBusy(false);
        return;
      }
      clearDraft();
      try {
        localStorage.removeItem("ascendume_aid");
      } catch {
        // Nothing stored.
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Couldn't delete your account. Try again.");
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm" htmlFor="confirm-delete">
        Type <span className="font-mono font-semibold">{CONFIRM}</span> to confirm
      </label>
      <input
        id="confirm-delete"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-destructive/30"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        autoComplete="off"
        disabled={busy}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button variant="destructive" disabled={busy || typed.trim().toLowerCase() !== CONFIRM} onClick={remove} className="gap-2">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Delete my account and data
      </Button>
    </div>
  );
}
