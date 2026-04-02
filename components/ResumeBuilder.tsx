"use client";

import { useState } from "react";
import Link from "next/link";
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
  ArrowLeft,
  Download,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResumeProvider, useResume } from "@/lib/resume-context";
import { ResumePreview } from "./ResumePreview";
import { ThemeToggle } from "./theme-toggle";
import { AIEnhanceButton } from "./ai-enhance-button";
import { useResumePersistence } from "@/lib/use-resume-persistence";

type SectionType = "personal" | "experience" | "education" | "skills" | "projects" | "certifications";

interface Section {
  id: string;
  type: SectionType;
  title: string;
  expanded: boolean;
}

const sectionIcons: Record<SectionType, React.ComponentType<{ className?: string }>> = {
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
  const { resumeData, updateTitle } = useResume();
  const [isExporting, setIsExporting] = useState(false);

  const exportPdf = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/resumes/${resumeData.id || "new"}/export`, {
        method: "POST",
        body: JSON.stringify(resumeData),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resumeData.title || "resume"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  useResumePersistence(resumeId); // Auto-save to database or localStorage
  const [sections, setSections] = useState<Section[]>(defaultSections);
  const [activeSection, setActiveSection] = useState<string>("1");

  const toggleSection = (id: string) => {
    setSections(sections.map((s) =>
      s.id === id ? { ...s, expanded: !s.expanded } : s
    ));
  };

  const addSection = (type: SectionType) => {
    const existing = sections.find((s) => s.type === type);
    if (existing) {
      setActiveSection(existing.id);
      if (!existing.expanded) {
        toggleSection(existing.id);
      }
      return;
    }
    
    const newSection: Section = {
      id: crypto.randomUUID(),
      type,
      title: type === "experience" ? "Work Experience" :
             type === "education" ? "Education" :
             type === "skills" ? "Skills" :
             type === "projects" ? "Projects" :
             type === "certifications" ? "Certifications" : "Personal Info",
      expanded: true,
    };
    setSections([...sections, newSection]);
    setActiveSection(newSection.id);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-bold text-lg">ascendume</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <input
              type="text"
              value={resumeData.title}
              onChange={(e) => updateTitle(e.target.value)}
              className="bg-transparent border-none text-lg font-medium focus:outline-none focus:ring-0 w-48"
              placeholder="Resume title"
            />
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" size="sm" className="font-bold rounded-lg">
              Preview
            </Button>
            <Button 
              size="sm" 
              className="font-bold shadow-lg shadow-primary/20 rounded-lg gap-2"
              onClick={() => exportPdf()}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Left Panel - Section List */}
        <div className="w-64 border-r border-border bg-muted/30 overflow-y-auto shrink-0">
          <div className="p-4">
            <h3 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">Sections</h3>
            <div className="space-y-1">
              {sections.map((section) => {
                const Icon = sectionIcons[section.type];
                return (
                  <div
                    key={section.id}
                    className={`group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      activeSection === section.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setActiveSection(section.id)}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="flex-1 text-sm font-medium">{section.title}</span>
                    {section.type !== "personal" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSection(section.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <h3 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">Add Section</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: "experience" as const, label: "Experience", Icon: Briefcase },
                  { type: "education" as const, label: "Education", Icon: GraduationCap },
                  { type: "skills" as const, label: "Skills", Icon: Code },
                  { type: "projects" as const, label: "Projects", Icon: FolderKanban },
                  { type: "certifications" as const, label: "Certs", Icon: Award },
                ].map(({ type, label, Icon }) => (
                  <button
                    key={type}
                    onClick={() => addSection(type)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-background rounded-lg border border-border hover:border-primary hover:text-primary transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center Panel - Editor */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {sections.filter((s) => s.id === activeSection).map((section) => {
              const Icon = sectionIcons[section.type];
              return (
                <div key={section.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
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
                      <SectionEditor type={section.type} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="w-[420px] border-l border-border bg-muted/30 overflow-y-auto hidden lg:block shrink-0">
          <div className="p-4">
            <h3 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">Live Preview</h3>
            <ResumePreview />
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionEditor({ type }: { type: SectionType }) {
  switch (type) {
    case "personal":
      return <PersonalInfoEditor />;
    case "experience":
      return <ExperienceEditor />;
    case "education":
      return <EducationEditor />;
    case "skills":
      return <SkillsEditor />;
    case "projects":
      return <ProjectsEditor />;
    case "certifications":
      return <CertificationsEditor />;
    default:
      return null;
  }
}

const inputClass = "w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors";
const labelClass = "block text-sm font-medium mb-1.5 text-foreground";

function PersonalInfoEditor() {
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
        />
        <AIEnhanceButton
          text={personalInfo.summary}
          type="summary"
          onEnhanced={(text) => updatePersonalInfo({ summary: text })}
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
          />
        </div>
      </div>
    </div>
  );
}

function ExperienceEditor() {
  const { resumeData, addExperience, updateExperience, removeExperience } = useResume();
  const { experience } = resumeData;

  return (
    <div className="space-y-4 mt-4">
      {experience.map((exp, index) => (
        <div key={exp.id} className="p-4 border border-border rounded-lg bg-background">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
              <span className="font-medium">{exp.position || `Experience ${index + 1}`}</span>
            </div>
            <button 
              onClick={() => removeExperience(exp.id)}
              className="text-muted-foreground hover:text-destructive transition-colors"
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
                onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Position</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Job title"
                value={exp.position}
                onChange={(e) => updateExperience(exp.id, { position: e.target.value })}
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
                onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>End Date</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Present"
                value={exp.endDate}
                onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                disabled={exp.current}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-border accent-primary"
                  checked={exp.current}
                  onChange={(e) => updateExperience(exp.id, { current: e.target.checked })}
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
              placeholder="• Led development of new feature...&#10;• Improved performance by 40%...&#10;• Mentored junior engineers..."
              value={exp.bullets}
              onChange={(e) => updateExperience(exp.id, { bullets: e.target.value })}
            />
            <AIEnhanceButton
              text={exp.bullets}
              type="bullets"
              onEnhanced={(text) => updateExperience(exp.id, { bullets: text })}
            />
          </div>
        </div>
      ))}
      <button 
        onClick={() => addExperience()}
        className="w-full py-2.5 border border-dashed border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-2 font-medium"
      >
        <Plus className="w-4 h-4" /> Add Experience
      </button>
    </div>
  );
}

function EducationEditor() {
  const { resumeData, addEducation, updateEducation, removeEducation } = useResume();
  const { education } = resumeData;

  return (
    <div className="space-y-4 mt-4">
      {education.map((edu, index) => (
        <div key={edu.id} className="p-4 border border-border rounded-lg bg-background">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
              <span className="font-medium">{edu.institution || `Education ${index + 1}`}</span>
            </div>
            <button 
              onClick={() => removeEducation(edu.id)}
              className="text-muted-foreground hover:text-destructive transition-colors"
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
                onChange={(e) => updateEducation(edu.id, { institution: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Degree</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Bachelor of Science"
                value={edu.degree}
                onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
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
                onChange={(e) => updateEducation(edu.id, { field: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>GPA</label>
              <input
                type="text"
                className={inputClass}
                placeholder="3.8/4.0"
                value={edu.gpa}
                onChange={(e) => updateEducation(edu.id, { gpa: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Graduation</label>
              <input
                type="text"
                className={inputClass}
                placeholder="May 2022"
                value={edu.graduationDate}
                onChange={(e) => updateEducation(edu.id, { graduationDate: e.target.value })}
              />
            </div>
          </div>
        </div>
      ))}
      <button 
        onClick={() => addEducation()}
        className="w-full py-2.5 border border-dashed border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-2 font-medium"
      >
        <Plus className="w-4 h-4" /> Add Education
      </button>
    </div>
  );
}

function SkillsEditor() {
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
        />
      </div>
    </div>
  );
}

function ProjectsEditor() {
  const { resumeData, addProject, updateProject, removeProject } = useResume();
  const { projects } = resumeData;

  return (
    <div className="space-y-4 mt-4">
      {projects.map((proj, index) => (
        <div key={proj.id} className="p-4 border border-border rounded-lg bg-background">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
              <span className="font-medium">{proj.name || `Project ${index + 1}`}</span>
            </div>
            <button 
              onClick={() => removeProject(proj.id)}
              className="text-muted-foreground hover:text-destructive transition-colors"
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
                onChange={(e) => updateProject(proj.id, { name: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>URL</label>
              <input
                type="url"
                className={inputClass}
                placeholder="https://project.com"
                value={proj.url}
                onChange={(e) => updateProject(proj.id, { url: e.target.value })}
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
              onChange={(e) => updateProject(proj.id, { technologies: e.target.value })}
            />
          </div>
          <div className="mt-4">
            <label className={labelClass}>Description</label>
            <textarea
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="Brief description of the project..."
              value={proj.description}
              onChange={(e) => updateProject(proj.id, { description: e.target.value })}
            />
            <AIEnhanceButton
              text={proj.description}
              type="description"
              onEnhanced={(text) => updateProject(proj.id, { description: text })}
            />
          </div>
        </div>
      ))}
      <button 
        onClick={() => addProject()}
        className="w-full py-2.5 border border-dashed border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-2 font-medium"
      >
        <Plus className="w-4 h-4" /> Add Project
      </button>
    </div>
  );
}

function CertificationsEditor() {
  const { resumeData, addCertification, updateCertification, removeCertification } = useResume();
  const { certifications } = resumeData;

  return (
    <div className="space-y-4 mt-4">
      {certifications.map((cert, index) => (
        <div key={cert.id} className="p-4 border border-border rounded-lg bg-background">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
              <span className="font-medium">{cert.name || `Certification ${index + 1}`}</span>
            </div>
            <button 
              onClick={() => removeCertification(cert.id)}
              className="text-muted-foreground hover:text-destructive transition-colors"
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
                onChange={(e) => updateCertification(cert.id, { name: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Issuing Organization</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Amazon Web Services"
                value={cert.issuer}
                onChange={(e) => updateCertification(cert.id, { issuer: e.target.value })}
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
                onChange={(e) => updateCertification(cert.id, { date: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Credential URL</label>
              <input
                type="url"
                className={inputClass}
                placeholder="https://..."
                value={cert.credentialUrl}
                onChange={(e) => updateCertification(cert.id, { credentialUrl: e.target.value })}
              />
            </div>
          </div>
        </div>
      ))}
      <button 
        onClick={() => addCertification()}
        className="w-full py-2.5 border border-dashed border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-2 font-medium"
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