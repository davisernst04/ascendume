# LaTeX PDF Compilation — Design Spec

**Date:** 2026-04-05
**Status:** Approved

## Problem

The current live preview and PDF download use `@react-pdf/renderer`, which does not reproduce Jake's resume template. The requirement is that both the live preview panel and the exported PDF must be generated from real pdfTeX compilation so the output is visually identical to Jake's LaTeX template.

## Constraints

- Deployed on Vercel (serverless only — no pdflatex binary available at runtime)
- Must power both live preview and download, not just download
- No new ongoing infrastructure cost

## Approach: Self-hosted SwiftLaTeX WASM bundle

The `swiftlatexpdftex.wasm` already in `public/` is pdfTeX 1.40.21 compiled to WebAssembly. It works correctly. The previous failure was caused entirely by its texlive package endpoint (`texlive2.swiftlatex.com`) being dead — the WASM tried to fetch the format file and package files from that server and got nothing.

Fix: regenerate the format file locally using the installed TeX Live, copy the ~30–50 package/font files that Jake's template requires, and host everything in `public/texlive/`. Vercel serves those files as static CDN assets. The WASM's endpoint is redirected to `/texlive/` on the same domain. No external dependencies.

## Data Flow

```
ResumeData
  → buildLatex(data)          [lib/resume-latex.ts]
  → .tex string
  → latex-worker.js           [Web Worker, public/]
    → writeMemFSFile("main.tex", latex)
    → engine.compileLaTeX()
      ← GET /texlive/swiftlatexpdftex.fmt   (~6MB, browser-cached after first load)
      ← GET /texlive/texmf-dist/.../*.sty   (package files, browser-cached)
    → Uint8Array (PDF bytes)
  → Blob URL
    → <iframe> (live preview)
    → Blob download (export button)
```

## Components

### `lib/resume-latex.ts` (new)

Two exports:

- `escapeLatex(str: string): string` — escapes the 10 LaTeX special characters: `& % $ # _ { } ~ ^ \`
- `buildLatex(data: ResumeData): string` — produces a complete Jake's-template `.tex` source from `ResumeData`. Sections rendered conditionally (only if data present): header, summary, education, experience, projects, technical skills, certifications.

No external dependencies. Pure TypeScript.

### `scripts/bundle-texlive.sh` (new)

One-time developer script. Requires local TeX Live installation.

Steps:
1. Generate `swiftlatexpdftex.fmt` by running `pdflatex -ini -jobname=swiftlatexpdftex "&pdflatex"`. This produces a format file under the name the WASM expects.
2. Compile Jake's template with `-recorder` to produce a `.fls` file listing every input file pdflatex accessed.
3. Parse the `.fls` file and copy each input file into `public/texlive/` preserving the texlive directory structure.
4. Copy `swiftlatexpdftex.fmt` into `public/texlive/`.

Output: `public/texlive/` directory committed to the repo.

### `public/texlive/` (new)

Self-hosted static texlive bundle. Served by Vercel CDN with long-lived cache headers.

Estimated contents:
- `swiftlatexpdftex.fmt` (~6MB)
- ~30–50 `.sty`, `.tfm`, `.pfb`, `.enc`, `.map` files for Jake's template packages

Packages required by Jake's template: `latexsym`, `fullpage`, `titlesec`, `marvosym`, `color`, `verbatim`, `enumitem`, `hyperref`, `fancyhdr`, `babel` (english), `tabularx`, `glyphtounicode`.

### `public/swiftlatexpdftex.js` (patched)

The inner WASM worker has a hardcoded `texlive_endpoint='texlive2.swiftlatex.com/'` near the top of the file. Change this to `texlive_endpoint='/texlive/'`. This is simpler and safer than calling `PdfTeXEngine.setTexliveEndpoint()` at runtime — that method nulls out the inner worker reference after sending the message, which breaks subsequent `writeMemFSFile` calls.

### `public/latex-worker.js` (updated)

Changes from current version:
- Accept `latex` string in the message payload, write it to MEMFS as `main.tex`, set it as main file, then compile.
- On success, post `{ id, success: true, pdf: result.pdf }` (Uint8Array).
- On failure, post `{ id, success: false, log: result.log }`.

No endpoint configuration needed — handled by the patch to `swiftlatexpdftex.js`.

### `components/latex-pdf-preview.tsx` (new, replaces `react-pdf-preview.tsx`)

Props: `{ data: ResumeData, onPdfReady?: (blob: Blob) => void, width?: number }`

Behavior:
- Holds a ref to the Web Worker (created once on mount, terminated on unmount).
- On `data` change, debounces 1500ms then sends the compiled `.tex` (via `buildLatex(data)`) to the worker.
- States: `idle` (no compile yet), `compiling` (spinner), `error` (log excerpt), `ready` (iframe).
- On success, creates a Blob URL for the iframe and calls `onPdfReady` with the Blob.
- First compile after page load: ~3–8s (fmt file fetched and cached). Subsequent: ~1–3s.

### `components/ResumeBuilder.tsx` (updated)

- Replace `ReactPdfPreview` import and usage with `LatexPdfPreview`.
- Props passed through unchanged (`data`, `onPdfReady`, `width`).
- Remove `@react-pdf/renderer` dynamic import.

### Deleted files

- `components/react-pdf-preview.tsx`
- `components/resume-pdf-document.tsx`

The `@react-pdf/renderer` package can be removed from `package.json` once the above is working.

## UX Notes

- **First load latency:** The fmt file (~6MB) is fetched once and cached by the browser indefinitely. Users will feel this on first visit; subsequent sessions are instant.
- **Compile latency:** 1–3s per update after warmup. The 1500ms debounce means the preview updates roughly 2.5–4.5s after the user stops typing — acceptable for a resume builder.
- **Error display:** Show the first `!` line from the pdfTeX log. Most errors in practice will be caused by special characters that weren't escaped.

## Setup Instructions (one-time)

```bash
# 1. Install TeX Live (already done)
sudo pacman -S texlive-basic texlive-latex texlive-latexrecommended \
  texlive-latexextra texlive-fontsrecommended texlive-fontsextra texlive-langenglish

# 2. Run the bundle script
bash scripts/bundle-texlive.sh

# 3. Commit the bundle
git add public/texlive/
git commit -m "feat: add self-hosted texlive bundle for SwiftLaTeX WASM"
```

## Out of Scope

- Multiple resume templates (only Jake's template in this iteration)
- Server-side PDF generation for email/background export
- Font customization
