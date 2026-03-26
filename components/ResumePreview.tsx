"use client";

import { useResume } from "@/lib/resume-context";
import { Mail, Phone, MapPin, Globe, ExternalLink, Code } from "lucide-react";

export function ResumePreview() {
  const { resumeData } = useResume();
  const { personalInfo, experience, education, skills, projects, certifications } = resumeData;

  const hasContent = 
    personalInfo.fullName || 
    personalInfo.email || 
    experience.length > 0 || 
    education.length > 0;

  if (!hasContent) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl p-6 aspect-[8.5/11] w-full">
        <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-zinc-500">
          <p className="text-sm">Start filling in your information</p>
          <p className="text-xs mt-1">to see the preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl p-8 aspect-[8.5/11] w-full overflow-auto text-sm">
      {/* Header */}
      <div className="text-center mb-4">
        {personalInfo.fullName && (
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            {personalInfo.fullName}
          </h1>
        )}
        
        {/* Contact info inline */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-600 dark:text-zinc-400">
          {personalInfo.email && (
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {personalInfo.email}
            </span>
          )}
          {personalInfo.phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {personalInfo.phone}
            </span>
          )}
          {personalInfo.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {personalInfo.location}
            </span>
          )}
        </div>
        
        {/* Links */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-600 dark:text-zinc-400">
          {personalInfo.website && (
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              {personalInfo.website.replace(/^https?:\/\//, "")}
            </span>
          )}
          {personalInfo.linkedin && (
            <span className="flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              {personalInfo.linkedin}
            </span>
          )}
          {personalInfo.github && (
            <span className="flex items-center gap-1">
              <Code className="w-3 h-3" />
              {personalInfo.github}
            </span>
          )}
        </div>
      </div>

      {/* Summary */}
      {personalInfo.summary && (
        <div className="mb-4">
          <p className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed">
            {personalInfo.summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-zinc-700 pb-1 mb-2 uppercase tracking-wide">
            Experience
          </h2>
          <div className="space-y-3">
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-xs">
                      {exp.position || "Position"}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-zinc-400">
                      {exp.company || "Company"}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-zinc-500 shrink-0 ml-2">
                    {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                  </span>
                </div>
                {exp.bullets && (
                  <ul className="mt-1 text-xs text-gray-700 dark:text-zinc-300 space-y-0.5">
                    {exp.bullets.split("\n").filter(Boolean).map((bullet, i) => (
                      <li key={i} className="flex gap-1">
                        <span className="text-gray-400">•</span>
                        <span>{bullet.replace(/^[•\-\*]\s*/, "")}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-zinc-700 pb-1 mb-2 uppercase tracking-wide">
            Education
          </h2>
          <div className="space-y-2">
            {education.map((edu) => (
              <div key={edu.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-xs">
                      {edu.institution || "Institution"}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-zinc-400">
                      {edu.degree || "Degree"}{edu.field ? ` in ${edu.field}` : ""}
                      {edu.gpa && <span> • GPA: {edu.gpa}</span>}
                    </p>
                  </div>
                  {edu.graduationDate && (
                    <span className="text-xs text-gray-500 dark:text-zinc-500 shrink-0 ml-2">
                      {edu.graduationDate}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {(skills.technical || skills.frameworks || skills.tools) && (
        <div className="mb-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-zinc-700 pb-1 mb-2 uppercase tracking-wide">
            Skills
          </h2>
          <div className="space-y-1 text-xs text-gray-700 dark:text-zinc-300">
            {skills.technical && (
              <p><span className="font-medium text-gray-900 dark:text-white">Technical:</span> {skills.technical}</p>
            )}
            {skills.frameworks && (
              <p><span className="font-medium text-gray-900 dark:text-white">Frameworks:</span> {skills.frameworks}</p>
            )}
            {skills.tools && (
              <p><span className="font-medium text-gray-900 dark:text-white">Tools:</span> {skills.tools}</p>
            )}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-zinc-700 pb-1 mb-2 uppercase tracking-wide">
            Projects
          </h2>
          <div className="space-y-2">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-gray-900 dark:text-white text-xs">
                    {proj.name || "Project Name"}
                  </p>
                  {proj.url && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 shrink-0 ml-2">
                      {proj.url.replace(/^https?:\/\//, "")}
                    </span>
                  )}
                </div>
                {proj.technologies && (
                  <p className="text-xs text-gray-500 dark:text-zinc-500 italic">
                    {proj.technologies}
                  </p>
                )}
                {proj.description && (
                  <p className="text-xs text-gray-700 dark:text-zinc-300 mt-0.5">
                    {proj.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-zinc-700 pb-1 mb-2 uppercase tracking-wide">
            Certifications
          </h2>
          <div className="space-y-1">
            {certifications.map((cert) => (
              <div key={cert.id} className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-xs">
                    {cert.name || "Certification"}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-zinc-400">
                    {cert.issuer || "Issuer"}
                  </p>
                </div>
                {cert.date && (
                  <span className="text-xs text-gray-500 dark:text-zinc-500 shrink-0 ml-2">
                    {cert.date}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}