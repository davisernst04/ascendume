"use client";

import { useState, useCallback, useRef } from "react";
import { ResumeData } from "./resume-context";

/**
 * Simple LaTeX template for resume compilation
 */
const getResumeLatexTemplate = (data: ResumeData): string => {
  const { personalInfo, experience, education, skills, projects, certifications } = data;

  const contactLines: string[] = [];
  if (personalInfo.email) contactLines.push(`\\item ${personalInfo.email}`);
  if (personalInfo.phone) contactLines.push(`\\item ${personalInfo.phone}`);
  if (personalInfo.location) contactLines.push(`\\item ${personalInfo.location}`);
  if (personalInfo.website) contactLines.push(`\\item \\url{${personalInfo.website}}`);
  if (personalInfo.linkedin) contactLines.push(`\\item \\url{${personalInfo.linkedin}}`);
  if (personalInfo.github) contactLines.push(`\\item \\url{${personalInfo.github}}`);

  const contactSection = contactLines.length > 0
    ? `\\begin{itemize*}[noitemsep,nolistsep]
${contactLines.map(line => `  ${line}`).join("\n")}
\\end{itemize*}`
    : "";

  const summarySection = personalInfo.summary
    ? `\\section*{Summary}
${personalInfo.summary}`
    : "";

  const experienceSection = experience.length > 0
    ? `\\section*{Experience}
${experience.map(exp => {
      const dateRange = exp.current
        ? `${exp.startDate} -- Present`
        : `${exp.startDate} -- ${exp.endDate}`;
      const bullets = exp.bullets
        ? `
\\begin{itemize*}[noitemsep,nolistsep]
${exp.bullets.split("\n").filter(b => b.trim()).map(b => `  \\item ${b.replace(/^[•\-\*]\s*/, "")}`).join("\n")}
\\end{itemize*}`
        : "";
      return `\\textbf{${exp.position || "Position"}} \\hfill ${dateRange}
\\textit{${exp.company || "Company"}}${bullets}`;
    }).join("\n\n")}`
    : "";

  const educationSection = education.length > 0
    ? `\\section*{Education}
${education.map(edu => {
      const details = [edu.degree, edu.field ? `in ${edu.field}` : null, edu.gpa ? `GPA: ${edu.gpa}` : null]
        .filter(Boolean)
        .join(" ");
      return `\\textbf{${edu.institution || "Institution"}} \\hfill ${edu.graduationDate || ""}
${details}`;
    }).join("\n\n")}`
    : "";

  const skillsSection = skills.technical || skills.frameworks || skills.tools
    ? `\\section*{Skills}
\\begin{itemize*}[noitemsep,nolistsep]
${skills.technical ? `\\item \\textbf{Technical:} ${skills.technical}` : ""}
${skills.frameworks ? `\\item \\textbf{Frameworks:} ${skills.frameworks}` : ""}
${skills.tools ? `\\item \\textbf{Tools:} ${skills.tools}` : ""}
\\end{itemize*}`
    : "";

  const projectsSection = projects.length > 0
    ? `\\section*{Projects}
${projects.map(proj => {
      const urlPart = proj.url ? `\\hfill \\url{${proj.url}}` : "";
      const tech = proj.technologies ? `\\hfill \\textit{${proj.technologies}}` : "";
      const desc = proj.description ? `\n${proj.description}` : "";
      return `\\textbf{${proj.name || "Project Name"}}${urlPart}
${tech}${desc}`;
    }).join("\n\n")}`
    : "";

  const certificationsSection = certifications.length > 0
    ? `\\section*{Certifications}
${certifications.map(cert => {
      return `\\textbf{${cert.name || "Certification"}} \\hfill ${cert.date || ""}
${cert.issuer || ""}`;
    }).join("\n\n")}`
    : "";

  return `\\documentclass[10pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{multicol}
\\usepackage{setspace}
\\usepackage{titlesec}

\\titleformat{\\section}{\\large\\bfseries\\uppercase}{}{0em}{}[\\titlerule]

\\hypersetup{
    colorlinks=true,
    linkcolor=black,
    urlcolor=blue,
    pdftitle={${personalInfo.fullName || "Resume"}},
    pdfauthor={${personalInfo.fullName || "Resume"}}
}

\\setlength{\\parindent}{0em}
\\setlength{\\parskip}{0.5em}

\\begin{document}
\\begin{center}
    \\textbf{\\LARGE ${personalInfo.fullName || "Your Name"}} \\\\[0.2cm]
    \\begin{minipage}{0.8\\linewidth}
    \\centering
    ${contactSection}
    \\end{minipage}
\\end{center}

${summarySection}

${experienceSection}

${educationSection}

${skillsSection}

${projectsSection}

${certificationsSection}
\\end{document}`;
};

