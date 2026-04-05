# LaTeX WASM Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the latexonline.cc-based PDF export with a fully client-side pipeline: hardcoded Jake's Resume LaTeX template + SwiftLaTeX WASM compiler (via public Web Worker) + react-pdf viewer with real-time preview and batch AI enhancement.

**Architecture:** `ResumeData` → `buildLatex()` (pure template interpolation) → Web Worker (SwiftLaTeX pdflatex WASM) → `Uint8Array` → `react-pdf` viewer in builder right panel. AI enhancement is a single `POST /api/ai/enhance-all` call that returns the full enhanced `ResumeData`; the existing debounced compile loop fires automatically after context update. The `export/route.ts`, `enhance/route.ts`, and `AIEnhanceButton` are deleted.

**Tech Stack:** Next.js 16, SwiftLaTeX (CDN-loaded pdflatex WASM in `public/latex-worker.js`), react-pdf (PDF.js wrapper), Vercel AI SDK `generateObject`, TypeScript

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `lib/latex-template.ts` | `escapeLaTeX()` + `buildLatex()` — pure template interpolation |
| Create | `public/latex-worker.js` | Web Worker: loads SwiftLaTeX from CDN, compiles LaTeX → PDF bytes |
| Create | `lib/latex-compiler.ts` | Worker wrapper: `compileLaTeX(latex) → Promise<Uint8Array>` |
| Create | `app/api/ai/enhance-all/route.ts` | Batch AI enhancement of summary, bullets, project descriptions |
| Create | `components/latex-pdf-preview.tsx` | react-pdf viewer component with compile/error states |
| Modify | `components/ResumeBuilder.tsx` | Wire compile loop + enhance button; remove export/AIEnhance |
| Modify | `next.config.ts` | Enable `asyncWebAssembly` webpack experiment |
| Delete | `components/ResumePreview.tsx` | Replaced by `latex-pdf-preview.tsx` |
| Delete | `components/ai-enhance-button.tsx` | Replaced by batch enhance |
| Delete | `lib/use-ai-enhance.ts` | No longer needed |
| Delete | `app/api/resumes/[id]/export/route.ts` | Replaced by client-side WASM |
| Delete | `app/api/ai/enhance/route.ts` | Replaced by enhance-all |

---

## Task 1: Install dependencies and configure Next.js

**Files:**
- Modify: `package.json` (via npm)
- Modify: `next.config.ts`

- [ ] **Step 1: Install react-pdf**

```bash
npm install react-pdf
npm install --save-dev @types/react-pdf
```

Expected: installs without errors. (SwiftLaTeX is loaded from CDN in the worker — no npm install needed.)

- [ ] **Step 2: Enable asyncWebAssembly in next.config.ts**

Replace `next.config.ts` contents:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90],
  },
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    return config;
  },
};

export default nextConfig;
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json next.config.ts
git commit -m "feat: install react-pdf, enable asyncWebAssembly"
```

---

## Task 2: Create `lib/latex-template.ts`

**Files:**
- Create: `lib/latex-template.ts`

This is a pure module — no imports from Next.js or browser APIs. `escapeLaTeX` must run first on every user string before interpolation. Note: backslash must be replaced before other characters (since replacements introduce backslashes).

- [ ] **Step 1: Create the file**

```ts
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
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors. (The `ResumeData` import from `./resume-context` must resolve cleanly.)

- [ ] **Step 3: Commit**

```bash
git add lib/latex-template.ts
git commit -m "feat: add buildLatex() with hardcoded Jake's Resume template"
```

---

## Task 3: Create `public/latex-worker.js`

**Files:**
- Create: `public/latex-worker.js`

This is a plain JS file (no TypeScript). It loads SwiftLaTeX from CDN using `importScripts`, initializes the pdflatex engine once, and compiles on demand. The `id` field is used to match responses to requests.

**Important:** SwiftLaTeX fetches TeX packages on first compile from its own package server (cached in browser storage). The first compilation will take 10-30 seconds. Subsequent ones are 1-3 seconds.

- [ ] **Step 1: Create the file**

