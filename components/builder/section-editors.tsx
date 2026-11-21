"use client";

import { useId } from "react";
import { useResume } from "@/lib/resume-context";
import { GuidedDraft } from "@/components/ai/guided-draft";
import { appendBullets } from "@/lib/bullet-text";
import { SkillsEditor } from "@/components/builder/skills-editor";
import { AddButton, EntryBlock, FieldRow, TextAreaField, TextField, useOpenEntry } from "@/components/builder/fields";

export type SectionType = "personal" | "experience" | "education" | "skills" | "projects" | "certifications";

/** Every section in the default page order. Each resume can reorder the body sections (lib/section-order.ts). */
export const SECTIONS: { type: SectionType; title: string; hint: string }[] = [
  { type: "personal", title: "Contact", hint: "The lines at the top of the page. Use an email you check." },
  { type: "education", title: "Education", hint: "Your school, degree and graduation date. Add a GPA only if it helps." },
  {
    type: "experience",
    title: "Experience",
    hint: "Jobs, internships, research, and leadership roles in clubs. Most recent first.",
  },
  { type: "projects", title: "Projects", hint: "Class projects, hackathons, and things you built or ran on your own." },
  { type: "skills", title: "Skills", hint: "Each row becomes one line on the page, like “Languages: Python, Java”." },
  {
    type: "certifications",
    title: "Certifications",
    hint: "Only ones someone hiring in your field would recognise. Most people can leave this empty.",
  },
];

const BULLET_HINT = "One per line: what you did, then what came of it";

/** "Sep 2024 – Present", or whichever ends are filled in. */
function dateRange(start: string, end: string): string {
  return [start.trim(), end.trim()].filter(Boolean).join(" – ");
}

export function SectionEditor({ type, openInterviewFor }: { type: SectionType; openInterviewFor: string | null }) {
  switch (type) {
    case "personal":
      return <PersonalInfoEditor />;
    case "experience":
      return <ExperienceEditor openInterviewFor={openInterviewFor} />;
    case "education":
      return <EducationEditor />;
    case "skills":
      return <SkillsEditor disabled={false} />;
    case "projects":
      return <ProjectsEditor openInterviewFor={openInterviewFor} />;
    case "certifications":
      return <CertificationsEditor />;
  }
}

function PersonalInfoEditor() {
  const { resumeData, updatePersonalInfo } = useResume();
  const p = resumeData.personalInfo;

  return (
    <div className="flex flex-col gap-3">
      <FieldRow>
        <TextField
          label="Full name"
          value={p.fullName}
          onChange={(fullName) => updatePersonalInfo({ fullName })}
          placeholder="Jordan Lee"
          autoComplete="name"
        />
        <TextField
          label="Email"
          type="email"
          value={p.email}
          onChange={(email) => updatePersonalInfo({ email })}
          placeholder="jordan.lee@school.edu"
          autoComplete="email"
        />
      </FieldRow>
      <FieldRow>
        <TextField
          label="Phone"
          type="tel"
          value={p.phone}
          onChange={(phone) => updatePersonalInfo({ phone })}
          placeholder="(555) 123-4567"
          autoComplete="tel"
        />
        <TextField
          label="City"
          value={p.location}
          onChange={(location) => updatePersonalInfo({ location })}
          placeholder="City, State (no street address)"
        />
      </FieldRow>
      <FieldRow cols={3}>
        <TextField label="LinkedIn" value={p.linkedin} onChange={(linkedin) => updatePersonalInfo({ linkedin })} placeholder="linkedin.com/in/you" />
        <TextField label="GitHub" value={p.github} onChange={(github) => updatePersonalInfo({ github })} placeholder="github.com/you" />
        <TextField label="Website" type="url" value={p.website} onChange={(website) => updatePersonalInfo({ website })} placeholder="yoursite.com" />
      </FieldRow>
      <TextAreaField
        label="Summary"
        value={p.summary}
        onChange={(summary) => updatePersonalInfo({ summary })}
        rows={2}
        placeholder="Two lines on what you're looking for and why you fit."
        hint="Optional. Leave it empty and it won't appear."
      />
    </div>
  );
}

