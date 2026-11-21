// lib/resume-latex.ts
import type { ResumeData } from "@/lib/resume-context";
import { type BodySection, normalizeSectionOrder } from "@/lib/section-order";

/**
 * Escapes the 10 LaTeX special characters in a string.
 * Call this on every user-supplied value before embedding in .tex source.
 */
export function escapeLatex(str: string): string {
  return str
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

// Convenience: escape or return empty string for optional fields
function e(s: string | undefined | null): string {
  return escapeLatex(s ?? "");
}

/** A bare domain like "github.com/you": no scheme, no spaces, a dot before any path. */
const BARE_DOMAIN = /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i;

/**
 * Returns a link target safe to put in \href, or "" if the value can't be a
 * link. Bare domains ("linkedin.com/in/you") get https:// so they stay clickable.
 */
export function sanitizeUrl(raw: string | undefined | null): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  const url = /^(https?:\/\/|mailto:)/i.test(trimmed)
    ? trimmed
    : BARE_DOMAIN.test(trimmed)
      ? `https://${trimmed}`
      : "";
  return url.replace(/[{}\\]/g, "");
}

/** Splits a newline-separated bullet field into bullet texts, stripping leading •, -, or *. */
export function parseBullets(raw: string): string[] {
  return raw
    .split("\n")
    .map((l) => l.replace(/^[•\-*]\s*/, "").trim())
    .filter((l) => l.length > 0);
}

/** Generates a complete Jake's-template .tex document from ResumeData. */
export function buildLatex(data: ResumeData): string {
  const p = data.personalInfo;

  // Contact line
  const contactParts: string[] = [];
  if (p.phone) contactParts.push(e(p.phone));
  if (p.email)
    contactParts.push(
      `\\href{${sanitizeUrl("mailto:" + p.email)}}{\\underline{${e(p.email)}}}`
    );
  if (p.linkedin)
    contactParts.push(
      `\\href{${sanitizeUrl(p.linkedin)}}{\\underline{${e(p.linkedin)}}}`
    );
  if (p.github)
    contactParts.push(
      `\\href{${sanitizeUrl(p.github)}}{\\underline{${e(p.github)}}}`
    );
  if (p.website)
    contactParts.push(
      `\\href{${sanitizeUrl(p.website)}}{\\underline{${e(p.website)}}}`
    );
  const contactLine = contactParts.join(" $|$ ");

  // Summary (optional extension to Jake's template)
  const summarySection = p.summary
    ? `\n%-----------SUMMARY-----------
\\section{Summary}
  ${e(p.summary)}\n`
    : "";

  // Education
  const educationSection =
    data.education.length === 0
      ? ""
      : `
%-----------EDUCATION-----------
\\section{Education}
  \\resumeSubHeadingListStart
${data.education
  .map((edu) => {
    const degree =
      edu.degree && edu.field
        ? `${e(edu.degree)} in ${e(edu.field)}`
        : e(edu.degree || edu.field);
    const gpaStr = edu.gpa ? `, GPA: ${e(edu.gpa)}` : "";
    return `    \\resumeSubheading
      {${e(edu.institution)}}{}
      {${degree}${gpaStr}}{${e(edu.graduationDate)}}`;
  })
  .join("\n")}
  \\resumeSubHeadingListEnd
`;

  // Experience
  const experienceSection =
    data.experience.length === 0
      ? ""
      : `
%-----------EXPERIENCE-----------
\\section{Experience}
  \\resumeSubHeadingListStart
${data.experience
  .map((exp) => {
    const dateRange = exp.current
      ? `${e(exp.startDate)} -- Present`
      : `${e(exp.startDate)} -- ${e(exp.endDate)}`;
    const bullets = parseBullets(exp.bullets || "");
    const bulletBlock =
      bullets.length > 0
        ? `      \\resumeItemListStart\n${bullets
            .map((b) => `        \\resumeItem{${e(b)}}`)
            .join("\n")}\n      \\resumeItemListEnd`
        : "";
    return `    \\resumeSubheading
      {${e(exp.company)}}{${e(exp.location)}}
      {${e(exp.position)}}{${dateRange}}
${bulletBlock}`;
  })
  .join("\n")}
  \\resumeSubHeadingListEnd
`;

  // Projects
  const projectsSection =
    data.projects.length === 0
      ? ""
      : `
%-----------PROJECTS-----------
\\section{Projects}
    \\resumeSubHeadingListStart
${data.projects
  .map((proj) => {
    const bullets = parseBullets(proj.description || "");
    const bulletBlock =
      bullets.length > 0
        ? `          \\resumeItemListStart\n${bullets
            .map((b) => `            \\resumeItem{${e(b)}}`)
            .join("\n")}\n          \\resumeItemListEnd`
        : "";
    const nameStr = proj.url
      ? `\\href{${sanitizeUrl(proj.url)}}{\\underline{${e(proj.name)}}}`
      : `\\textbf{${e(proj.name)}}`;
    const techStr = proj.technologies
      ? ` $|$ \\emph{${e(proj.technologies)}}`
      : "";
    return `      \\resumeProjectHeading
          {${nameStr}${techStr}}{}
${bulletBlock}`;
  })
  .join("\n")}
    \\resumeSubHeadingListEnd
`;

  // Skills — one `Label: items` row per category the user named
  const skillLines = data.skills
    .filter((c) => c.items.trim() !== "")
    .map((c) =>
      c.label.trim()
        ? `     \\textbf{${e(c.label.trim())}}{: ${e(c.items.trim())}} \\\\`
        : `     ${e(c.items.trim())} \\\\`
    );
  const skillsSection =
    skillLines.length === 0
      ? ""
      : `
%-----------SKILLS-----------
\\section{Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
${skillLines.join("\n")}
    }}
 \\end{itemize}
`;

  // Certifications
  const certsSection =
    data.certifications.length === 0
      ? ""
      : `
%-----------CERTIFICATIONS-----------
\\section{Certifications}
  \\resumeSubHeadingListStart
${data.certifications
  .map(
    (cert) => `    \\resumeSubheading
      {${e(cert.name)}}{${e(cert.date)}}
      {${e(cert.issuer)}}{}
`
  )
  .join("")}  \\resumeSubHeadingListEnd
`;

  const sectionsByName: Record<BodySection, string> = {
    education: educationSection,
    experience: experienceSection,
    projects: projectsSection,
    skills: skillsSection,
    certifications: certsSection,
  };
  const bodySections = normalizeSectionOrder(data.sectionOrder)
    .map((s) => sectionsByName[s])
    .join("");

  return `%% Generated by Ascendume
\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

\\pdfgentounicode=1

\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\begin{document}

\\begin{center}
    \\textbf{\\Huge \\scshape ${e(p.fullName) || "Your Name"}} \\\\ \\vspace{1pt}
    \\small ${contactLine || "your@email.com"}
\\end{center}
${summarySection}${bodySections}
\\end{document}
`;
}
