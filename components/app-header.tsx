import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";
import { AccountMenu } from "@/components/account-menu";

/** Pages can portal their own controls (the builder's title and actions) into the header here. */
export const HEADER_SLOT_ID = "app-header-slot";

interface AppHeaderProps {
  /** The signed-in user, or null for a guest using the builder. */
  user: { name: string; email: string } | null;
}

/** The bar across every app page: home, page controls, and either the account menu or a prompt to save. */
export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-rule bg-surface px-4 sm:px-6">
      <Wordmark />
      {user && (
        <nav aria-label="Main" className="hidden items-center text-[0.9375rem] font-medium sm:flex">
          <Link href="/" className="rounded-md px-2.5 py-1.5 text-ink-soft hover:bg-mist/70 hover:text-ink">
            Resumes
          </Link>
        </nav>
      )}
      <div id={HEADER_SLOT_ID} className="hidden min-w-0 flex-1 items-center gap-3 border-l border-rule pl-4 md:[&:not(:empty)]:flex" />
      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        {user ? (
          <AccountMenu name={user.name} email={user.email} />
        ) : (
          <>
            <Button asChild size="sm" variant="ghost">
              <Link href="/auth/sign-in?next=/new">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/auth/sign-up?next=/new">Sign up to save</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}

/** Full-height app frame: header on top, the page filling the rest of the window below. */
export function AppFrame({ user, children }: AppHeaderProps & { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-surface">
      <AppHeader user={user} />
      <main className="min-h-0 flex-1 overflow-auto">{children}</main>
    </div>
  );
}
