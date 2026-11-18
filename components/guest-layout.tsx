import Link from "next/link";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { SidebarProvider } from "@/components/sidebar-context";

/** Shell for signed-out visitors using the builder: no sidebar, a prompt to save. */
export function GuestLayout({ children }: { children: ReactNode }) {
  return (
    // Closed sidebar = no sidebar column, so the builder gives the preview the full width.
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
        <header className="flex h-12 shrink-0 items-center gap-4 border-b border-border px-4">
          <Link href="/" className="font-bold text-lg tracking-tighter">
            ascendume
          </Link>
          <p className="hidden sm:block text-sm text-muted-foreground">
            Your draft is saved in this browser only.
          </p>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/auth/sign-in?next=/new">
              <Button size="sm" variant="ghost" className="h-8">
                Sign in
              </Button>
            </Link>
            <Link href="/auth/sign-up?next=/new">
              <Button size="sm" className="h-8 font-bold">
                Sign up to save
              </Button>
            </Link>
          </div>
        </header>
        <main className="flex-1 min-h-0 overflow-auto">{children}</main>
      </div>
    </SidebarProvider>
  );
}
