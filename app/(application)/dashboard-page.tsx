import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { resumes } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { PdfDrop } from "@/components/pdf-drop";
import { ResumeRowDelete } from "@/components/resume-row-delete";
import { PenLine } from "lucide-react";

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "today", "yesterday", "3 days ago", "2 months ago". */
function editedAgo(date: Date, now = Date.now()): string {
  const days = Math.round((date.getTime() - now) / 86_400_000);
  if (days > -1) return "today";
  if (days > -30) return relative.format(days, "day");
  if (days > -365) return relative.format(Math.round(days / 30), "month");
  return relative.format(Math.round(days / 365), "year");
}

/** The signed-in home: pick up a resume where you left it, or start one. Everything fits on one screen. */
export default async function DashboardPage({ userId }: { userId: string }) {
  const userResumes = await getDb().query.resumes.findMany({
    where: eq(resumes.userId, userId),
    orderBy: [desc(resumes.updatedAt)],
    columns: { id: true, title: true, updatedAt: true },
  });
  const hasResumes = userResumes.length > 0;

  const startNew = (
    <section aria-labelledby="start-new" className="flex flex-col gap-2">
      <h2 id="start-new" className="text-xl font-bold text-ink">
        Write a new one
      </h2>
      <div className="flex flex-col gap-4 rounded-lg border border-rule bg-raised p-5">
        <p className="text-ink-soft">
          Answer a few plain questions about a job or project and get bullets drafted from what you said, or start
          blank.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/new?guided=1">Answer questions</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/new">Start blank</Link>
          </Button>
        </div>
      </div>
    </section>
  );

  const startReview = (
    <section aria-labelledby="start-review" className="flex flex-col gap-2">
      <h2 id="start-review" className="text-xl font-bold text-ink">
        Review a resume you have
      </h2>
      <PdfDrop />
    </section>
  );

  // First visit: the two ways in as two big cards, each saying what happens after you pick it.
  if (!hasResumes) {
    return (
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col justify-center-safe px-4 py-8 sm:px-6 lg:py-12">
        <h1 className="text-[2.5rem] font-bold leading-tight text-ink lg:text-[3rem]">Start your first resume</h1>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:mt-8">
          <StartCard
            id="first-review"
            title="Review a resume you have"
            next={[
              "We read your PDF into the builder, with each section filled in.",
              "A review runs and leaves notes on the lines to fix.",
              "Fix a note, run the review again, and download the new PDF.",
            ]}
          >
            <PdfDrop size="large" />
          </StartCard>
          <StartCard
            id="first-new"
            title="Write a new one"
            next={[
              "Answer plain questions about a job or project.",
              "Get bullets drafted from what you said. No numbers are made up.",
              "Edit anything, then download a typeset PDF.",
            ]}
          >
            <div className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-lg border-2 border-rule bg-mist/40 px-6 py-10 text-center">
              <PenLine className="size-6 text-ink-soft" aria-hidden />
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild size="lg">
                  <Link href="/new?guided=1">Answer questions</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/new">Start blank</Link>
                </Button>
              </div>
            </div>
          </StartCard>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid h-full w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:py-10">
      <section aria-labelledby="resume-list" className="flex min-h-0 flex-col">
        <h1 id="resume-list" className="text-[2.5rem] font-bold leading-tight text-ink">
          Your resumes
        </h1>
        {/* The list scrolls inside itself if it is long, so the start actions stay in view. */}
        <ul className="mt-4 min-h-0 flex-1 divide-y divide-rule overflow-y-auto border-y border-rule">
          {userResumes.map((r) => {
            const title = r.title || "Untitled resume";
            return (
              <li key={r.id} className="group flex items-center gap-4 py-2.5">
                <Link
                  href={`/${r.id}`}
                  className="flex min-w-0 flex-1 items-center gap-4 rounded-md py-1 pr-2 focus-visible:outline-offset-4"
                >
                  <PageGlyph />
                  <span className="min-w-0">
                    <span className="font-display block truncate text-lg font-bold text-ink group-hover:underline group-hover:decoration-rule-strong group-hover:underline-offset-4">
                      {title}
                    </span>
                    <span className="block text-sm text-ink-soft">Edited {editedAgo(r.updatedAt)}</span>
                  </span>
                </Link>
                <ResumeRowDelete resumeId={r.id} title={title} />
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex flex-col gap-6 lg:pt-[3.75rem]">
        {startNew}
        {startReview}
      </div>
    </div>
  );
}

/** One way to start: a title, the action, and what happens after it. */
function StartCard({ id, title, next, children }: { id: string; title: string; next: string[]; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-5 rounded-xl border border-rule bg-raised p-5 lg:p-8">
      <h2 id={id} className="text-2xl font-bold text-ink">
        {title}
      </h2>
      {children}
      <div className="mt-auto border-t border-rule pt-5">
        <p className="mb-3 text-xs font-bold tracking-[0.08em] text-ink-soft uppercase">What happens next</p>
        <ol className="flex flex-col gap-2.5">
          {next.map((step, i) => (
            <li key={step} className="flex gap-3 text-[0.9375rem] text-ink-soft">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-mist text-xs font-bold text-ink tabular-nums">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** A tiny letter-size sheet: the list's one reminder that each row is a page. */
function PageGlyph() {
  return (
    <span aria-hidden className="sheet flex h-11 w-[34px] shrink-0 flex-col gap-[3px] px-[5px] pt-[6px]">
      <span className="mx-auto h-[3px] w-4 rounded-full bg-[#2b2620]/70" />
      <span className="h-[2px] w-full rounded-full bg-[#2b2620]/25" />
      <span className="h-[2px] w-4/5 rounded-full bg-[#2b2620]/25" />
      <span className="h-[2px] w-full rounded-full bg-[#2b2620]/25" />
      <span className="h-[2px] w-3/5 rounded-full bg-[#2b2620]/25" />
    </span>
  );
}
