import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";
import { HeroResume, SCORE_DONE_AT } from "@/components/landing/hero-resume";
import { HeroHeadline, HEADLINE_DONE_AT } from "@/components/landing/hero-headline";

// Upload → parse → builder → review. Guests are sent through sign-up first,
// because parsing runs on the server.
const REVIEW_HREF = "/review";
// Guests can build without an account; the draft stays in their browser.
const BUILD_HREF = "/new?guided=1";

const shell = "mx-auto w-full max-w-[90rem] px-4 sm:px-8 lg:px-12";
// The sheet is sized by the window height so the page never scrolls.
const sheetWidth = "lg:w-[min(32rem,calc((100dvh-10rem)*0.773),38vw)]";
const at = (s: number) => ({ "--at": `${s}s` }) as React.CSSProperties;

/**
 * The whole landing page is one screen on a notebook-cover background. Phones
 * stack headline, resume, then the buttons, the resume and button row spanning the
 * navbar's width (the resume crops from the bottom on short screens); desktop gives the headline the wide
 * left column and puts the resume, mid ATS scan, on the right. The buttons wipe
 * in once the headline lands, and "Review my resume" pulses when the score hits 100.
 */
export default function LandingPage() {
  return (
    <div className="notebook-cover relative flex h-dvh flex-col overflow-hidden text-ink">
      <header className="relative z-10 shrink-0 border-b border-rule-strong/40 bg-surface">
        <div className={`${shell} flex h-16 items-center justify-between gap-4`}>
          <Wordmark className="text-[1.5rem]" />
          <nav aria-label="Account" className="flex items-center gap-1.5">
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/sign-in">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={BUILD_HREF}>Start building</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main
        className={`${shell} relative grid min-h-0 flex-1 items-center gap-y-5 py-5 [align-content:safe_center] grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,max-content)_auto] lg:grid-cols-[minmax(0,1fr)_auto] lg:grid-rows-[auto_auto] lg:gap-x-[clamp(4rem,7vw,8rem)] lg:gap-y-[clamp(1.5rem,5vh,3.5rem)]`}
      >
        <div className="@container lg:self-end">
          <HeroHeadline className="text-[min(16cqi,8.5vh)] leading-[0.92] tracking-[-0.025em] lg:text-[min(28.5cqi,26vh)]" />
        </div>

        <HeroResume
          className={`w-full max-lg:min-h-0 max-lg:self-stretch lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mr-[4%] ${sheetWidth}`}
        />

        <div className="flex gap-3 lg:gap-4 lg:self-start">
          <Link
            href={REVIEW_HREF}
            className="cta cta-marker"
            style={{ ...at(HEADLINE_DONE_AT - 0.1), "--ping": `${SCORE_DONE_AT}s` } as React.CSSProperties}
          >
            <span className="cta-label">
              Review my resume
              <ArrowRight className="cta-arrow" strokeWidth={2.5} />
            </span>
          </Link>
          <Link href={BUILD_HREF} className="cta cta-outline" style={at(HEADLINE_DONE_AT + 0.08)}>
            <span className="cta-label">
              <Sparkles className="cta-sparkle" strokeWidth={2.25} />
              Build one with AI
            </span>
          </Link>
        </div>
      </main>

      <footer className={`${shell} relative flex h-10 shrink-0 items-center justify-center gap-6 text-sm text-ink-soft`}>
        <Link href="/privacy" className="hover:text-ink hover:underline">
          Privacy
        </Link>
        <span>© 2026 Ascendume</span>
      </footer>
    </div>
  );
}
