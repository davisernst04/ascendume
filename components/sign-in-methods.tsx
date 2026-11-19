"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import type { SocialProviderId } from "@/lib/auth-providers";
import { Button } from "@/components/ui/button";

const NAMES: Record<string, string> = { github: "GitHub", google: "Google", microsoft: "Microsoft", credential: "Email and password" };

/**
 * Lists how this account can sign in and connects GitHub or Google to it.
 * Connecting while signed in is how an email/password account gains a social
 * sign-in: better-auth won't link one automatically to an unverified email.
 */
export function SignInMethods({ available, linkError }: { available: SocialProviderId[]; linkError: string | null }) {
  const [linked, setLinked] = useState<string[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(linkError);

  useEffect(() => {
    authClient
      .listAccounts()
      .then((res) => setLinked(res.data?.map((a) => a.providerId) ?? []))
      .catch(() => setLinked([]));
  }, []);

  const connect = async (provider: SocialProviderId) => {
    setBusy(provider);
    setError(null);
    const res = await authClient.linkSocial({ provider, callbackURL: "/account", errorCallbackURL: "/account" });
    if (res?.error) {
      setError(res.error.message ?? `Couldn't connect ${NAMES[provider]}.`);
      setBusy(null);
    }
  };

  if (linked === null) {
    return <Loader2 className="size-4 animate-spin text-ink-soft" aria-label="Loading" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {linked.map((p) => (
          <li key={p} className="flex items-center gap-2">
            <Check className="size-4 text-ok" aria-hidden /> {NAMES[p] ?? p}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        {available
          .filter((p) => !linked.includes(p))
          .map((p) => (
            <Button key={p} variant="outline" size="sm" disabled={busy !== null} onClick={() => connect(p)} >
              {busy === p && <Loader2 className="animate-spin" aria-hidden />}
              Connect {NAMES[p]}
            </Button>
          ))}
      </div>
      <p className="text-sm text-ink-soft">
        The GitHub or Google account must use the same email as this account.
      </p>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
