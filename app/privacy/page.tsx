import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

export const metadata: Metadata = {
  title: "Privacy - Ascendume",
  description: "What Ascendume stores, where your resume text goes, and how to delete it.",
};

const UPDATED = "November 18, 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-[1.5625rem] font-extrabold text-ink">{title}</h2>
      <div className="space-y-3 text-ink-soft leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface text-ink">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10">
        <div className="space-y-4">
          <Wordmark />
          <div className="h-6" aria-hidden />
          <h1 className="text-[3.052rem] font-extrabold leading-none text-ink">Privacy</h1>
          <p className="text-lg leading-relaxed text-ink-soft">
            The short version: we store what you need to keep your resumes, your resume text goes to OpenAI only when
            you click an AI feature, nothing is used for training, and you can delete everything yourself.
          </p>
          <p className="text-sm text-ink-soft">Last updated {UPDATED}</p>
        </div>

        <Section title="What we store">
          <p>
            <strong className="text-ink">If you don&apos;t have an account,</strong> your resume stays in your
            browser. We don&apos;t receive it. The automatic review checks and the live preview run in your browser
            too.
          </p>
          <p>
            <strong className="text-ink">If you have an account,</strong> we store:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>your name and email, and either a hashed password or the ID of the GitHub, Google or Microsoft account you sign in with;</li>
            <li>sign-in sessions, which record your IP address and browser type;</li>
            <li>the resumes you save, and a copy of any PDF you upload;</li>
            <li>how many AI reviews, rewrites and imports you used each day, to enforce the daily limits.</li>
          </ul>
        </Section>

        <Section title="Where your resume text goes">
          <p>
            Your resume text is sent to OpenAI only when you click one of these: upload a PDF (to read it into the
            builder), run the AI review, add a number to a bullet, or draft bullets from your answers. Each sends only
            what that feature needs.
          </p>
          <p>
            Nothing is used for training. We don&apos;t train anything on your resume, and OpenAI&apos;s API terms say
            data sent through the API isn&apos;t used to train their models. OpenAI may keep it for up to 30 days to
            monitor for abuse.
          </p>
        </Section>

        <Section title="Analytics">
          <p>We count six things, to see whether the site is useful: a visit, starting a resume (and whether by building or reviewing), importing a PDF, running a review, accepting an AI rewrite, and exporting (PDF or .tex).</p>
          <p>
            Each event stores its name, the time, your account ID if you&apos;re signed in, and a random ID kept in your
            browser so we can tell whether people come back. They never contain resume content. Vercel Web Analytics
            also counts page views, without cookies.
          </p>
        </Section>

        <Section title="Services we use">
          <ul className="list-disc pl-5 space-y-1">
            <li>Vercel hosts the site and stores uploaded PDFs.</li>
            <li>Neon hosts the database.</li>
            <li>OpenAI runs the AI features, as described above.</li>
            <li>The PDF viewer&apos;s code loads from unpkg.com, which sees your IP address like any website you load files from.</li>
          </ul>
          <p>We don&apos;t sell your data or share it with anyone else.</p>
        </Section>

        <Section title="Deleting your data">
          <p>
            Signed in, go to{" "}
            <Link href="/account" className="font-semibold text-brand hover:underline">
              Account
            </Link>{" "}
            and choose <em>Delete my account and data</em>. That removes your account, resumes, uploaded PDFs, sign-in
            methods, usage counts and the analytics events tied to your account, immediately.
          </p>
          <p>Without an account, clearing this site&apos;s data in your browser removes your draft.</p>
        </Section>

        <Section title="Questions">
          <p>
            Open an issue on{" "}
            <a href="https://github.com/davisernst04/ascendume/issues" className="font-semibold text-brand hover:underline">
              GitHub
            </a>
            .
          </p>
        </Section>
      </div>
    </div>
  );
}
