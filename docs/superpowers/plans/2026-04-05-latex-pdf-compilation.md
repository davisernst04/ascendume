# LaTeX PDF Compilation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `@react-pdf/renderer` with real pdfTeX (WASM) compilation so live preview and downloaded PDFs are visually identical to Jake's resume template.

**Architecture:** The existing `public/swiftlatexpdftex.wasm` is pdfTeX 1.40.21 compiled to WebAssembly — it works. The only failure was that it fetched its format file and package files from a dead server (`texlive2.swiftlatex.com`). Fix: patch the endpoint URL in `swiftlatexpdftex.js` to `/texlive/`, generate `swiftlatexpdftex.fmt` from the local TeX Live installation, collect the package files Jake's template requires, and commit them to `public/texlive/`. Vercel serves these as static CDN assets permanently.

**Tech Stack:** pdfTeX 1.40.21 (SwiftLaTeX WASM), TypeScript, React 19, Next.js 16, Web Workers

---

## File Map

| Status | Path | Responsibility |
|---|---|---|
| Create | `scripts/bundle-texlive.sh` | One-time script: generate fmt + collect packages |
| Create | `public/texlive/` | Self-hosted texlive bundle (~15–25MB) |
| Modify | `public/swiftlatexpdftex.js` | Patch dead endpoint → `/texlive/` |
| Modify | `public/latex-worker.js` | Accept `.tex` string, compile, return PDF bytes |
| Create | `lib/resume-latex.ts` | `escapeLatex()` + `buildLatex(data)` |
| Create | `components/latex-pdf-preview.tsx` | Worker-based preview with 1500ms debounce |
| Modify | `components/ResumeBuilder.tsx` | Swap `ReactPdfPreview` → `LatexPdfPreview` |
| Delete | `components/react-pdf-preview.tsx` | Replaced by latex-pdf-preview |
| Delete | `components/resume-pdf-document.tsx` | Replaced by lib/resume-latex.ts |

---

## Task 1: Create the texlive bundle script and generate `public/texlive/`

**Files:**
- Create: `scripts/bundle-texlive.sh`
- Create (generated): `public/texlive/`

This script generates the pdfTeX format file and discovers every package file that Jake's template requires by compiling it with `-recorder`.

> **⚠️ Potential version mismatch:** The WASM is pdfTeX 1.40.21; the local TeX Live 2026 has 1.40.29. If the fmt file fails to load in the browser (console error like `fmt version mismatch`), run the Docker fallback in the troubleshooting note at the end of this task.

