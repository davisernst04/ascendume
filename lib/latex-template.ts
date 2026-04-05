// lib/latex-template.ts
import type { ResumeData } from "./resume-context";

/**
 * Escapes special LaTeX characters in a user-provided string.
 * IMPORTANT: backslash replacement must come first.
 */
export function escapeLaTeX(str: string): string {
  if (!str) return "";
  return str
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/&/g, "\\&")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

/**
 * Converts a newline-separated bullets string into LaTeX \resumeItem list.
 * Strips leading bullet characters (•, -, *). Returns "" if no bullets.
 */
function buildBullets(bulletsStr: string): string {
  const lines = bulletsStr
    .split("\n")
    .map((l) => l.replace(/^[•\-*]\s*/, "").trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return "";
  const items = lines.map((l) => `      \\resumeItem{${escapeLaTeX(l)}}`).join("\n");
  return `    \\resumeItemListStart\n${items}\n    \\resumeItemListEnd`;
}

/**
 * Interpolates ResumeData into the hardcoded Jake's Resume LaTeX template.
 * Returns a complete LaTeX document string ready for pdflatex compilation.
 */
export function buildLatex(data: ResumeData): string {
  const p = data.personalInfo;

  // Header contact line — only include non-empty fields
  const contactParts: string[] = [];
  if (p.phone) contactParts.push(escapeLaTeX(p.phone));
  if (p.email)
    contactParts.push(
      `\\href{mailto:${p.email}}{\\underline{${escapeLaTeX(p.email)}}}`
    );
  if (p.linkedin)
    contactParts.push(`\\href{${p.linkedin}}{\\underline{linkedin}}`);
  if (p.github)
    contactParts.push(`\\href{${p.github}}{\\underline{github}}`);
  if (p.website)
    contactParts.push(`\\href{${p.website}}{\\underline{portfolio}}`);

  // Summary section (only if non-empty)
  const summarySection =
    p.summary
      ? `\\section{Summary}
  \\small{${escapeLaTeX(p.summary)}}`
      : "";

  // Education section
  const educationSection =
    data.education.length > 0
      ? `\\section{Education}
  \\resumeSubHeadingListStart
${data.education
  .map((edu) => {
    const degree =
      edu.degree && edu.field
        ? `${escapeLaTeX(edu.degree)} in ${escapeLaTeX(edu.field)}`
        : escapeLaTeX(edu.degree || edu.field || "");
    const gpaStr = edu.gpa ? ` -- GPA: ${escapeLaTeX(edu.gpa)}` : "";
    return `    \\resumeSubheading
      {${escapeLaTeX(edu.institution)}}{${escapeLaTeX(edu.graduationDate)}}
      {${degree}${gpaStr}}{}`;
  })
  .join("\n")}
  \\resumeSubHeadingListEnd`
      : "";

  // Experience section
  const experienceSection =
    data.experience.length > 0
      ? `\\section{Experience}
  \\resumeSubHeadingListStart
${data.experience
  .map((exp) => {
    const dateRange = exp.current
      ? `${escapeLaTeX(exp.startDate)} -- Present`
      : `${escapeLaTeX(exp.startDate)} -- ${escapeLaTeX(exp.endDate)}`;
    const bullets = buildBullets(exp.bullets);
    return `    \\resumeSubheading
      {${escapeLaTeX(exp.position)}}{${dateRange}}
      {${escapeLaTeX(exp.company)}}{}
${bullets}`;
  })
  .join("\n")}
  \\resumeSubHeadingListEnd`
      : "";

  // Projects section
  const projectsSection =
    data.projects.length > 0
      ? `\\section{Projects}
    \\resumeSubHeadingListStart
${data.projects
  .map((proj) => {
    const techStr = proj.technologies
      ? ` $|$ \\emph{\\small{${escapeLaTeX(proj.technologies)}}}`
      : "";
    const nameStr = `\\textbf{${escapeLaTeX(proj.name)}}${techStr}`;
    const descItem = proj.description
      ? `    \\resumeItemListStart\n      \\resumeItem{${escapeLaTeX(proj.description)}}\n    \\resumeItemListEnd`
      : "";
    return `    \\resumeProjectHeading
          {${nameStr}}{}
${descItem}`;
  })
  .join("\n")}
    \\resumeSubHeadingListEnd`
      : "";

  // Skills section
  const skillLines: string[] = [];
  if (data.skills.technical)
    skillLines.push(
      `     \\textbf{Languages}{: ${escapeLaTeX(data.skills.technical)}}`
    );
  if (data.skills.frameworks)
    skillLines.push(
      `     \\textbf{Frameworks}{: ${escapeLaTeX(data.skills.frameworks)}}`
    );
  if (data.skills.tools)
    skillLines.push(
      `     \\textbf{Developer Tools}{: ${escapeLaTeX(data.skills.tools)}}`
    );
  const skillsSection =
    skillLines.length > 0
      ? `\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
${skillLines.join(" \\\\\n")}
    }}
 \\end{itemize}`
      : "";

  // Certifications section
  const certificationsSection =
    data.certifications.length > 0
      ? `\\section{Certifications}
  \\resumeSubHeadingListStart
${data.certifications
  .map(
    (cert) => `    \\resumeSubheading
      {${escapeLaTeX(cert.name)}}{${escapeLaTeX(cert.date)}}
      {${escapeLaTeX(cert.issuer)}}{}`,
  )
  .join("\n")}
  \\resumeSubHeadingListEnd`
      : "";

  return `%-------------------------
% Resume in Jakes Resume style
% Based on: https://github.com/jakegut/resume
%-------------------------

\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}

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
    \\textbf{\\Huge \\scshape ${escapeLaTeX(p.fullName || "Your Name")}} \\\\ \\vspace{1pt}
    \\small ${contactParts.length > 0 ? contactParts.join(" $|$ ") : "your@email.com"}
\\end{center}

${summarySection}

${educationSection}

${experienceSection}

${projectsSection}

${skillsSection}

${certificationsSection}

\\end{document}
`;
}