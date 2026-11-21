"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { signIn, signUp } from "@/lib/auth-client";
import type { SocialProviderId } from "@/lib/auth-providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wordmark } from "@/components/wordmark";

const PROVIDERS: Record<SocialProviderId, { name: string; icon: React.ReactNode }> = {
  github: {
    name: "GitHub",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
        <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
      </svg>
    ),
  },
  google: {
    name: "Google",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 488 512" aria-hidden="true" fill="currentColor">
        <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
      </svg>
    ),
  },
  microsoft: {
    name: "Microsoft",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 23 23" aria-hidden="true">
        <path fill="#f35325" d="M1 1h10v10H1z" />
        <path fill="#81bc06" d="M12 1h10v10H12z" />
        <path fill="#05a6f0" d="M1 12h10v10H1z" />
        <path fill="#ffba08" d="M12 12h10v10H12z" />
      </svg>
    ),
  },
};

interface AuthFormProps {
  mode: "sign-in" | "sign-up";
  providers: SocialProviderId[];
  /** Same-site path to land on afterwards (already validated by the page). */
  next: string;
  /** An OAuth error code better-auth redirected back with. */
  oauthError?: string;
}

/** Plain-language messages for the OAuth errors users can actually hit. */
export function oauthErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  if (code === "account_not_linked") {
    return "An account with this email already exists. Sign in with your email and password, then connect this sign-in method from your Account page.";
  }
  if (code === "access_denied") return "Sign-in was cancelled.";
  return "That sign-in didn't work. Try again, or use your email and password.";
}

export function AuthForm({ mode, providers, next, oauthError }: AuthFormProps) {
  const router = useRouter();
  const isSignUp = mode === "sign-up";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // A visible-password toggle instead of a second "confirm" field: one less field to fill and scroll past.
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState<"email" | SocialProviderId | null>(null);
  const [error, setError] = useState<string | null>(oauthErrorMessage(oauthError));

  const nextQuery = next === "/" ? "" : `?next=${encodeURIComponent(next)}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending("email");
    try {
      const result = isSignUp
        ? await signUp.email({ email, password, name, callbackURL: next })
        : await signIn.email({ email, password, callbackURL: next });
      if (result.error) {
        setError(result.error.message ?? `Could not ${isSignUp ? "sign up" : "sign in"}`);
        setPending(null);
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError(`Could not ${isSignUp ? "sign up" : "sign in"}`);
      setPending(null);
    }
  };

  const handleSocial = async (provider: SocialProviderId) => {
    setError(null);
    setPending(provider);
    try {
      const result = await signIn.social({
        provider,
        callbackURL: next,
        errorCallbackURL: `/auth/${mode}${nextQuery}`,
      });
      if (result?.error) {
        setError(result.error.message ?? `Could not continue with ${PROVIDERS[provider].name}`);
        setPending(null);
      }
    } catch {
      setError(`Could not continue with ${PROVIDERS[provider].name}`);
      setPending(null);
    }
  };

  const busy = pending !== null;

  return (
    <div className="grid h-dvh bg-surface lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* A quiet panel beside the form on wide screens */}
      <aside className="hidden bg-brand p-10 text-[#efeee6] lg:flex dark:bg-[#22352a]">
        {/* A centered column, so the copy doesn't hug the window edge on wide screens. */}
        <div className="mx-auto flex w-full max-w-lg flex-col items-start justify-between">
          <Wordmark className="text-[#efeee6]" />
          <div className="max-w-md">
            <p className="font-display text-[2.25rem] font-bold leading-tight">
              {isSignUp ? "Your resumes, saved. The AI review, unlocked." : "Pick up where you left off."}
            </p>
            <p className="mt-4 text-[#efeee6]/75">
              Every finding points at the bullet it&apos;s about, and the AI never adds a number you didn&apos;t give.
            </p>
          </div>
          <Link href="/privacy" className="text-sm text-[#efeee6]/70 hover:text-[#efeee6] hover:underline">
            What we store, and where your resume text goes
          </Link>
        </div>
      </aside>

      <main className="flex min-h-0 flex-col overflow-y-auto px-4 sm:px-8">
        <header className="flex h-16 shrink-0 items-center lg:hidden">
          <Wordmark />
        </header>
        <div className="mx-auto my-auto w-full max-w-sm py-6">
          <h1 className="text-[2rem] font-bold leading-tight text-ink">
            {isSignUp ? "Create your account" : "Sign in"}
          </h1>
          <p className="mt-1 text-ink-soft">
            {isSignUp ? "Free, with no credit card." : "Welcome back."}{" "}
            {isSignUp ? "Already have an account? " : "New here? "}
            <Link href={`/auth/${isSignUp ? "sign-in" : "sign-up"}${nextQuery}`} className="whitespace-nowrap font-medium text-brand hover:underline">
              {isSignUp ? "Sign in" : "Create an account"}
            </Link>
          </p>

          {providers.length > 0 && (
            <div className="mt-6 grid gap-2" style={{ gridTemplateColumns: `repeat(${providers.length}, minmax(0, 1fr))` }}>
              {providers.map((p) => (
                <Button
                  key={p}
                  variant="outline"
                  type="button"
                  className="h-10 w-full"
                  onClick={() => handleSocial(p)}
                  disabled={busy}
                  aria-label={`Continue with ${PROVIDERS[p].name}`}
                >
                  {pending === p ? <Loader2 className="animate-spin" aria-hidden /> : PROVIDERS[p].icon}
                  <span className={providers.length > 2 ? "hidden sm:inline" : undefined}>{PROVIDERS[p].name}</span>
                </Button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5">
            {providers.length > 0 && (
              <div className="mb-4 flex items-center gap-3 text-sm text-ink-soft">
                <span className="h-px flex-1 bg-rule" />
                or with email
                <span className="h-px flex-1 bg-rule" />
              </div>
            )}
            <div className="flex flex-col gap-3">
              {isSignUp && (
                <div className="flex flex-col gap-1">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" placeholder="name@school.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-sm text-ink-soft hover:text-ink"
                    aria-controls="password"
                    aria-pressed={showPassword}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={isSignUp ? 8 : undefined}
                />
              </div>
              {error && (
                <p role="alert" className="rounded-md bg-danger-wash px-3 py-2 text-sm text-danger">
                  {error}
                </p>
              )}
              <Button type="submit" size="lg" className="mt-1 h-11 w-full" disabled={busy}>
                {pending === "email" && <Loader2 className="animate-spin" aria-hidden />}
                {pending === "email"
                  ? isSignUp
                    ? "Creating account…"
                    : "Signing in…"
                  : isSignUp
                    ? "Create account"
                    : "Sign in"}
              </Button>
            </div>
          </form>
          {isSignUp && (
            <p className="mt-4 text-sm text-ink-soft lg:hidden">
              <Link href="/privacy" className="font-medium text-brand hover:underline">
                What we store, and where your resume text goes
              </Link>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