- [ ] **Step 1: Write `scripts/bundle-texlive.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="$REPO_ROOT/public/texlive"
WORK_DIR="$(mktemp -d)"
trap "rm -rf $WORK_DIR" EXIT

echo "→ Work dir:   $WORK_DIR"
echo "→ Output dir: $OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# ── 1. Format file ──────────────────────────────────────────────────────────
FMT_SRC="$(kpsewhich pdflatex.fmt)"
if [ -z "$FMT_SRC" ]; then
  echo "ERROR: pdflatex.fmt not found. Is texlive-basic installed?"
  exit 1
fi
cp "$FMT_SRC" "$OUTPUT_DIR/swiftlatexpdftex.fmt"
echo "✓ swiftlatexpdftex.fmt  ($(du -sh "$OUTPUT_DIR/swiftlatexpdftex.fmt" | cut -f1))"

# ── 2. Compile Jake's template with -recorder to discover package files ─────
cat > "$WORK_DIR/resume.tex" << 'ENDTEX'
\documentclass[letterpaper,11pt]{article}
\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{marvosym}
\usepackage[usenames,dvipsnames]{color}
\usepackage{verbatim}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}
\input{glyphtounicode}
\pagestyle{fancy}\fancyhf{}\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}\renewcommand{\footrulewidth}{0pt}
\addtolength{\oddsidemargin}{-0.5in}\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1in}\addtolength{\topmargin}{-.5in}\addtolength{\textheight}{1.0in}
\urlstyle{same}\raggedbottom\raggedright\setlength{\tabcolsep}{0in}
\titleformat{\section}{\vspace{-4pt}\scshape\raggedright\large}{}{0em}{}[\color{black}\titlerule \vspace{-5pt}]
\pdfgentounicode=1
\newcommand{\resumeItem}[1]{\item\small{{#1 \vspace{-2pt}}}}
\newcommand{\resumeSubheading}[4]{\vspace{-2pt}\item
  \begin{tabular*}{0.97\textwidth}[t]{l@{\extracolsep{\fill}}r}
    \textbf{#1} & #2 \\ \textit{\small#3} & \textit{\small #4} \\
  \end{tabular*}\vspace{-7pt}}
\newcommand{\resumeProjectHeading}[2]{\item
  \begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
    \small#1 & #2 \\
  \end{tabular*}\vspace{-7pt}}
\renewcommand\labelitemii{$\vcenter{\hbox{\tiny$\bullet$}}$}
\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.15in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\newcommand{\resumeItemListStart}{\begin{itemize}}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-5pt}}
\begin{document}
\begin{center}
  \textbf{\Huge \scshape Jake Ryan} \\ \vspace{1pt}
  \small 123-456-7890 $|$ \href{mailto:jake@su.edu}{\underline{jake@su.edu}} $|$
  \href{https://linkedin.com/in/jake}{\underline{linkedin.com/in/jake}} $|$
  \href{https://github.com/jake}{\underline{github.com/jake}}
\end{center}
\section{Education}
  \resumeSubHeadingListStart
    \resumeSubheading{Southwestern University}{Georgetown, TX}{Bachelor of Arts in Computer Science}{Aug. 2018 -- May 2021}
  \resumeSubHeadingListEnd
\section{Experience}
  \resumeSubHeadingListStart
    \resumeSubheading{Software Engineer}{June 2020 -- Present}{Tech Company}{San Francisco, CA}
      \resumeItemListStart
        \resumeItem{Developed a REST API using FastAPI and PostgreSQL}
        \resumeItem{Built a full-stack web application using React}
      \resumeItemListEnd
  \resumeSubHeadingListEnd
\section{Projects}
    \resumeSubHeadingListStart
      \resumeProjectHeading{\textbf{Gitlytics} $|$ \emph{Python, Flask, React, PostgreSQL}}{}
          \resumeItemListStart
            \resumeItem{Developed a full-stack web application}
          \resumeItemListEnd
    \resumeSubHeadingListEnd
\section{Technical Skills}
 \begin{itemize}[leftmargin=0.15in, label={}]
    \small{\item{
     \textbf{Languages}{: Java, Python, C/C++, JavaScript} \\
     \textbf{Frameworks}{: React, Node.js, Flask} \\
     \textbf{Developer Tools}{: Git, Docker, VS Code}
    }}
 \end{itemize}
\end{document}
ENDTEX

echo "→ Compiling Jake's template to discover package files..."
cd "$WORK_DIR"
pdflatex -interaction=nonstopmode -recorder resume.tex > compile.log 2>&1 || true

if [ ! -f "$WORK_DIR/resume.fls" ]; then
  echo "ERROR: pdflatex did not produce resume.fls. Log:"
  tail -20 compile.log
  exit 1
fi

# ── 3. Copy package files preserving texmf-dist/ structure ──────────────────
TEXMF_DIST="$(kpsewhich --var-value TEXMFDIST)"
echo "→ texmf-dist root: $TEXMF_DIST"

COUNT=0
while IFS= read -r line; do
  if [[ "$line" == INPUT* ]]; then
    filepath="${line#INPUT }"
    # Only copy files from the texmf-dist tree (skip .tex, .pdf, .aux, system files)
    if [[ "$filepath" == "$TEXMF_DIST"* ]] && [ -f "$filepath" ]; then
      relpath="${filepath#$TEXMF_DIST/}"
      destpath="$OUTPUT_DIR/texmf-dist/$relpath"
      mkdir -p "$(dirname "$destpath")"
      cp "$filepath" "$destpath"
      COUNT=$((COUNT + 1))
    fi
  fi
done < "$WORK_DIR/resume.fls"

echo "✓ Copied $COUNT package files"
echo ""
echo "Bundle contents (first 60 files):"
find "$OUTPUT_DIR" -type f | sort | head -60
echo ""
echo "Total size: $(du -sh "$OUTPUT_DIR" | cut -f1)"
echo ""
echo "Done. Commit public/texlive/ to git."
```