interface CompileResult {
  success: boolean;
  pdfBlob?: Blob;
  error?: string;
  log?: string;
}

// Type definition for SwiftLaTeX engine
interface LaTeXEngine {
  loadEngine(): Promise<void>;
  writeMemFSFile(filename: string, content: string): void;
  setEngineMainFile(filename: string): void;
  compileLaTeX(): Promise<{
    pdf?: Uint8Array;
    log?: string;
    status?: number;
  }>;
  closeWorker?(): void;
  flushCache?(): void;
}

/**
 * Hook to compile LaTeX to PDF using SwiftLaTeX WASM engine
 */
export function useLatexPdf() {
  const [isCompiling, setIsCompiling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const engineRef = useRef<LaTeXEngine | null>(null);

  // Load the SwiftLaTeX engine
  const loadEngine = useCallback(async () => {
    if (engineRef.current) return;

    try {
      // Load the SwiftLaTeX engine from local assets
      const engineUrl = "/latex-engine/PdfTeXEngine.js";
      
      // Dynamically import the engine script
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = engineUrl;
        script.async = true;
        script.onload = () => {
          resolve();
        };
        script.onerror = () => {
          reject(new Error("Failed to load SwiftLaTeX engine"));
        };
        document.body.appendChild(script);
      });

      // Create engine instance
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      if (win.LaTeXEngine) {
        const engine = new win.LaTeXEngine() as LaTeXEngine;
        await engine.loadEngine();
        engineRef.current = engine;
        setEngineReady(true);
      }
    } catch (err) {
      console.error("Failed to load LaTeX engine:", err);
      setError("Failed to load LaTeX compiler. Please check your internet connection.");
      setEngineReady(false);
    }
  }, []);

  // Compile LaTeX to PDF
  const compileLatex = useCallback(async (latex: string): Promise<CompileResult> => {
    if (!engineRef.current && !engineReady) {
      await loadEngine();
    }

    if (!engineRef.current) {
      return { success: false, error: "Engine not initialized" };
    }

    setIsCompiling(true);
    setError(null);

    try {
      const engine = engineRef.current;

      // Write the LaTeX file to the engine's virtual filesystem
      engine.writeMemFSFile("main.tex", latex);

      // Set the main file
      engine.setEngineMainFile("main.tex");

      // Compile
      const result = await engine.compileLaTeX();

      if (result.pdf && result.pdf.length > 0) {
        // Create PDF blob - use new Uint8Array to ensure proper buffer type
        const pdfData = new Uint8Array(result.pdf);
        const blob = new Blob([pdfData], { type: "application/pdf" });
        
        return { 
          success: true, 
          pdfBlob: blob,
          log: result.log
        };
      } else {
        return { 
          success: false, 
          error: result.log || "Compilation failed without error log",
          log: result.log
        };
      }
    } catch (err) {
      console.error("LaTeX compilation error:", err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : "Unknown compilation error"
      };
    } finally {
      setIsCompiling(false);
    }
  }, [engineReady, loadEngine]);

  // Compile resume data to PDF
  const compileResume = useCallback(async (
    data: ResumeData
  ): Promise<CompileResult> => {
    const latex = getResumeLatexTemplate(data);
    return await compileLatex(latex);
  }, [compileLatex]);

  // Reset the engine
  const resetEngine = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.closeWorker?.();
      engineRef.current = null;
      setEngineReady(false);
    }
  }, []);

  return {
    compileResume,
    compileLatex,
    isCompiling,
    error,
    engineReady,
    loadEngine,
    resetEngine,
  };
}