```js
// public/latex-worker.js
/* global PdfTeXEngine */

let engine = null;
let initPromise = null;

async function initEngine() {
  if (engine) return;
  if (!initPromise) {
    initPromise = (async () => {
      importScripts(
        "https://cdn.jsdelivr.net/npm/swiftlatex@0.0.1/dist/PdfTeXEngine.js"
      );
      engine = new PdfTeXEngine();
      await engine.loadEngine();
    })();
  }
  await initPromise;
}

self.onmessage = async (e) => {
  const { id, latex } = e.data;
  try {
    await initEngine();
    engine.writeMemFSFile("main.tex", latex);
    engine.setEngineMainFile("main.tex");
    const result = await engine.compileLaTeX();
    if (result.status === "success") {
      self.postMessage({ id, success: true, pdf: result.pdf });
    } else {
      self.postMessage({ id, success: false, log: result.log });
    }
  } catch (err) {
    self.postMessage({
      id,
      success: false,
      log: err instanceof Error ? err.message : String(err),
    });
  }
};
```

> **Note on CDN URL:** The jsdelivr URL above is for SwiftLaTeX 0.0.1. If this 404s, check the SwiftLaTeX npm page for the current version and update the URL accordingly: `https://cdn.jsdelivr.net/npm/swiftlatex@<version>/dist/PdfTeXEngine.js`

- [ ] **Step 2: Commit**

```bash
git add public/latex-worker.js
git commit -m "feat: add SwiftLaTeX web worker for client-side pdflatex"
```

---

## Task 4: Create `lib/latex-compiler.ts`

**Files:**
- Create: `lib/latex-compiler.ts`

Manages the Web Worker lifecycle. The worker is created once and reused. Pending compilations are tracked by ID so concurrent calls are handled correctly (only the latest matters in practice, but the Map handles it cleanly).

- [ ] **Step 1: Create the file**

```ts
// lib/latex-compiler.ts

type PendingEntry = {
  resolve: (pdf: Uint8Array) => void;
  reject: (err: Error) => void;
};

let worker: Worker | null = null;
const pending = new Map<number, PendingEntry>();
let nextId = 0;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker("/latex-worker.js");

    worker.onmessage = (e: MessageEvent) => {
      const { id, success, pdf, log } = e.data as {
        id: number;
        success: boolean;
        pdf?: Uint8Array;
        log?: string;
      };
      const entry = pending.get(id);
      if (!entry) return;
      pending.delete(id);
      if (success && pdf) {
        entry.resolve(pdf);
      } else {
        entry.reject(new Error(log ?? "LaTeX compilation failed"));
      }
    };

    worker.onerror = (e: ErrorEvent) => {
      const err = new Error(e.message ?? "Worker error");
      for (const entry of pending.values()) {
        entry.reject(err);
      }
      pending.clear();
      worker = null; // Will be recreated on next call
    };
  }
  return worker;
}

/**
 * Compiles a LaTeX string to PDF bytes using SwiftLaTeX pdflatex WASM.
 * The worker is initialized lazily and reused across calls.
 * First call may take 10–30s while SwiftLaTeX fetches packages.
 */
export function compileLaTeX(latexString: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, latex: latexString });
  });
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add lib/latex-compiler.ts
git commit -m "feat: add latex-compiler worker wrapper"
```

---

## Task 5: Create `app/api/ai/enhance-all/route.ts`

**Files:**
- Create: `app/api/ai/enhance-all/route.ts`

Single `generateObject` call. Returns the full `ResumeData` with enhanced fields merged in. Unenhanced fields (names, dates, companies, skills, etc.) pass through unchanged. IDs are preserved so the merge works correctly.

- [ ] **Step 1: Create the file**

```ts
// app/api/ai/enhance-all/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { ResumeData } from "@/lib/resume-context";

export const maxDuration = 60;

const enhancedSchema = z.object({
  summary: z
    .string()
    .describe("Rewritten professional summary, 2-4 sentences, compelling and concise"),
  experience: z.array(
    z.object({
      id: z.string(),
      bullets: z
        .string()
        .describe(
          "Enhanced bullet points, newline-separated, each starting with • and an action verb"
        ),
    })
  ),
  projects: z.array(
    z.object({
      id: z.string(),
      description: z.string().describe("Enhanced one-sentence project description"),
    })
  ),
});

export async function POST(req: NextRequest) {
  try {
    const data: ResumeData = await req.json();

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: enhancedSchema,
      prompt: `You are a professional resume writer. Enhance the following resume content to be more impactful, achievement-oriented, and ATS-friendly.

