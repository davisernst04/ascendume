"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "./auth-client";
import { useResume, ResumeData, Experience, Education, Project, Certification } from "./resume-context";
import { normalizeSkillCategories } from "./skill-categories";
import { clearDraft, readDraft, writeDraft } from "./resume-draft";

const DEBOUNCE_MS = 1000;

// Database query result types
interface DbPersonalInfo {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  website?: string;
  linkedin?: string;
  github?: string;
}

interface DbWorkExperience {
  id: string;
  company?: string;
  position?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  bullets?: string;
}

interface DbEducation {
  id: string;
  institution?: string;
  degree?: string;
  field?: string;
  gpa?: string;
  graduationDate?: string;
}

interface DbSkillCategory {
  id: string;
  label?: string;
  items?: string;
}

interface DbProject {
  id: string;
  name?: string;
  url?: string;
  technologies?: string;
  description?: string;
}

interface DbCertification {
  id: string;
  name?: string;
  issuer?: string;
  date?: string;
  credentialUrl?: string;
}

interface DbResume {
  id: string;
  title: string;
  personalInfo?: DbPersonalInfo | null;
  workExperience?: DbWorkExperience[];
  education?: DbEducation[];
  skillCategories?: DbSkillCategory[];
  projects?: DbProject[];
  certifications?: DbCertification[];
}

/** The saved content of a resume (not its id), to tell whether anything changed. */
function savedFingerprint(data: ResumeData): string {
  const { title, personalInfo, experience, education, skills, projects, certifications } = data;
  return JSON.stringify({ title, personalInfo, experience, education, skills, projects, certifications });
}

export function useResumePersistence(resumeId?: string) {
  const { data: session, isPending } = useSession();
  const { resumeData, setResumeData } = useResume();
  const router = useRouter();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resumeIdRef = useRef<string | null>(resumeId && resumeId !== "new" ? resumeId : null);
  const isInitialLoadRef = useRef(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  // What the database holds, so loading a resume (or an id being added) doesn't trigger a save.
  const lastSavedRef = useRef<string | null>(null);
  // One save at a time: each PUT deletes and re-inserts sections, so overlapping
  // saves could interleave. Edits made meanwhile are saved right after.
  const savingRef = useRef(false);
  const pendingSaveRef = useRef<ResumeData | null>(null);

  // Load resume on mount
  useEffect(() => {
    if (isPending) return;

    const loadResume = async () => {
      if (resumeId === "new") {
        // A guest's browser draft. When the user is signed in, setting it here
        // triggers the first save, which creates the resume in their account.
        const draft = readDraft();
        if (draft) setResumeData(draft);
        isInitialLoadRef.current = false;
        return;
      }

      if (session?.user && resumeId) {
        // Try to load from database
        try {
          const response = await fetch(`/api/resumes/${resumeId}`);
          if (response.ok) {
            const resume: DbResume = await response.json();
            
            // Transform database format to context format
            const loaded: ResumeData = {
              id: resume.id,
              title: resume.title,
              personalInfo: {
                fullName: resume.personalInfo?.fullName || "",
                email: resume.personalInfo?.email || "",
                phone: resume.personalInfo?.phone || "",
                location: resume.personalInfo?.location || "",
                summary: resume.personalInfo?.summary || "",
                website: resume.personalInfo?.website || "",
                linkedin: resume.personalInfo?.linkedin || "",
                github: resume.personalInfo?.github || "",
              },
              experience: (resume.workExperience || []).map((exp: DbWorkExperience): Experience => ({
                id: exp.id,
                company: exp.company || "",
                position: exp.position || "",
                location: exp.location || "",
                startDate: exp.startDate || "",
                endDate: exp.endDate || "",
                current: exp.current || false,
                bullets: exp.bullets || "",
              })),
              education: (resume.education || []).map((edu: DbEducation): Education => ({
                id: edu.id,
                institution: edu.institution || "",
                degree: edu.degree || "",
                field: edu.field || "",
                gpa: edu.gpa || "",
                graduationDate: edu.graduationDate || "",
              })),
              skills: normalizeSkillCategories(resume.skillCategories ?? []),
              projects: (resume.projects || []).map((proj: DbProject): Project => ({
                id: proj.id,
                name: proj.name || "",
                url: proj.url || "",
                technologies: proj.technologies || "",
                description: proj.description || "",
              })),
              certifications: (resume.certifications || []).map((cert: DbCertification): Certification => ({
                id: cert.id,
                name: cert.name || "",
                issuer: cert.issuer || "",
                date: cert.date || "",
                credentialUrl: cert.credentialUrl || "",
              })),
            };
            setResumeData(loaded);
            lastSavedRef.current = savedFingerprint(loaded);
            isInitialLoadRef.current = false;
            return;
          }
        } catch (error) {
          console.error("Error loading resume from database:", error);
        }
      }

      isInitialLoadRef.current = false;
    };

    loadResume().finally(() => setIsLoaded(true));
  }, [session?.user, isPending, setResumeData, resumeId]);

  // Save resume with debouncing
  const saveResume = useCallback(async (data: ResumeData): Promise<void> => {
    const writeResume = async (data: ResumeData, fingerprint: string) => {
      if (session?.user) {
        // Save to database
        try {
          if (resumeIdRef.current) {
            // Update existing
            const response = await fetch(`/api/resumes/${resumeIdRef.current}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: data.title,
                personalInfoData: data.personalInfo,
                workExperienceData: data.experience,
                educationData: data.education,
                skillsData: data.skills,
                projectsData: data.projects,
                certificationsData: data.certifications,
              }),
            });
            if (!response.ok) throw new Error(`Save failed (${response.status})`);
            lastSavedRef.current = fingerprint;
          } else {
            // Create new
            const response = await fetch("/api/resumes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: data.title,
                personalInfoData: data.personalInfo,
                workExperienceData: data.experience,
                educationData: data.education,
                skillsData: data.skills,
                projectsData: data.projects,
                certificationsData: data.certifications,
              }),
            });
            if (!response.ok) throw new Error(`Save failed (${response.status})`);
            const resume = await response.json();
            clearDraft(); // the draft now lives in the account
            resumeIdRef.current = resume.id;
            lastSavedRef.current = fingerprint;
            setResumeData({ ...data, id: resume.id });
            router.replace(`/${resume.id}`);
          }
          return true;
        } catch (error) {
          console.error("Error saving resume to database:", error);
          return false;
        }
      }
      writeDraft(data);
      return true;
    };

    if (isInitialLoadRef.current) return;
    if (savingRef.current) {
      pendingSaveRef.current = data;
      return;
    }
    savingRef.current = true;
    try {
      let current: ResumeData | null = data;
      let ok = true;
      while (current) {
        const fingerprint = savedFingerprint(current);
        if (!(session?.user && fingerprint === lastSavedRef.current)) {
          if (session?.user) setSaveState("saving");
          ok = await writeResume(current, fingerprint);
        }
        current = pendingSaveRef.current;
        pendingSaveRef.current = null;
      }
      setSaveState(ok ? "saved" : "error");
    } finally {
      savingRef.current = false;
    }
  }, [session?.user, setResumeData, router]);


  // Debounced save on data change
  useEffect(() => {
    if (isInitialLoadRef.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveResume(resumeData);
    }, DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [resumeData, saveResume]);

  return {
    /** True once the resume (or the browser draft) has been loaded into the builder. */
    isLoaded,
    /** Whether the latest edits are stored (in the account, or in this browser for guests). */
    saveState,
  };
}

export type SaveState = "saved" | "saving" | "error";