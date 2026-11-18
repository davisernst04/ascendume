"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import {
  type SkillCategory,
  defaultSkillCategories,
  newSkillCategory,
} from "@/lib/skill-categories";

export type { SkillCategory };

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  website: string;
  linkedin: string;
  github: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  gpa: string;
  graduationDate: string;
}

export interface Project {
  id: string;
  name: string;
  url: string;
  technologies: string;
  description: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  credentialUrl: string;
}

export interface ResumeData {
  id?: string;
  title: string;
  personalInfo: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: SkillCategory[];
  projects: Project[];
  certifications: Certification[];
}

const createDefaultResumeData = (): ResumeData => ({
  title: "My Resume",
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
    website: "",
    linkedin: "",
    github: "",
  },
  experience: [],
  education: [],
  skills: defaultSkillCategories(),
  projects: [],
  certifications: [],
});

interface ResumeContextType {
  resumeData: ResumeData;
  setResumeData: (data: ResumeData) => void;
  updateTitle: (title: string) => void;
  updatePersonalInfo: (info: Partial<PersonalInfo>) => void;
  addExperience: (exp?: Partial<Experience>) => void;
  updateExperience: (id: string, exp: Partial<Experience>) => void;
  removeExperience: (id: string) => void;
  addEducation: (edu?: Partial<Education>) => void;
  updateEducation: (id: string, edu: Partial<Education>) => void;
  removeEducation: (id: string) => void;
  addSkillCategory: (category?: Partial<SkillCategory>) => void;
  updateSkillCategory: (id: string, category: Partial<SkillCategory>) => void;
  removeSkillCategory: (id: string) => void;
  addProject: (proj?: Partial<Project>) => void;
  updateProject: (id: string, proj: Partial<Project>) => void;
  removeProject: (id: string) => void;
  addCertification: (cert?: Partial<Certification>) => void;
  updateCertification: (id: string, cert: Partial<Certification>) => void;
  removeCertification: (id: string) => void;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export function ResumeProvider({ children }: { children: ReactNode }) {
  const [resumeData, setResumeData] = useState<ResumeData>(createDefaultResumeData);

  const updateTitle = (title: string) => {
    setResumeData((prev) => ({ ...prev, title }));
  };

  const updatePersonalInfo = (info: Partial<PersonalInfo>) => {
    setResumeData((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, ...info },
    }));
  };

  const addExperience = (exp?: Partial<Experience>) => {
    const newExp: Experience = {
      id: exp?.id || crypto.randomUUID(),
      company: exp?.company || "",
      position: exp?.position || "",
      location: exp?.location || "",
      startDate: exp?.startDate || "",
      endDate: exp?.endDate || "",
      current: exp?.current || false,
      bullets: exp?.bullets || "",
    };
    setResumeData((prev) => ({
      ...prev,
      experience: [...prev.experience, newExp],
    }));
  };

  const updateExperience = (id: string, exp: Partial<Experience>) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((e) =>
        e.id === id ? { ...e, ...exp } : e
      ),
    }));
  };

  const removeExperience = (id: string) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.filter((e) => e.id !== id),
    }));
  };

  const addEducation = (edu?: Partial<Education>) => {
    const newEdu: Education = {
      id: Date.now().toString(),
      institution: edu?.institution || "",
      degree: edu?.degree || "",
      field: edu?.field || "",
      gpa: edu?.gpa || "",
      graduationDate: edu?.graduationDate || "",
    };
    setResumeData((prev) => ({
      ...prev,
      education: [...prev.education, newEdu],
    }));
  };

  const updateEducation = (id: string, edu: Partial<Education>) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.map((e) =>
        e.id === id ? { ...e, ...edu } : e
      ),
    }));
  };

  const removeEducation = (id: string) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.filter((e) => e.id !== id),
    }));
  };

  const addSkillCategory = (category?: Partial<SkillCategory>) => {
    setResumeData((prev) => ({
      ...prev,
      skills: [...prev.skills, newSkillCategory(category)],
    }));
  };

  const updateSkillCategory = (id: string, category: Partial<SkillCategory>) => {
    setResumeData((prev) => ({
      ...prev,
      skills: prev.skills.map((c) => (c.id === id ? { ...c, ...category } : c)),
    }));
  };

  const removeSkillCategory = (id: string) => {
    setResumeData((prev) => ({
      ...prev,
      skills: prev.skills.filter((c) => c.id !== id),
    }));
  };

  const addProject = (proj?: Partial<Project>) => {
    const newProj: Project = {
      id: proj?.id || crypto.randomUUID(),
      name: proj?.name || "",
      url: proj?.url || "",
      technologies: proj?.technologies || "",
      description: proj?.description || "",
    };
    setResumeData((prev) => ({
      ...prev,
      projects: [...prev.projects, newProj],
    }));
  };

  const updateProject = (id: string, proj: Partial<Project>) => {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === id ? { ...p, ...proj } : p
      ),
    }));
  };

  const removeProject = (id: string) => {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
    }));
  };

  const addCertification = (cert?: Partial<Certification>) => {
    const newCert: Certification = {
      id: Date.now().toString(),
      name: cert?.name || "",
      issuer: cert?.issuer || "",
      date: cert?.date || "",
      credentialUrl: cert?.credentialUrl || "",
    };
    setResumeData((prev) => ({
      ...prev,
      certifications: [...prev.certifications, newCert],
    }));
  };

  const updateCertification = (id: string, cert: Partial<Certification>) => {
    setResumeData((prev) => ({
      ...prev,
      certifications: prev.certifications.map((c) =>
        c.id === id ? { ...c, ...cert } : c
      ),
    }));
  };

  const removeCertification = (id: string) => {
    setResumeData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((c) => c.id !== id),
    }));
  };

  return (
    <ResumeContext.Provider
      value={{
        resumeData,
        setResumeData,
        updateTitle,
        updatePersonalInfo,
        addExperience,
        updateExperience,
        removeExperience,
        addEducation,
        updateEducation,
        removeEducation,
        addSkillCategory,
        updateSkillCategory,
        removeSkillCategory,
        addProject,
        updateProject,
        removeProject,
        addCertification,
        updateCertification,
        removeCertification,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
}

export function useResume() {
  const context = useContext(ResumeContext);
  if (context === undefined) {
    throw new Error("useResume must be used within a ResumeProvider");
  }
  return context;
}