Rules:
- Use strong action verbs for all bullet points
- Quantify achievements where plausible (add realistic numbers/percentages)
- Keep each bullet to one punchy sentence, starting with •
- Keep the summary to 2-4 sentences
- Do NOT change IDs — return every experience and project entry with its original ID
- Do NOT alter names, company names, job titles, dates, or skills

Resume content:
${JSON.stringify(
  {
    summary: data.personalInfo.summary,
    experience: data.experience.map((e) => ({
      id: e.id,
      position: e.position,
      company: e.company,
      bullets: e.bullets,
    })),
    projects: data.projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
    })),
  },
  null,
  2
)}`,
    });

    const enhanced: ResumeData = {
      ...data,
      personalInfo: {
        ...data.personalInfo,
        summary: object.summary,
      },
      experience: data.experience.map((exp) => {
        const found = object.experience.find((e) => e.id === exp.id);
        return found ? { ...exp, bullets: found.bullets } : exp;
      }),
      projects: data.projects.map((proj) => {
        const found = object.projects.find((p) => p.id === proj.id);
        return found ? { ...proj, description: found.description } : proj;
      }),
    };

    return NextResponse.json(enhanced);
  } catch (error) {
    console.error("Enhance-all error:", error);
    return NextResponse.json(
      { error: "Failed to enhance resume" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/ai/enhance-all/route.ts
git commit -m "feat: add enhance-all API route for batch AI enhancement"
```

---

## Task 6: Create `components/latex-pdf-preview.tsx`

**Files:**
- Create: `components/latex-pdf-preview.tsx`

Wraps `react-pdf` to render a `Uint8Array`. Uses a stable `fileData` object ref so react-pdf doesn't re-render on every parent render. The PDF.js worker is loaded from CDN to avoid bundling it.

- [ ] **Step 1: Create the file**

```tsx
// components/latex-pdf-preview.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Loader2 } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface Props {
  pdfBytes: Uint8Array | null;
  compiling: boolean;
  error: string | null;
}

export function LatexPdfPreview({ pdfBytes, compiling, error }: Props) {
  const [numPages, setNumPages] = useState(0);
  // Stable object reference for react-pdf — only update when bytes actually change
  const fileRef = useRef<{ data: Uint8Array } | null>(null);
  const [file, setFile] = useState<{ data: Uint8Array } | null>(null);

  useEffect(() => {
    if (pdfBytes && pdfBytes !== fileRef.current?.data) {
      const next = { data: pdfBytes };
      fileRef.current = next;
      setFile(next);
    }
  }, [pdfBytes]);

  if (!file && !compiling && !error) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm text-center px-4">
        Start filling in your resume to see a live PDF preview.
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Compiling overlay — keeps last valid PDF visible */}
      {compiling && (
        <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center rounded pointer-events-none">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-2 px-3 py-2 text-xs text-destructive bg-destructive/10 rounded border border-destructive/20">
          {file ? "Compile error (showing last valid PDF)" : `Compile error: ${error}`}
        </div>
      )}

      {/* PDF render */}
      {file && (
        <Document
          file={file}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={null}
          error={
            <div className="text-xs text-destructive p-3">
              Failed to render PDF.
            </div>
          }
        >
          {Array.from({ length: numPages }, (_, i) => (
            <Page
              key={i + 1}
              pageNumber={i + 1}
              width={388}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          ))}
        </Document>
      )}

      {/* Initial compiling state (no PDF yet) */}
      {!file && compiling && (
        <div className="flex items-center justify-center h-64 text-muted-foreground text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Compiling PDF (first compile fetches LaTeX packages — may take 30s)…
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/latex-pdf-preview.tsx
git commit -m "feat: add LatexPdfPreview component with react-pdf"
```

---

## Task 7: Rewrite `components/ResumeBuilder.tsx`

**Files:**
- Modify: `components/ResumeBuilder.tsx`

