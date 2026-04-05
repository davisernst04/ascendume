// components/ResumeBuilder.tsx
"use client";

import { useState, useRef, useCallback } from "react";
import {
  User,
  Briefcase,
  GraduationCap,
  Code,
  FolderKanban,
  Award,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  Sparkles,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResumeProvider, useResume } from "@/lib/resume-context";
import { useSidebar } from "@/components/sidebar-context";
import dynamic from "next/dynamic";
import { useResumePersistence } from "@/lib/use-resume-persistence";

const LatexPdfPreview = dynamic(
  () => import("./latex-pdf-preview").then((m) => m.LatexPdfPreview),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading PDF viewer...
      </div>
    ),
  }
);

type SectionType =
  | "personal"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications";

interface Section {
  id: string;
  type: SectionType;
  title: string;
  expanded: boolean;
}

const sectionIcons: Record<
  SectionType,
  React.ComponentType<{ className?: string }>
> = {
  personal: User,
  experience: Briefcase,
  education: GraduationCap,
  skills: Code,
  projects: FolderKanban,
  certifications: Award,
};

const defaultSections: Section[] = [
  { id: "1", type: "personal", title: "Personal Info", expanded: true },
  { id: "2", type: "experience", title: "Work Experience", expanded: false },
  { id: "3", type: "education", title: "Education", expanded: false },
  { id: "4", type: "skills", title: "Skills", expanded: false },
  { id: "5", type: "projects", title: "Projects", expanded: false },
  { id: "6", type: "certifications", title: "Certifications", expanded: false },
];