function ExperienceEditor({ openInterviewFor }: { openInterviewFor: string | null }) {
  const { resumeData, addExperience, updateExperience, removeExperience } = useResume();
  const entries = resumeData.experience;
  const openEntry = useOpenEntry(openInterviewFor ?? entries[0]?.id ?? null);

  return (
    <div className="flex flex-col gap-2.5">
      {entries.map((exp, i) => (
        <EntryBlock
          key={exp.id}
          heading={[exp.position, exp.company].filter((s) => s.trim()).join(", ")}
          placeholderHeading={`Role ${i + 1}`}
          summary={dateRange(exp.startDate, exp.current ? "Present" : exp.endDate)}
          open={openEntry.isOpen(exp.id)}
          onToggle={() => openEntry.toggle(exp.id)}
          onRemove={() => removeExperience(exp.id)}
        >
          <FieldRow>
            <TextField label="Job title" value={exp.position} onChange={(position) => updateExperience(exp.id, { position })} placeholder="Research Assistant" />
            <TextField label="Organization" value={exp.company} onChange={(company) => updateExperience(exp.id, { company })} placeholder="Biology Department" />
          </FieldRow>
          <FieldRow cols={3}>
            <TextField label="Location" value={exp.location} onChange={(location) => updateExperience(exp.id, { location })} placeholder="City, State" />
            <TextField label="Start" value={exp.startDate} onChange={(startDate) => updateExperience(exp.id, { startDate })} placeholder="Sep 2024" />
            <TextField
              label="End"
              value={exp.current ? "" : exp.endDate}
              onChange={(endDate) => updateExperience(exp.id, { endDate })}
              placeholder={exp.current ? "Present" : "May 2025"}
              disabled={exp.current}
              labelAside={<CurrentCheckbox checked={exp.current} onChange={(current) => updateExperience(exp.id, { current })} />}
            />
          </FieldRow>
          <TextAreaField
            label="Bullets"
            value={exp.bullets}
            onChange={(bullets) => updateExperience(exp.id, { bullets })}
            rows={4}
            placeholder={"• Ran weekly lab sections for 40 first-year students\n• Cut sample prep time from 2 hours to 45 minutes by …"}
            hint={BULLET_HINT}
          />
          <GuidedDraft
            kind="experience"
            heading={[exp.position, exp.company].filter(Boolean).join(", ")}
            current={exp.current}
            initiallyOpen={exp.id === openInterviewFor}
            onAccept={(bullets) => updateExperience(exp.id, { bullets: appendBullets(exp.bullets, bullets) })}
          />
        </EntryBlock>
      ))}
      <AddButton
        onClick={() => {
          const id = crypto.randomUUID();
          addExperience({ id });
          openEntry.open(id);
        }}
      >
        Add a role
      </AddButton>
    </div>
  );
}

