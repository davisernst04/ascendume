"use client";

import { useCallback } from "react";
import { useResume } from "@/lib/resume-context";
import { replaceBullet } from "@/lib/bullet-text";
import type { Bullet } from "@/lib/review/bullets";

/** Writes accepted AI proposals back into the resume. */
export function useBulletEdits() {
  const { resumeData, updateExperience, updateProject } = useResume();

  /** Is the job this bullet belongs to ongoing? Decides present vs past tense. */
  const isCurrent = useCallback(
    (bullet: Bullet) =>
      bullet.section === "experience" &&
      Boolean(resumeData.experience.find((e) => e.id === bullet.entryId)?.current),
    [resumeData.experience]
  );

  /** Replaces one bullet. Returns false if the bullet was edited since the proposal was made. */
  const applyRewrite = useCallback(
    (bullet: Bullet, text: string): boolean => {
      if (bullet.section === "experience") {
        const entry = resumeData.experience.find((e) => e.id === bullet.entryId);
        const next = entry && replaceBullet(entry.bullets, bullet.index, bullet.text, text);
        if (!next) return false;
        updateExperience(entry.id, { bullets: next });
        return true;
      }
      const entry = resumeData.projects.find((p) => p.id === bullet.entryId);
      const next = entry && replaceBullet(entry.description, bullet.index, bullet.text, text);
      if (!next) return false;
      updateProject(entry.id, { description: next });
      return true;
    },
    [resumeData.experience, resumeData.projects, updateExperience, updateProject]
  );

  return { isCurrent, applyRewrite };
}
