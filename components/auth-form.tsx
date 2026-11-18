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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
}

export function AuthForm({ mode, providers, next }: AuthFormProps) {
  const router = useRouter();
  const isSignUp = mode === "sign-up";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState<"email" | SocialProviderId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nextQuery = next === "/" ? "" : `?next=${encodeURIComponent(next)}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isSignUp && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
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
      const result = await signIn.social({ provider, callbackURL: next });
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {isSignUp ? "Create an account" : "Sign in"}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? "Free. Save your resumes and use the AI review."
              : "Welcome back. Your resumes are where you left them."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {providers.length > 0 && (
            <>
              <div className="space-y-2">
                {providers.map((p) => (
                  <Button
                    key={p}
                    variant="outline"
                    type="button"
                    className="w-full gap-2"
                    onClick={() => handleSocial(p)}
                    disabled={busy}
                  >
                    {pending === p ? <Loader2 className="h-4 w-4 animate-spin" /> : PROVIDERS[p].icon}
                    Continue with {PROVIDERS[p].name}
                  </Button>
                ))}
              </div>
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or use email</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete={isSignUp ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input id="confirmPassword" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
            )}
            {error && <div role="alert" className="text-sm text-destructive">{error}</div>}
            <Button type="submit" className="w-full" disabled={busy}>
              {pending === "email" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSignUp ? "Creating account..." : "Signing in..."}
                </>
              ) : isSignUp ? (
                "Create account"
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <Link
              href={`/auth/${isSignUp ? "sign-in" : "sign-up"}${nextQuery}`}
              className="text-primary hover:underline"
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
