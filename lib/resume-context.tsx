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

// Jake's Resume Template (default template for Ascendume)
export const jakesResumeTemplate: ResumeData = {
  title: "John Doe - Resume",
  personalInfo: {
    fullName: "John Doe",
    email: "john.doe@example.com",
    phone: "(555) 123-4567",
    location: "San Francisco, CA",
    summary: "Results-driven software engineer with 5+ years of experience building scalable web applications. Expert in full-stack development, cloud architecture, and agile methodologies. Proven track record of delivering high-quality software solutions that drive business growth.",
    website: "https://johndoe.com",
    linkedin: "linkedin.com/in/johndoe",
    github: "github.com/johndoe",
  },
  experience: [
    {
      id: "exp1",
      company: "Tech Corp",
      position: "Senior Software Engineer",
      startDate: "2020",
      endDate: "Present",
      current: true,
      bullets: "Led development of a microservices architecture that improved system scalability by 300%\nDesigned and implemented RESTful APIs handling 10K+ requests per second\nMentored 4 junior developers and established coding best practices\nOptimized database queries resulting in 40% faster page load times\nCollaborated with cross-functional teams to deliver features on time",
    },
    {
      id: "exp2",
      company: "Startup Inc",
      position: "Software Engineer",
      startDate: "2018",
      endDate: "2020",
      current: false,
      bullets: "Developed responsive web applications using React and Node.js\nIntegrated third-party APIs including payment processing and analytics\nImplemented CI/CD pipelines reducing deployment time by 60%\nConducted code reviews and ensured high code quality\nParticipated in Agile sprints and daily standups",
    },
    {
      id: "exp3",
      company: "Web Solutions",
      position: "Junior Developer",
      startDate: "2016",
      endDate: "2018",
      current: false,
      bullets: "Built client websites using HTML, CSS, and JavaScript\nAssisted in database design and maintenance\nCollaborated with designers to implement UI/UX specifications\nTroubleshot and resolved bug reports",
    },
  ],
  education: [
    {
      id: "edu1",
      institution: "University of Texas",
      degree: "Bachelor of Science",
      field: "Computer Science",
      gpa: "3.8/4.0",
      graduationDate: "2016",
    },
  ],
  skills: {
    technical: "JavaScript, TypeScript, Python, Java, C#",
    frameworks: "React, Next.js, Node.js, Express, Django",
    tools: "Git, Docker, AWS, Kubernetes, CI/CD",
  },
  projects: [
    {
      id: "proj1",
      name: "E-commerce Platform",
      url: "https://github.com/johndoe/ecommerce",
      technologies: "React, Node.js, PostgreSQL, AWS",
      description: "Developed a full-stack e-commerce application with 10K+ products, featuring secure payment processing, user authentication, and real-time inventory management.",
    },
    {
      id: "proj2",
      name: "Task Management App",
      url: "https://github.com/johndoe/tasks",
      technologies: "Next.js, TypeScript, MongoDB",
      description: "Created a productivity application with drag-and-drop task management, team collaboration features, and mobile-responsive design.",
    },
    {
      id: "proj3",
      name: "Weather Dashboard",
      url: "https://github.com/johndoe/weather",
      technologies: "Vue.js, Chart.js, OpenWeather API",
      description: "Built a real-time weather tracking application with location-based forecasts, historical data visualization, and custom alert system.",
    },
  ],
  certifications: [
    {
      id: "cert1",
      name: "AWS Certified Solutions Architect",
      issuer: "Amazon Web Services",
      date: "2022",
      credentialUrl: "https://aws.amazon.com/certification",
    },
    {
      id: "cert2",
      name: "Microsoft Certified: Azure Developer Associate",
      issuer: "Microsoft",
      date: "2021",
      credentialUrl: "https://learn.microsoft.com/en-us/certifications/",
    },
  ],
};

export const resumeTemplates = {
  jake: jakesResumeTemplate,
};

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
  setResumeData: (data: ResumeData) => void;
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
        setResumeData,
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