Key changes:
- Remove `isExporting` state and `exportPdf` function
- Add `pdfBytes`, `compiling`, `compileError`, `enhancing` state
- Add `useEffect` with 1000ms debounced compile loop
- Add `handleEnhanceAll` function
- Replace `ResumePreview` import with `LatexPdfPreview`
- Update toolbar: "Download PDF" uses in-memory bytes, "Enhance with AI" calls enhance-all
- Remove `AIEnhanceButton` from all section editors
- Keep `useResumePersistence` (DB auto-save unchanged)

Replace the entire file content:

- [ ] **Step 1: Rewrite ResumeBuilder.tsx**

```tsx
// components/ResumeBuilder.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResumeProvider, useResume } from "@/lib/resume-context";
import { LatexPdfPreview } from "./latex-pdf-preview";
import { useResumePersistence } from "@/lib/use-resume-persistence";
import { buildLatex } from "@/lib/latex-template";
import { compileLaTeX } from "@/lib/latex-compiler";

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

  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [enhancing, setEnhancing] = useState(false);

  const [sections, setSections] = useState<Section[]>(defaultSections);
  const [activeSection, setActiveSection] = useState<string>("1");

  useResumePersistence(resumeId);

  // Debounced compile loop — fires 1000ms after any resumeData change
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setCompiling(true);
      try {
        const latex = buildLatex(resumeData);
        const bytes = await compileLaTeX(latex);
        setPdfBytes(bytes);
        setCompileError(null);
      } catch (err) {
        setCompileError(
          err instanceof Error ? err.message : "Compilation failed"
        );
      } finally {
        setCompiling(false);
      }
    }, 1000);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [resumeData]);

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
    if (!pdfBytes) return;
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${resumeData.title || "resume"}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [pdfBytes, resumeData.title]);

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
              disabled={enhancing || compiling}
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
              disabled={!pdfBytes || enhancing}
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
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
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
        <div className="w-[420px] border-l border-border bg-muted/30 overflow-y-auto hidden lg:block shrink-0">
          <div className="p-4">
            <h3 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">
              Live Preview
            </h3>
            <LatexPdfPreview
              pdfBytes={pdfBytes}
              compiling={compiling}
              error={compileError}
            />
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
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors. If there are errors about `react-pdf` types, run `npm install --save-dev @types/react-pdf` and retry. If `@types/react-pdf` doesn't exist (react-pdf ships its own types), remove that install.

- [ ] **Step 3: Commit**

```bash
git add components/ResumeBuilder.tsx
git commit -m "feat: wire WASM compile loop and batch AI enhance into builder"
```

---

## Task 8: Delete old files and final check

**Files:**
- Delete: `components/ResumePreview.tsx`
- Delete: `components/ai-enhance-button.tsx`
- Delete: `lib/use-ai-enhance.ts`
- Delete: `app/api/resumes/[id]/export/route.ts`
- Delete: `app/api/ai/enhance/route.ts`

- [ ] **Step 1: Delete the files**

```bash
git rm components/ResumePreview.tsx \
       components/ai-enhance-button.tsx \
       lib/use-ai-enhance.ts \
       app/api/resumes/[id]/export/route.ts \
       app/api/ai/enhance/route.ts
```

- [ ] **Step 2: Final type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors. If any file still imports the deleted modules, the error message will point to the exact line — remove or replace the import.

- [ ] **Step 3: Lint check**

```bash
npm run lint
```

Expected: 0 errors or warnings from modified files.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: remove old export route, per-field enhance, and HTML preview"
```

---

## SwiftLaTeX CDN Troubleshooting

If the worker fails to load SwiftLaTeX from the jsdelivr CDN (check browser console for errors in `latex-worker.js`):

1. Visit `https://www.npmjs.com/package/swiftlatex` to find the current version
2. Update the `importScripts` URL in `public/latex-worker.js` to match:
   ```
   https://cdn.jsdelivr.net/npm/swiftlatex@<version>/dist/PdfTeXEngine.js
   ```
3. If the CDN doesn't have `PdfTeXEngine.js`, check the package's `dist/` folder structure on npmjs.com and use the correct filename.

If SwiftLaTeX compiles but packages are missing (LaTeX error about missing `*.sty` files), the engine fetches packages from SwiftLaTeX's package server automatically — ensure the browser can reach `https://texlive2.swiftlatex.com/`. On first compile this takes 10-30s; subsequent compiles are fast (packages cached in IndexedDB).
