"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSession } from "./auth-client";
import { useResume, ResumeData, Experience, Education, Project, Certification } from "./resume-context";

const STORAGE_KEY = "ascendume_resume_draft";
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

interface DbSkills {
  technical?: string;
  frameworks?: string;
  tools?: string;
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
  personalInfo?: DbPersonalInfo[];
  workExperience?: DbWorkExperience[];
  education?: DbEducation[];
  skills?: DbSkills;
  projects?: DbProject[];
  certifications?: DbCertification[];
}

export function useResumePersistence() {
  const { data: session, isPending } = useSession();
  const { resumeData, setResumeData } = useResume();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resumeIdRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef(true);

  // Load resume on mount
  useEffect(() => {
    if (isPending) return;

    const loadResume = async () => {
      if (session?.user) {
        // Try to load from database
        try {
          const response = await fetch("/api/resumes");
          if (response.ok) {
            const resumes: DbResume[] = await response.json();
            if (resumes.length > 0) {
              // Load the most recent resume
              const resume = resumes[0];
              resumeIdRef.current = resume.id;
              
              // Transform database format to context format
              setResumeData({
                title: resume.title,
                personalInfo: {
                  fullName: resume.personalInfo?.[0]?.fullName || "",
                  email: resume.personalInfo?.[0]?.email || "",
                  phone: resume.personalInfo?.[0]?.phone || "",
                  location: resume.personalInfo?.[0]?.location || "",
                  summary: resume.personalInfo?.[0]?.summary || "",
                  website: resume.personalInfo?.[0]?.website || "",
                  linkedin: resume.personalInfo?.[0]?.linkedin || "",
                  github: resume.personalInfo?.[0]?.github || "",
                },
                experience: (resume.workExperience || []).map((exp: DbWorkExperience): Experience => ({
                  id: exp.id,
                  company: exp.company || "",
                  position: exp.position || "",
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
                skills: {
                  technical: resume.skills?.technical || "",
                  frameworks: resume.skills?.frameworks || "",
                  tools: resume.skills?.tools || "",
                },
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
              });
              isInitialLoadRef.current = false;
              return;
            }
          }
        } catch (error) {
          console.error("Error loading resume from database:", error);
        }
      }

      // Fall back to localStorage
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setResumeData(parsed);
        } catch (e) {
          console.error("Error parsing saved resume:", e);
        }
      }
      isInitialLoadRef.current = false;
    };

    loadResume();
  }, [session?.user, isPending, setResumeData]);

  // Save resume with debouncing
  const saveResume = useCallback(async (data: ResumeData) => {
    if (isInitialLoadRef.current) return;

    if (session?.user) {
      // Save to database
      try {
        if (resumeIdRef.current) {
          // Update existing
          await fetch(`/api/resumes/${resumeIdRef.current}`, {
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
          if (response.ok) {
            const resume = await response.json();
            resumeIdRef.current = resume.id;
          }
        }
      } catch (error) {
        console.error("Error saving resume to database:", error);
      }
    } else {
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [session?.user]);

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
    isSaving: false, // Could track save state if needed
  };
}