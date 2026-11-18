// The browser copy of an unsaved resume: what guests build at /new, carried into
// the account when they sign up or sign in. Storage can be missing or blocked
// (private windows, cleared site data), so every access is guarded.
import type { ResumeData } from "@/lib/resume-context";
import { normalizeSkillCategories } from "@/lib/skill-categories";

const STORAGE_KEY = "ascendume_resume_draft";

export function readDraft(): ResumeData | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    // A draft is never tied to a saved resume, so drop any stale id.
    return { ...parsed, id: undefined, skills: normalizeSkillCategories(parsed.skills) };
  } catch {
    return null;
  }
}

export function writeDraft(data: ResumeData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage unavailable: the draft lives only in memory for this visit.
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}
