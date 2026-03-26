"use client";

import { createContext, useContext, useState, ReactNode } from "react";

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

export interface Skills {
  technical: string;
  frameworks: string;
  tools: string;
}

export interface ResumeData {
  title: string;
  personalInfo: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: Skills;
  projects: Project[];
  certifications: Certification[];
}

const defaultResumeData: ResumeData = {
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
  skills: {
    technical: "",
    frameworks: "",
    tools: "",
  },
  projects: [],
  certifications: [],
};

interface ResumeContextType {
  resumeData: ResumeData;
  updateTitle: (title: string) => void;
  updatePersonalInfo: (info: Partial<PersonalInfo>) => void;
  addExperience: (exp?: Partial<Experience>) => void;
  updateExperience: (id: string, exp: Partial<Experience>) => void;
  removeExperience: (id: string) => void;
  addEducation: (edu?: Partial<Education>) => void;
  updateEducation: (id: string, edu: Partial<Education>) => void;
  removeEducation: (id: string) => void;
  updateSkills: (skills: Partial<Skills>) => void;
  addProject: (proj?: Partial<Project>) => void;
  updateProject: (id: string, proj: Partial<Project>) => void;
  removeProject: (id: string) => void;
  addCertification: (cert?: Partial<Certification>) => void;
  updateCertification: (id: string, cert: Partial<Certification>) => void;
  removeCertification: (id: string) => void;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export function ResumeProvider({ children }: { children: ReactNode }) {
  const [resumeData, setResumeData] = useState<ResumeData>(defaultResumeData);

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
      id: Date.now().toString(),
      company: exp?.company || "",
      position: exp?.position || "",
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

  const updateSkills = (skills: Partial<Skills>) => {
    setResumeData((prev) => ({
      ...prev,
      skills: { ...prev.skills, ...skills },
    }));
  };

  const addProject = (proj?: Partial<Project>) => {
    const newProj: Project = {
      id: Date.now().toString(),
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
        updateTitle,
        updatePersonalInfo,
        addExperience,
        updateExperience,
        removeExperience,
        addEducation,
        updateEducation,
        removeEducation,
        updateSkills,
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