"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useResume } from "@/lib/resume-context";
import { useSession } from "@/lib/auth-client";

interface GuidedStartProps {
  /** Show even if the resume already has entries (arrived via "Build one with AI"). */
  forceOpen: boolean;
  /** Called with the section and id of the entry just added, so its interview opens. */
  onStart: (section: "experience" | "projects", entryId: string) => void;
}

/** The entry point to the guided build: pick a job or project, then answer questions about it. */
export function GuidedStart({ forceOpen, onStart }: GuidedStartProps) {
  const { resumeData, addExperience, addProject } = useResume();
  const { data: session, isPending } = useSession();
  const [dismissed, setDismissed] = useState(false);
  const empty = resumeData.experience.length === 0 && resumeData.projects.length === 0;
  if (dismissed || !(forceOpen || empty)) return null;

  const start = (section: "experience" | "projects") => {
    const id = crypto.randomUUID();
    if (section === "experience") addExperience({ id });
    else addProject({ id });
    setDismissed(true);
    onStart(section, id);
  };

  return (
    <aside className="relative rounded-lg border border-brand/30 bg-brand-wash/60 p-4 pr-12" aria-labelledby="guided-start-h">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setDismissed(true)}
        aria-label="Hide this"
        className="absolute right-2 top-2"
      >
        <X />
      </Button>
      <h2 id="guided-start-h" className="text-lg font-bold leading-snug text-ink">
        Not sure what to write? Answer questions instead.
      </h2>
      <p className="mt-1 max-w-prose text-[0.9375rem] leading-snug text-ink-soft">
        Pick something you&apos;ve done and answer a few plain questions about it. You get bullets drafted only from
        what you said. Class projects, hackathons, clubs, labs and part-time jobs all count.
        {!isPending && !session?.user && " Drafting uses AI, so it needs a free account. What you've typed is kept when you sign up."}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => start("experience")}>
          A job, internship or role
        </Button>
        <Button size="sm" variant="outline" onClick={() => start("projects")}>
          A project
        </Button>
      </div>
    </aside>
  );
}
