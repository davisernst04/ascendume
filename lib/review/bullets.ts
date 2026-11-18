import type { ResumeData } from "@/lib/resume-context";
import { parseBullets } from "@/lib/resume-latex";

/** Builder sections a finding can point the user to (same strings as the builder's tabs). */
export type ResumeSection =
  | "personal"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications";

export interface Bullet {
  /** `<section>:<entryId>:<index>`. Stable until the bullet list is edited, which outdates the review anyway. */
  id: string;
  section: "experience" | "projects";
  entryId: string;
  index: number;
  text: string;
  /** "Software Intern, Acme" or a project name, for showing where the bullet is. */
  entryLabel: string;
  /** A job that has ended. Projects are never treated as past roles. */
  pastRole: boolean;
}

const PRESENT_END = /^(present|current|now|ongoing)$/i;

export function isPastRole(exp: ResumeData["experience"][number]): boolean {
  if (exp.current) return false;
  const end = exp.endDate.trim();
  return end !== "" && !PRESENT_END.test(end);
}

/** Every bullet in the resume, in display order, with a stable id. */
export function extractBullets(data: ResumeData): Bullet[] {
  const bullets: Bullet[] = [];
  for (const exp of data.experience) {
    const label = [exp.position, exp.company].filter(Boolean).join(", ") || "Untitled role";
    parseBullets(exp.bullets || "").forEach((text, index) => {
      bullets.push({
        id: `experience:${exp.id}:${index}`,
        section: "experience",
        entryId: exp.id,
        index,
        text,
        entryLabel: label,
        pastRole: isPastRole(exp),
      });
    });
  }
  for (const proj of data.projects) {
    parseBullets(proj.description || "").forEach((text, index) => {
      bullets.push({
        id: `projects:${proj.id}:${index}`,
        section: "projects",
        entryId: proj.id,
        index,
        text,
        entryLabel: proj.name || "Untitled project",
        pastRole: false,
      });
    });
  }
  return bullets;
}
