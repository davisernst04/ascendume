"use client";

import { useState } from "react";
import { Briefcase, FolderKanban, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useResume } from "@/lib/resume-context";

interface GuidedStartProps {
  /** Show even if the resume already has entries (arrived via "Build one with AI"). */
  forceOpen: boolean;
  /** Called with the section and id of the entry just added, so its interview opens. */
  onStart: (section: "experience" | "projects", entryId: string) => void;
}

/** The entry point to the guided build: pick a job or project, then answer questions about it. */
export function GuidedStart({ forceOpen, onStart }: GuidedStartProps) {
  const { resumeData, addExperience, addProject } = useResume();
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
    <div className="relative rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-3">
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
      <h2 className="text-lg font-semibold">Build it by answering questions</h2>
      <p className="text-sm text-muted-foreground">
        Pick something you&apos;ve done, answer a few plain questions about it, and get bullets drafted from your
        answers. Nothing gets added that you didn&apos;t say. Class projects, hackathons, clubs, labs and part-time
        jobs all count.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="gap-1.5" onClick={() => start("experience")}>
          <Briefcase className="h-3.5 w-3.5" /> A job, internship or role
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => start("projects")}>
          <FolderKanban className="h-3.5 w-3.5" /> A project
        </Button>
      </div>
    </div>
  );
}
