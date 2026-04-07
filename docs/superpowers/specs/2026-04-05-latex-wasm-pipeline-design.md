# LaTeX WASM Pipeline Design

**Date:** 2026-04-05
**Branch:** dashboard

## Overview

Replace the current `latexonline.cc`-dependent, AI-generated LaTeX export with a fully client-side pipeline: a hardcoded Jake's Resume LaTeX template, SwiftLaTeX WASM compiler, and a real-time PDF viewer in the builder. AI enhancement shifts from per-field streaming buttons to a single batch "Enhance with AI" action.

## Two User Flows

Both flows converge at the same builder UI.

**Scratch flow:**
1. User navigates to `/new`, fills out resume forms
2. Every edit (debounced 1000ms) triggers `buildLatex(data)` → `compileLaTeX(latex)` → PDF renders in right panel
3. User clicks "Enhance with AI" → `POST /api/ai/enhance-all` → enhanced `ResumeData` returned → forms update → PDF recompiles
4. User clicks "Download PDF" → blob from in-memory `Uint8Array` → browser download

**Upload flow:**
1. User uploads PDF/DOCX on dashboard → `POST /api/resumes/parse` (unchanged) → redirects to `/[id]`
2. Builder loads with pre-populated forms from parsed data
3. Same path as scratch from here onward

## Architecture

### `lib/latex-template.ts`

Pure, synchronous module. Exports:

```ts
export function escapeLaTeX(str: string): string
export function buildLatex(data: ResumeData): string
```

`escapeLaTeX` sanitizes all user-provided strings, escaping `% & $ # _ { } ~ ^ \` before interpolation.

`buildLatex` interpolates `ResumeData` into the hardcoded Jake's Resume template:
- `\documentclass[letterpaper,11pt]{article}` with standard Jake's packages (`latexsym`, `fullpage`, `titlesec`, `marvosym`, `color`, `verbatim`, `enumitem`, `hyperref`, `fancyhdr`, `babel`)
- Header: name, phone, email, LinkedIn, GitHub, website
- Sections rendered conditionally — headings omitted if section has no entries
- Work experience: company, position, dates, bullets (newline-split into `\item` entries; empty lines skipped)
- Education: institution, degree, field, GPA, graduation date
- Skills: technical, frameworks, tools as comma-separated lists
- Projects: name + URL, technologies, description
- Certifications: name, issuer, date, credential URL

No AI involvement at this step. Called on every debounced keystroke.

### `lib/latex-compiler.ts`

Manages the SwiftLaTeX Web Worker. Exports:

```ts
export async function compileLaTeX(latexString: string): Promise<Uint8Array>
```

- Worker initialized once on first call, reused thereafter
- Packages fetched from SwiftLaTeX CDN on first compilation, cached in IndexedDB
- Subsequent compilations skip network fetch entirely

### `components/latex-pdf-preview.tsx`

Replaces `ResumePreview.tsx` in the builder's right panel. Uses `react-pdf` (PDF.js wrapper) to render a `Uint8Array` as an embedded PDF.

States:
- **Initializing** — full spinner while SwiftLaTeX worker loads and packages are fetched
- **Compiling** — subtle overlay indicator on the rendered PDF (last valid PDF stays visible)
- **Error** — small banner below the PDF showing compile error; last valid PDF stays visible
- **Ready** — PDF rendered at full panel width, scrollable if content exceeds one page

### `components/ResumeBuilder.tsx` (modified)

State additions:
```ts
const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null)
const [compiling, setCompiling] = useState(false)
const [compileError, setCompileError] = useState<string | null>(null)
const [enhancing, setEnhancing] = useState(false)
```

Compile loop:
```
useEffect watching resumeData
  → debounce 1000ms
  → setCompiling(true)
  → buildLatex(resumeData)
  → compileLaTeX(latex)
  → setPdfBytes(result) + setCompileError(null)
  → on error: setCompileError(message) (pdfBytes unchanged)
  → setCompiling(false)
```

Enhance handler:
```
onClick "Enhance with AI"
  → setEnhancing(true), disable form fields
  → POST /api/ai/enhance-all with current resumeData
  → on success: update ResumeContext with enhanced data (compile loop fires automatically)
  → on error: toast, state unchanged
  → setEnhancing(false)
```

Download handler:
```
onClick "Download PDF"
  → if pdfBytes is null: no-op
  → new Blob([pdfBytes], { type: "application/pdf" })
  → create object URL → trigger download → revoke URL
```

Navbar changes:
- "Export PDF" button → "Download PDF" (same position)
- New "Enhance with AI" button added to navbar
- Per-field `AIEnhanceButton` components removed from all section editors

### `app/api/ai/enhance-all/route.ts` (new)

Accepts full `ResumeData` as request body. Uses Vercel AI SDK `generateObject` with a Zod schema matching the enhanceable fields. Returns enhanced `ResumeData` with the same shape.

**Enhanced fields:**
- `personalInfo.summary`
- `experience[].bullets`
- `project[].description`

**Untouched fields:** all factual data (names, dates, locations, URLs, GPA, titles, skill lists).

Single LLM call rather than N streaming calls — simpler, typed output via `generateObject`.

## File Changes

### New
- `lib/latex-template.ts`
- `lib/latex-compiler.ts`
- `components/latex-pdf-preview.tsx`
- `app/api/ai/enhance-all/route.ts`

### Modified
- `components/ResumeBuilder.tsx`

### Deleted
- `components/ResumePreview.tsx`
- `components/ai-enhance-button.tsx`
- `lib/use-ai-enhance.ts`
- `app/api/resumes/[id]/export/route.ts`
- `app/api/ai/enhance/route.ts`

### New Dependencies
- `swiftlatex` — WASM pdflatex compiler
- `react-pdf` — PDF.js wrapper for in-browser rendering

## Error Handling

| Scenario | Behavior |
|---|---|
| LaTeX compile error (bad user input) | Error banner in preview panel; last valid PDF stays visible |
| SwiftLaTeX worker fails to initialize | Full error state in preview panel with retry button |
| Enhance-all API error | Toast notification; form state unchanged; PDF unchanged |
| Download clicked with no PDF | Button disabled until first successful compile |
| Parse upload fails | Existing error handling unchanged |

## Validation

No test runner configured. Run `npx tsc --noEmit` after implementation to validate types.