function ResumeBuilderContent({ resumeId }: { resumeId?: string }) {
  const { resumeData, setResumeData, updateTitle } = useResume();
  const { isOpen: sidebarOpen } = useSidebar();

  const [enhancing, setEnhancing] = useState(false);
  const [sections, setSections] = useState<Section[]>(defaultSections);
  const [activeSection, setActiveSection] = useState<string>("1");

  // Holds the latest generated PDF blob for download
  const pdfBlobRef = useRef<Blob | null>(null);

  useResumePersistence(resumeId);

  const handleEnhanceAll = useCallback(async () => {
    setEnhancing(true);
    try {
      const res = await fetch("/api/ai/enhance-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resumeData),
      });
      if (!res.ok) throw new Error("Enhancement failed");
      const enhanced = await res.json();
      setResumeData(enhanced);
    } catch (err) {
      console.error(err);
      alert("Failed to enhance resume. Please try again.");
    } finally {
      setEnhancing(false);
    }
  }, [resumeData, setResumeData]);

  const handleDownload = useCallback(() => {
    if (!pdfBlobRef.current) return;
    const url = URL.createObjectURL(pdfBlobRef.current);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${resumeData.title || "resume"}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [resumeData.title]);

  const toggleSection = (id: string) => {
    setSections(
      sections.map((s) => (s.id === id ? { ...s, expanded: !s.expanded } : s))
    );
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Section Tab Navbar */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shrink-0">
        <div className="px-4 h-12 flex items-center gap-1 overflow-x-auto">
          <input
            type="text"
            value={resumeData.title}
            onChange={(e) => updateTitle(e.target.value)}
            className="bg-transparent border-none text-sm font-semibold focus:outline-none focus:ring-0 w-36 shrink-0 text-foreground"
            placeholder="Resume title"
            disabled={enhancing}
          />
          <div className="h-4 w-px bg-border shrink-0 mx-2" />
          {sections.map((section) => {
            const Icon = sectionIcons[section.type];
            return (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  setSections((prev) =>
                    prev.map((s) =>
                      s.id === section.id ? { ...s, expanded: true } : s
                    )
                  );
                }}
                disabled={enhancing}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors shrink-0 ${
                  activeSection === section.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {section.title}
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-2 shrink-0 pl-4">
            <Button
              size="sm"
              variant="outline"
              className="font-medium rounded-lg gap-2 h-8"
              onClick={handleEnhanceAll}
              disabled={enhancing}
            >
              {enhancing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Enhancing…
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Enhance with AI
                </>
              )}
            </Button>
            <Button
              size="sm"
              className="font-bold shadow-lg shadow-primary/20 rounded-lg gap-2 h-8"
              onClick={handleDownload}
              disabled={enhancing}
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 min-h-0">
        {/* Center Panel - Editor */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-2xl space-y-6">
            {sections
              .filter((s) => s.id === activeSection)
              .map((section) => {
                const Icon = sectionIcons[section.type];
                return (
                  <div
                    key={section.id}
                    className="bg-card border border-border rounded-xl overflow-hidden shadow-sm"
                  >
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleSection(section.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold">{section.title}</h2>
                      </div>
                      {section.expanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    {section.expanded && (
                      <div className="p-4 pt-0 border-t border-border">
                        <SectionEditor
                          type={section.type}
                          disabled={enhancing}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right Panel - PDF Preview */}
        <div className={`overflow-y-auto hidden lg:block shrink-0 transition-all duration-300 ${sidebarOpen ? "w-[420px]" : "w-[612px]"}`}>
          <div className="pl-2 pr-4 py-6">
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <Eye className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Live Preview</h3>
              </div>
              <div className="p-4">
                <LatexPdfPreview
                  data={resumeData}
                  onPdfReady={(blob) => { pdfBlobRef.current = blob; }}
                  width={sidebarOpen ? 356 : 548}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionEditor({
  type,
  disabled,
}: {
  type: SectionType;
  disabled: boolean;
}) {
  switch (type) {
    case "personal":
      return <PersonalInfoEditor disabled={disabled} />;
    case "experience":
      return <ExperienceEditor disabled={disabled} />;
    case "education":
      return <EducationEditor disabled={disabled} />;
    case "skills":
      return <SkillsEditor disabled={disabled} />;
    case "projects":
      return <ProjectsEditor disabled={disabled} />;
    case "certifications":
      return <CertificationsEditor disabled={disabled} />;
    default:
      return null;
  }
}

const inputClass =
  "w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const labelClass = "block text-sm font-medium mb-1.5 text-foreground";

function PersonalInfoEditor({ disabled }: { disabled: boolean }) {
  const { resumeData, updatePersonalInfo } = useResume();
  const { personalInfo } = resumeData;

  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Full Name</label>
          <input
            type="text"
            className={inputClass}
            placeholder="John Doe"
            value={personalInfo.fullName}
            onChange={(e) => updatePersonalInfo({ fullName: e.target.value })}
            disabled={disabled}
          />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            className={inputClass}
            placeholder="john@example.com"
            value={personalInfo.email}
            onChange={(e) => updatePersonalInfo({ email: e.target.value })}
            disabled={disabled}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Phone</label>
          <input
            type="tel"
            className={inputClass}
            placeholder="+1 (555) 123-4567"
            value={personalInfo.phone}
            onChange={(e) => updatePersonalInfo({ phone: e.target.value })}
            disabled={disabled}
          />
        </div>
        <div>
          <label className={labelClass}>Location</label>
          <input
            type="text"
            className={inputClass}
            placeholder="San Francisco, CA"
            value={personalInfo.location}
            onChange={(e) => updatePersonalInfo({ location: e.target.value })}
            disabled={disabled}
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>Professional Summary</label>
        <textarea
          rows={4}
          className={`${inputClass} resize-none`}
          placeholder="Write a brief summary of your professional background..."
          value={personalInfo.summary}
          onChange={(e) => updatePersonalInfo({ summary: e.target.value })}
          disabled={disabled}
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Website</label>
          <input
            type="url"
            className={inputClass}
            placeholder="https://yoursite.com"
            value={personalInfo.website}
            onChange={(e) => updatePersonalInfo({ website: e.target.value })}
            disabled={disabled}
          />
        </div>
        <div>
          <label className={labelClass}>LinkedIn</label>
          <input
            type="text"
            className={inputClass}
            placeholder="linkedin.com/in/..."
            value={personalInfo.linkedin}
            onChange={(e) => updatePersonalInfo({ linkedin: e.target.value })}
            disabled={disabled}
          />
        </div>
        <div>
          <label className={labelClass}>GitHub</label>
          <input
            type="text"
            className={inputClass}
            placeholder="github.com/..."
            value={personalInfo.github}
            onChange={(e) => updatePersonalInfo({ github: e.target.value })}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}

function ExperienceEditor({ disabled }: { disabled: boolean }) {
  const { resumeData, addExperience, updateExperience, removeExperience } =
    useResume();
  const { experience } = resumeData;

  return (
    <div className="space-y-4 mt-4">
      {experience.map((exp, index) => (
        <div
          key={exp.id}
          className="p-4 border border-border rounded-lg bg-background"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
              <span className="font-medium">
                {exp.position || `Experience ${index + 1}`}
              </span>
            </div>
            <button
              onClick={() => removeExperience(exp.id)}
              disabled={disabled}
              className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Company</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Company name"
                value={exp.company}
                onChange={(e) =>
                  updateExperience(exp.id, { company: e.target.value })
                }
                disabled={disabled}
              />
            </div>
            <div>
              <label className={labelClass}>Position</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Job title"
                value={exp.position}
                onChange={(e) =>
                  updateExperience(exp.id, { position: e.target.value })
                }
                disabled={disabled}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <label className={labelClass}>Start Date</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Jan 2020"
                value={exp.startDate}
                onChange={(e) =>
                  updateExperience(exp.id, { startDate: e.target.value })
                }
                disabled={disabled}
              />
            </div>
            <div>
              <label className={labelClass}>End Date</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Present"
                value={exp.endDate}
                onChange={(e) =>
                  updateExperience(exp.id, { endDate: e.target.value })
                }
                disabled={disabled || exp.current}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-border accent-primary"
                  checked={exp.current}
                  onChange={(e) =>
                    updateExperience(exp.id, { current: e.target.checked })
                  }
                  disabled={disabled}
                />
                Current
              </label>
            </div>
          </div>
          <div className="mt-4">
            <label className={labelClass}>Bullet Points</label>
            <textarea
              rows={4}
              className={`${inputClass} resize-none font-mono text-sm`}
              placeholder={"• Led development of new feature...\n• Improved performance by 40%...\n• Mentored junior engineers..."}
              value={exp.bullets}
              onChange={(e) =>
                updateExperience(exp.id, { bullets: e.target.value })
              }
              disabled={disabled}
            />
          </div>
        </div>
      ))}
      <button
        onClick={() => addExperience()}
        disabled={disabled}
        className="w-full py-2.5 border border-dashed border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus className="w-4 h-4" /> Add Experience
      </button>
    </div>
  );
}

function EducationEditor({ disabled }: { disabled: boolean }) {
  const { resumeData, addEducation, updateEducation, removeEducation } =
    useResume();
  const { education } = resumeData;

  return (
    <div className="space-y-4 mt-4">
      {education.map((edu, index) => (
        <div
          key={edu.id}
          className="p-4 border border-border rounded-lg bg-background"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
              <span className="font-medium">
                {edu.institution || `Education ${index + 1}`}
              </span>
            </div>
            <button
              onClick={() => removeEducation(edu.id)}
              disabled={disabled}
              className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Institution</label>
              <input
                type="text"
                className={inputClass}
                placeholder="University name"
                value={edu.institution}
                onChange={(e) =>
                  updateEducation(edu.id, { institution: e.target.value })
                }
                disabled={disabled}
              />
            </div>
            <div>
              <label className={labelClass}>Degree</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Bachelor of Science"
                value={edu.degree}
                onChange={(e) =>
                  updateEducation(edu.id, { degree: e.target.value })
                }
                disabled={disabled}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <label className={labelClass}>Field of Study</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Computer Science"
                value={edu.field}
                onChange={(e) =>
                  updateEducation(edu.id, { field: e.target.value })
                }
                disabled={disabled}
              />
            </div>
            <div>
              <label className={labelClass}>GPA</label>
              <input
                type="text"
                className={inputClass}
                placeholder="3.8/4.0"
                value={edu.gpa}
                onChange={(e) =>
                  updateEducation(edu.id, { gpa: e.target.value })
                }
                disabled={disabled}
              />
            </div>
            <div>
              <label className={labelClass}>Graduation</label>
              <input
                type="text"
                className={inputClass}
                placeholder="May 2022"
                value={edu.graduationDate}
                onChange={(e) =>
                  updateEducation(edu.id, { graduationDate: e.target.value })
                }
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={() => addEducation()}
        disabled={disabled}
        className="w-full py-2.5 border border-dashed border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus className="w-4 h-4" /> Add Education
      </button>
    </div>
  );
}

function SkillsEditor({ disabled }: { disabled: boolean }) {
  const { resumeData, updateSkills } = useResume();
  const { skills } = resumeData;

  return (
    <div className="space-y-4 mt-4">
      <div>
        <label className={labelClass}>Technical Skills</label>
        <input
          type="text"
          className={inputClass}
          placeholder="JavaScript, TypeScript, React, Node.js, Python"
          value={skills.technical}
          onChange={(e) => updateSkills({ technical: e.target.value })}
          disabled={disabled}
        />
      </div>
      <div>
        <label className={labelClass}>Frameworks & Libraries</label>
        <input
          type="text"
          className={inputClass}
          placeholder="Next.js, Express, Tailwind CSS, PostgreSQL"
          value={skills.frameworks}
          onChange={(e) => updateSkills({ frameworks: e.target.value })}
          disabled={disabled}
        />
      </div>
      <div>
        <label className={labelClass}>Tools & Platforms</label>
        <input
          type="text"
          className={inputClass}
          placeholder="Git, Docker, AWS, Vercel, Figma"
          value={skills.tools}
          onChange={(e) => updateSkills({ tools: e.target.value })}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function ProjectsEditor({ disabled }: { disabled: boolean }) {
  const { resumeData, addProject, updateProject, removeProject } = useResume();
  const { projects } = resumeData;

  return (
    <div className="space-y-4 mt-4">
      {projects.map((proj, index) => (
        <div
          key={proj.id}
          className="p-4 border border-border rounded-lg bg-background"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
              <span className="font-medium">
                {proj.name || `Project ${index + 1}`}
              </span>
            </div>
            <button
              onClick={() => removeProject(proj.id)}
              disabled={disabled}
              className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Project Name</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Project name"
                value={proj.name}
                onChange={(e) =>
                  updateProject(proj.id, { name: e.target.value })
                }
                disabled={disabled}
              />
            </div>
            <div>
              <label className={labelClass}>URL</label>
              <input
                type="url"
                className={inputClass}
                placeholder="https://project.com"
                value={proj.url}
                onChange={(e) =>
                  updateProject(proj.id, { url: e.target.value })
                }
                disabled={disabled}
              />
            </div>
          </div>
          <div className="mt-4">
            <label className={labelClass}>Technologies</label>
            <input
              type="text"
              className={inputClass}
              placeholder="React, Node.js, PostgreSQL, AWS"
              value={proj.technologies}
              onChange={(e) =>
                updateProject(proj.id, { technologies: e.target.value })
              }
              disabled={disabled}
            />
          </div>
          <div className="mt-4">
            <label className={labelClass}>Description</label>
            <textarea
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="Brief description of the project..."
              value={proj.description}
              onChange={(e) =>
                updateProject(proj.id, { description: e.target.value })
              }
              disabled={disabled}
            />
          </div>
        </div>
      ))}
      <button
        onClick={() => addProject()}
        disabled={disabled}
        className="w-full py-2.5 border border-dashed border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus className="w-4 h-4" /> Add Project
      </button>
    </div>
  );
}

function CertificationsEditor({ disabled }: { disabled: boolean }) {
  const {
    resumeData,
    addCertification,
    updateCertification,
    removeCertification,
  } = useResume();
  const { certifications } = resumeData;

  return (
    <div className="space-y-4 mt-4">
      {certifications.map((cert, index) => (
        <div
          key={cert.id}
          className="p-4 border border-border rounded-lg bg-background"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
              <span className="font-medium">
                {cert.name || `Certification ${index + 1}`}
              </span>
            </div>
            <button
              onClick={() => removeCertification(cert.id)}
              disabled={disabled}
              className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Certification Name</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Certification name"
                value={cert.name}
                onChange={(e) =>
                  updateCertification(cert.id, { name: e.target.value })
                }
                disabled={disabled}
              />
            </div>
            <div>
              <label className={labelClass}>Issuing Organization</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Amazon Web Services"
                value={cert.issuer}
                onChange={(e) =>
                  updateCertification(cert.id, { issuer: e.target.value })
                }
                disabled={disabled}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className={labelClass}>Date</label>
              <input
                type="text"
                className={inputClass}
                placeholder="March 2024"
                value={cert.date}
                onChange={(e) =>
                  updateCertification(cert.id, { date: e.target.value })
                }
                disabled={disabled}
              />
            </div>
            <div>
              <label className={labelClass}>Credential URL</label>
              <input
                type="url"
                className={inputClass}
                placeholder="https://..."
                value={cert.credentialUrl}
                onChange={(e) =>
                  updateCertification(cert.id, { credentialUrl: e.target.value })
                }
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={() => addCertification()}
        disabled={disabled}
        className="w-full py-2.5 border border-dashed border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus className="w-4 h-4" /> Add Certification
      </button>
    </div>
  );
}

export default function ResumeBuilder({ resumeId }: { resumeId?: string }) {
  return (
    <ResumeProvider>
      <ResumeBuilderContent resumeId={resumeId} />
    </ResumeProvider>
  );
}