- [ ] **Step 2: Make the script executable and run it**

```bash
chmod +x scripts/bundle-texlive.sh
bash scripts/bundle-texlive.sh
```

Expected output ends with `Total size: X.XM` and `Done. Commit public/texlive/ to git.`

- [ ] **Step 3: Verify the bundle**

```bash
ls public/texlive/
# Must show: swiftlatexpdftex.fmt  and  texmf-dist/
ls public/texlive/texmf-dist/tex/latex/ | head -10
# Must show package directories like: babel-english/ enumitem/ fancyhdr/ hyperref/ etc.
du -sh public/texlive/
# Expect: 10M–30M
```

- [ ] **Step 4: Commit the bundle**

```bash
git add public/texlive/
git commit -m "feat: add self-hosted texlive bundle for SwiftLaTeX WASM"
```

> **Troubleshooting — fmt version mismatch:** If the browser console later shows a format version error when the WASM loads, the pdfTeX 1.40.21 WASM can't read the 1.40.29-generated fmt. Fix with Docker (requires Docker Desktop):
> ```bash
> docker run --rm -v "$(pwd)/public/texlive:/out" \
>   registry.gitlab.com/islandoftex/images/texlive:TL2020-2020-09-22-small \
>   bash -c "cp \$(kpsewhich pdflatex.fmt) /out/swiftlatexpdftex.fmt"
> git add public/texlive/swiftlatexpdftex.fmt
> git commit -m "fix: regenerate fmt using pdfTeX 1.40.21 (TeX Live 2020)"
> ```

---

## Task 2: Patch the dead endpoint in `public/swiftlatexpdftex.js`

**Files:**
- Modify: `public/swiftlatexpdftex.js`

The WASM wrapper has the dead server URL hardcoded. Change it to the local path.

- [ ] **Step 1: Verify the string exists**

```bash
grep -n "texlive2.swiftlatex.com" public/swiftlatexpdftex.js
```

Expected: one matching line near the top of the file.

- [ ] **Step 2: Patch the endpoint**

Open `public/swiftlatexpdftex.js` and change:

```js
texlive_endpoint='texlive2.swiftlatex.com/'
```

to:

```js
texlive_endpoint='/texlive/'
```

- [ ] **Step 3: Verify the change**

```bash
grep -n "texlive_endpoint" public/swiftlatexpdftex.js
```

Expected output: `N:texlive_endpoint='/texlive/'`

- [ ] **Step 4: Commit**

```bash
git add public/swiftlatexpdftex.js
git commit -m "fix: redirect SwiftLaTeX texlive endpoint to self-hosted bundle"
```

---

## Task 3: Create `lib/resume-latex.ts`

**Files:**
- Create: `lib/resume-latex.ts`

Pure TypeScript module. No runtime dependencies. Two exports: `escapeLatex` and `buildLatex`.

- [ ] **Step 1: Write `lib/resume-latex.ts`**

```typescript
// lib/resume-latex.ts
import type { ResumeData } from "@/lib/resume-context";

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
  return s ? escapeLatex(s) : "";
}

function parseBullets(raw: string): string[] {
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
      `\\href{mailto:${e(p.email)}}{\\underline{${e(p.email)}}}`
    );
  if (p.linkedin)
    contactParts.push(
      `\\href{${e(p.linkedin)}}{\\underline{${e(p.linkedin)}}}`
    );
  if (p.github)
    contactParts.push(`\\href{${e(p.github)}}{\\underline{${e(p.github)}}}`);
  if (p.website)
    contactParts.push(
      `\\href{${e(p.website)}}{\\underline{${e(p.website)}}}`
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
      {${e(edu.institution)}}{${e(p.location)}}
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
      {${e(exp.position)}}{${dateRange}}
      {${e(exp.company)}}{}
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
      ? `\\href{${e(proj.url)}}{\\underline{${e(proj.name)}}}`
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

  // Skills
  const skillLines: string[] = [];
  if (data.skills.technical)
    skillLines.push(
      `     \\textbf{Languages}{: ${e(data.skills.technical)}} \\\\`
    );
  if (data.skills.frameworks)
    skillLines.push(
      `     \\textbf{Frameworks}{: ${e(data.skills.frameworks)}} \\\\`
    );
  if (data.skills.tools)
    skillLines.push(
      `     \\textbf{Developer Tools}{: ${e(data.skills.tools)}} \\\\`
    );
  const skillsSection =
    skillLines.length === 0
      ? ""
      : `