function CurrentCheckbox({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  const id = useId();
  return (
    <span className="flex items-center gap-1.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-3.5 rounded-sm border-rule-strong accent-brand"
      />
      <label htmlFor={id} className="text-xs text-ink-soft">
        Still here
      </label>
    </span>
  );
}

function EducationEditor() {
  const { resumeData, addEducation, updateEducation, removeEducation } = useResume();
  const entries = resumeData.education;
  const openEntry = useOpenEntry(entries[0]?.id ?? null);

  return (
    <div className="flex flex-col gap-2.5">
      {entries.map((edu, i) => (
        <EntryBlock
          key={edu.id}
          heading={edu.institution}
          placeholderHeading={`School ${i + 1}`}
          summary={edu.graduationDate}
          open={openEntry.isOpen(edu.id)}
          onToggle={() => openEntry.toggle(edu.id)}
          onRemove={() => removeEducation(edu.id)}
        >
          <TextField label="School" value={edu.institution} onChange={(institution) => updateEducation(edu.id, { institution })} placeholder="State University" />
          <FieldRow>
            <TextField label="Degree" value={edu.degree} onChange={(degree) => updateEducation(edu.id, { degree })} placeholder="Bachelor of Science" />
            <TextField label="Field of study" value={edu.field} onChange={(field) => updateEducation(edu.id, { field })} placeholder="Biology" />
          </FieldRow>
          <FieldRow>
            <TextField
              label="Graduation"
              value={edu.graduationDate}
              onChange={(graduationDate) => updateEducation(edu.id, { graduationDate })}
              placeholder="May 2027 (expected is fine)"
            />
            <TextField label="GPA" value={edu.gpa} onChange={(gpa) => updateEducation(edu.id, { gpa })} placeholder="Optional, e.g. 3.7/4.0" />
          </FieldRow>
        </EntryBlock>
      ))}
      <AddButton
        onClick={() => {
          const id = crypto.randomUUID();
          addEducation({ id });
          openEntry.open(id);
        }}
      >
        Add a school
      </AddButton>
    </div>
  );
}

function ProjectsEditor({ openInterviewFor }: { openInterviewFor: string | null }) {
  const { resumeData, addProject, updateProject, removeProject } = useResume();
  const entries = resumeData.projects;
  const openEntry = useOpenEntry(openInterviewFor ?? entries[0]?.id ?? null);

  return (
    <div className="flex flex-col gap-2.5">
      {entries.map((proj, i) => (
        <EntryBlock
          key={proj.id}
          heading={proj.name}
          placeholderHeading={`Project ${i + 1}`}
          summary={proj.technologies}
          open={openEntry.isOpen(proj.id)}
          onToggle={() => openEntry.toggle(proj.id)}
          onRemove={() => removeProject(proj.id)}
        >
          <FieldRow cols={3}>
            <TextField label="Project name" value={proj.name} onChange={(name) => updateProject(proj.id, { name })} placeholder="Campus Course Planner" />
            <TextField
              label="Tools and methods"
              value={proj.technologies}
              onChange={(technologies) => updateProject(proj.id, { technologies })}
              placeholder="Python, R, survey design"
            />
            <TextField label="Link" type="url" value={proj.url} onChange={(url) => updateProject(proj.id, { url })} placeholder="Optional" />
          </FieldRow>
          <TextAreaField
            label="Bullets"
            value={proj.description}
            onChange={(description) => updateProject(proj.id, { description })}
            rows={4}
            placeholder={"• Built a course planner used by 300 students in two dorms\n• Presented at the spring research showcase"}
            hint={BULLET_HINT}
          />
          <GuidedDraft
            kind="project"
            heading={proj.name}
            current={false}
            initiallyOpen={proj.id === openInterviewFor}
            onAccept={(bullets) => updateProject(proj.id, { description: appendBullets(proj.description, bullets) })}
          />
        </EntryBlock>
      ))}
      <AddButton
        onClick={() => {
          const id = crypto.randomUUID();
          addProject({ id });
          openEntry.open(id);
        }}
      >
        Add a project
      </AddButton>
    </div>
  );
}

function CertificationsEditor() {
  const { resumeData, addCertification, updateCertification, removeCertification } = useResume();
  const entries = resumeData.certifications;
  const openEntry = useOpenEntry(entries[0]?.id ?? null);

  return (
    <div className="flex flex-col gap-2.5">
      {entries.map((cert, i) => (
        <EntryBlock
          key={cert.id}
          heading={cert.name}
          placeholderHeading={`Certification ${i + 1}`}
          summary={cert.date}
          open={openEntry.isOpen(cert.id)}
          onToggle={() => openEntry.toggle(cert.id)}
          onRemove={() => removeCertification(cert.id)}
        >
          <FieldRow>
            <TextField label="Name" value={cert.name} onChange={(name) => updateCertification(cert.id, { name })} placeholder="CPR and First Aid" />
            <TextField label="Issued by" value={cert.issuer} onChange={(issuer) => updateCertification(cert.id, { issuer })} placeholder="American Red Cross" />
          </FieldRow>
          <FieldRow>
            <TextField label="Date" value={cert.date} onChange={(date) => updateCertification(cert.id, { date })} placeholder="Mar 2025" />
            <TextField
              label="Credential link"
              type="url"
              value={cert.credentialUrl}
              onChange={(credentialUrl) => updateCertification(cert.id, { credentialUrl })}
              placeholder="Optional"
            />
          </FieldRow>
        </EntryBlock>
      ))}
      <AddButton
        onClick={() => {
          const id = crypto.randomUUID();
          addCertification({ id });
          openEntry.open(id);
        }}
      >
        Add a certification
      </AddButton>
    </div>
  );
}
