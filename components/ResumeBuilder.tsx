// components/ResumeBuilder.tsx
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  FileCode,
  Loader2,
  Eye,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import { ResumeProvider, useResume } from "@/lib/resume-context";
import { useSidebar } from "@/components/sidebar-context";
import dynamic from "next/dynamic";
import { useResumePersistence } from "@/lib/use-resume-persistence";
import { useSession } from "@/lib/auth-client";
import { buildLatex } from "@/lib/resume-latex";
import { useReview } from "@/lib/review/use-review";
import { ReviewPanel } from "@/components/review/review-panel";
import type { CompileResult } from "@/components/latex-pdf-preview";
import { cn } from "@/lib/utils";
import { GuidedDraft } from "@/components/ai/guided-draft";
import { GuidedStart } from "@/components/ai/guided-start";
import { appendBullets } from "@/lib/bullet-text";
import { inputClass, labelClass } from "@/components/builder/form-styles";
import { SkillsEditor } from "@/components/builder/skills-editor";

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
  const { resumeData, updateTitle } = useResume();
  const { isOpen: sidebarOpen } = useSidebar();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab") as SectionType | null;
  const initialSection = defaultSections.find((s) => s.type === tabParam) ?? defaultSections[0];

  const [sections, setSections] = useState<Section[]>(
    defaultSections.map((s) => ({ ...s, expanded: s.id === initialSection.id }))
  );
  const [activeSection, setActiveSection] = useState<string>(initialSection.id);

  // Holds the latest generated PDF blob for download
  const pdfBlobRef = useRef<Blob | null>(null);

  const { isLoaded } = useResumePersistence(resumeId);
  const { data: session } = useSession();
  const signedIn = Boolean(session?.user);

  const [rightPanel, setRightPanel] = useState<"preview" | "review">("preview");
  // The entry the guided start just added, whose interview opens straight away.
  const [guidedEntryId, setGuidedEntryId] = useState<string | null>(null);
  const [compiled, setCompiled] = useState<CompileResult | null>(null);
  const review = useReview({ data: resumeData, loaded: isLoaded, compiled, signedIn });

  const startReview = useCallback(() => {
    setRightPanel("review");
    review.request();
  }, [review]);

  const goToSection = useCallback(
    (type: SectionType) => {
      const target = defaultSections.find((s) => s.type === type);
      if (!target) return;
      setActiveSection(target.id);
      setSections((prev) => prev.map((s) => (s.id === target.id ? { ...s, expanded: true } : s)));
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", type);
      params.delete("review");
      router.replace(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Arriving from the review route (/<id>?review=1): the user asked for a review, so run one once loaded.
  const autoReviewedRef = useRef(false);
  useEffect(() => {
    if (!isLoaded || autoReviewedRef.current || searchParams.get("review") !== "1") return;
    autoReviewedRef.current = true;
    startReview();
    const params = new URLSearchParams(searchParams.toString());
    params.delete("review");
    const query = params.toString();
    router.replace(query ? `?${query}` : "?");
  }, [isLoaded, searchParams, startReview, router]);

  const fileBase = toFileName(resumeData.title);

  const handleDownload = useCallback(() => {
    if (!pdfBlobRef.current) return;
    downloadBlob(pdfBlobRef.current, `${fileBase}.pdf`);
  }, [fileBase]);

  const handleDownloadTex = useCallback(() => {
    const tex = buildLatex(resumeData);
    downloadBlob(new Blob([tex], { type: "application/x-tex" }), `${fileBase}.tex`);
  }, [resumeData, fileBase]);

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
          />
          <div className="h-4 w-px bg-border shrink-0 mx-2" />
          {sections.map((section) => {
            const Icon = sectionIcons[section.type];
            return (
              <button
                key={section.id}
                onClick={() => goToSection(section.type)}
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
              onClick={startReview}
              disabled={review.status === "running" || review.status === "waiting-for-preview"}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              Review my resume
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="font-medium rounded-lg gap-2 h-8"
              onClick={handleDownloadTex}
              title="Download the LaTeX source to edit in Overleaf or any TeX editor"
            >
              <FileCode className="w-3.5 h-3.5" />
              .tex
            </Button>
            <Button
              size="sm"
              className="font-bold shadow-lg shadow-primary/20 rounded-lg gap-2 h-8"
              onClick={handleDownload}
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 min-h-0">
        {/* Center Panel - Editor */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-2xl space-y-6">
            {isLoaded && (
              <GuidedStart
                forceOpen={searchParams.get("guided") === "1"}
                onStart={(section, entryId) => {
                  setGuidedEntryId(entryId);
                  goToSection(section);
                }}
              />
            )}
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
                          disabled={false}
                          openInterviewFor={guidedEntryId}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right Panel - Preview / Review */}
        <div className={`overflow-y-auto hidden lg:block shrink-0 transition-all duration-300 ${sidebarOpen ? "w-[420px]" : "w-[612px]"}`}>
          <div className="pl-2 pr-4 py-6">
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-1 p-2 border-b border-border" role="tablist">
                <PanelTab active={rightPanel === "preview"} onClick={() => setRightPanel("preview")}>
                  <Eye className="w-4 h-4" /> Live Preview
                </PanelTab>
                <PanelTab active={rightPanel === "review"} onClick={() => setRightPanel("review")}>
                  <ClipboardCheck className="w-4 h-4" /> Review
                  {review.result && review.result.findingCount > 0 && (
                    <span className={cn("ml-1 rounded-full px-1.5 text-xs", review.outdated ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary")}>
                      {review.result.findingCount}
                    </span>
                  )}
                </PanelTab>
              </div>
              {/* The preview stays mounted while the review is shown: the review needs its page count. */}
              <div className={cn("p-4", rightPanel !== "preview" && "hidden")}>
                <LatexPdfPreview
                  data={resumeData}
                  onPdfReady={(blob) => { pdfBlobRef.current = blob; }}
                  onCompiled={setCompiled}
                  width={sidebarOpen ? 356 : 548}
                />
              </div>
              {rightPanel === "review" && (
                <div className="p-4">
                  <ReviewPanel
                    status={review.status}
                    result={review.result}
                    outdated={review.outdated}
                    signedIn={signedIn}
                    onRun={review.request}
                    onGoTo={goToSection}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PanelTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors",
        active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

/** "Jane's Resume (v2)" -> "Janes-Resume-v2"; never empty. */
function toFileName(title: string): string {
  const base = title.trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
  return base || "resume";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function SectionEditor({
  type,
  disabled,
  openInterviewFor,
}: {
  type: SectionType;
  disabled: boolean;
  openInterviewFor: string | null;
}) {
  switch (type) {
    case "personal":
      return <PersonalInfoEditor disabled={disabled} />;
    case "experience":
      return <ExperienceEditor disabled={disabled} openInterviewFor={openInterviewFor} />;
    case "education":
      return <EducationEditor disabled={disabled} />;
    case "skills":
      return <SkillsEditor disabled={disabled} />;
    case "projects":
      return <ProjectsEditor disabled={disabled} openInterviewFor={openInterviewFor} />;
    case "certifications":
      return <CertificationsEditor disabled={disabled} />;
    default:
      return null;
  }
}


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

function ExperienceEditor({ disabled, openInterviewFor }: { disabled: boolean; openInterviewFor: string | null }) {
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
          <div className="mt-4">
            <label className={labelClass}>Location</label>
            <input
              type="text"
              className={inputClass}
              placeholder="San Francisco, CA"
              value={exp.location}
              onChange={(e) =>
                updateExperience(exp.id, { location: e.target.value })
              }
              disabled={disabled}
            />
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
            <div className="mt-2">
              <GuidedDraft
                kind="experience"
                heading={[exp.position, exp.company].filter(Boolean).join(", ")}
                current={exp.current}
                initiallyOpen={exp.id === openInterviewFor}
                onAccept={(bullets) => updateExperience(exp.id, { bullets: appendBullets(exp.bullets, bullets) })}
              />
            </div>
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

function ProjectsEditor({ disabled, openInterviewFor }: { disabled: boolean; openInterviewFor: string | null }) {
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
            <label className={labelClass}>Bullet Points</label>
            <textarea
              rows={3}
              className={`${inputClass} resize-none font-mono text-sm`}
              placeholder={"• Built a course-planning app for 3 dorms...\n• Presented at the spring showcase..."}
              value={proj.description}
              onChange={(e) =>
                updateProject(proj.id, { description: e.target.value })
              }
              disabled={disabled}
            />
            <div className="mt-2">
              <GuidedDraft
                kind="project"
                heading={proj.name}
                current={false}
                initiallyOpen={proj.id === openInterviewFor}
                onAccept={(bullets) => updateProject(proj.id, { description: appendBullets(proj.description, bullets) })}
              />
            </div>
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
      <Suspense>
        <ResumeBuilderContent resumeId={resumeId} />
      </Suspense>
    </ResumeProvider>
  );
}