%-----------TECHNICAL SKILLS-----------
\\section{Technical Skills}
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
${summarySection}${educationSection}${experienceSection}${projectsSection}${skillsSection}${certsSection}
\\end{document}
`;
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/resume-latex.ts
git commit -m "feat: add resume LaTeX template builder"
```

---

## Task 4: Update `public/latex-worker.js`

**Files:**
- Modify: `public/latex-worker.js`

The worker already initialises `PdfTeXEngine` and calls `compileLaTeX`. The only changes needed:
1. Accept the `latex` string from the message payload (already done — remove the old hardcoded template if present)
2. Fix the success check — `result.status` is a number, but `result.pdf` is only set on success, so check `result.pdf !== undefined`

- [ ] **Step 1: Replace `public/latex-worker.js` with**

```javascript
// public/latex-worker.js
/* global PdfTeXEngine */

let engine = null;
let initPromise = null;

async function initEngine() {
  if (engine) return;
  if (!initPromise) {
    initPromise = (async () => {
      importScripts("/PdfTeXEngine.js");
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
    if (result.pdf !== undefined) {
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

- [ ] **Step 2: Commit**

```bash
git add public/latex-worker.js
git commit -m "fix: update latex worker to accept .tex string and fix success check"
```

---

## Task 5: Create `components/latex-pdf-preview.tsx`

**Files:**
- Create: `components/latex-pdf-preview.tsx`

Client component. Creates one Web Worker on mount, debounces 1500ms on data change, posts `{ id, latex }` to the worker, handles the response.

- [ ] **Step 1: Write `components/latex-pdf-preview.tsx`**

```tsx
// components/latex-pdf-preview.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { buildLatex } from "@/lib/resume-latex";
import type { ResumeData } from "@/lib/resume-context";

interface Props {
  data: ResumeData;
  onPdfReady?: (blob: Blob) => void;
  width?: number;
}

type PreviewState =
  | { type: "idle" }
  | { type: "compiling" }
  | { type: "ready"; url: string }
  | { type: "error"; message: string };

export function LatexPdfPreview({ data, onPdfReady, width = 388 }: Props) {
  const workerRef = useRef<Worker | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevUrlRef = useRef<string | null>(null);
  const reqIdRef = useRef(0);
  // Use a ref for onPdfReady so the worker handler never captures a stale closure
  const onPdfReadyRef = useRef(onPdfReady);
  onPdfReadyRef.current = onPdfReady;

  const [state, setState] = useState<PreviewState>({ type: "idle" });

  // Create the worker once on mount; terminate on unmount
  useEffect(() => {
    const worker = new Worker("/latex-worker.js");
    workerRef.current = worker;

    worker.onmessage = (ev) => {
      const { id, success, pdf, log } = ev.data as {
        id: number;
        success: boolean;
        pdf?: Uint8Array;
        log?: string;
      };
      // Discard responses that arrived after a newer request was sent
      if (id !== reqIdRef.current) return;

      if (success && pdf) {
        const blob = new Blob([pdf], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
        prevUrlRef.current = url;
        setState({ type: "ready", url });
        onPdfReadyRef.current?.(blob);
      } else {
        const errorLine =
          (log ?? "")
            .split("\n")
            .find((l) => l.startsWith("!")) ?? log ?? "Unknown error";
        setState({ type: "error", message: errorLine });
      }
    };

    return () => {
      worker.terminate();
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce compilation: 1500ms after the last data change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!workerRef.current) return;
      const id = ++reqIdRef.current;
      setState({ type: "compiling" });
      workerRef.current.postMessage({ id, latex: buildLatex(data) });
    }, 1500);
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const height = Math.round(width * 1.294);

  if (state.type === "idle" || state.type === "compiling") {
    return (
      <div
        style={{ width, height }}
        className="flex flex-col items-center justify-center text-muted-foreground text-sm gap-2"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        {state.type === "compiling" ? "Compiling LaTeX…" : "Waiting for input…"}
      </div>
    );
  }

  if (state.type === "error") {
    return (
      <div className="px-3 py-2 text-xs text-destructive bg-destructive/10 rounded border border-destructive/20">
        LaTeX error: {state.message}
      </div>
    );
  }

  return (
    <iframe
      src={state.url}
      style={{ width, height, border: "none" }}
      title="Resume PDF Preview"
    />
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/latex-pdf-preview.tsx
git commit -m "feat: add LaTeX PDF preview component with debounced compilation"
```

---

## Task 6: Update `components/ResumeBuilder.tsx`

**Files:**
- Modify: `components/ResumeBuilder.tsx`

Swap the `ReactPdfPreview` dynamic import for `LatexPdfPreview`.

- [ ] **Step 1: Replace the dynamic import block**

Find (lines 28–39):
```tsx
const ReactPdfPreview = dynamic(
  () => import("./react-pdf-preview").then((m) => m.ReactPdfPreview),
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
```

Replace with:
```tsx
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
```

- [ ] **Step 2: Replace the JSX usage**

Find (around line 250):
```tsx
<ReactPdfPreview
  data={resumeData}
  onPdfReady={(blob) => { pdfBlobRef.current = blob; }}
  width={sidebarOpen ? 356 : 548}
```

Replace with:
```tsx
<LatexPdfPreview
  data={resumeData}
  onPdfReady={(blob) => { pdfBlobRef.current = blob; }}
  width={sidebarOpen ? 356 : 548}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/ResumeBuilder.tsx
git commit -m "feat: swap ReactPdfPreview for LatexPdfPreview"
```

---

## Task 7: Delete old files and remove unused package

**Files:**
- Delete: `components/react-pdf-preview.tsx`
- Delete: `components/resume-pdf-document.tsx`
- Modify: `package.json`

- [ ] **Step 1: Delete the old components**

```bash
rm components/react-pdf-preview.tsx
rm components/resume-pdf-document.tsx
```

- [ ] **Step 2: Remove `@react-pdf/renderer` from package.json**

```bash
npm uninstall @react-pdf/renderer
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors. If there are lingering import errors, search for any remaining references:
```bash
grep -r "react-pdf-preview\|resume-pdf-document\|@react-pdf" --include="*.ts" --include="*.tsx" .
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove react-pdf/renderer and old preview components"
```

---

## Task 8: End-to-end browser verification

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Open the resume builder and open DevTools Network tab**

Navigate to `http://localhost:3000/new`. Open Chrome DevTools → Network tab. Filter by `texlive`.

- [ ] **Step 3: Verify the fmt file is fetched**

After 1.5s of the page loading, the worker should trigger an initial compile. You should see a network request to `/texlive/swiftlatexpdftex.fmt`.

If the request returns **404**: the fmt file is not at the expected path. Check the exact URL the browser requested and adjust where the file is placed in `public/texlive/`.

If the request returns **200** but the console shows a **version mismatch error**: follow the Docker fallback in Task 1 to regenerate the fmt using pdfTeX 1.40.21.

- [ ] **Step 4: Verify the PDF renders**

After the fmt file loads (~3–8s on first visit), the preview panel should show a PDF matching Jake's resume template layout: centered uppercase name, pipe-separated contact, section rules, tabular subheadings.

- [ ] **Step 5: Test download**

Click the Download button. The downloaded PDF should be the same as the preview.

- [ ] **Step 6: Test live update**

Edit the name field. After ~1.5s of no typing, the preview should update with a fresh compile.
