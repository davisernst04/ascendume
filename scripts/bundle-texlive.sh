#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="$REPO_ROOT/public/texlive"
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

echo "→ Work dir:   $WORK_DIR"
echo "→ Output dir: $OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# ── 1. Format file ──────────────────────────────────────────────────────────
FMT_SRC="$(kpsewhich pdflatex.fmt 2>/dev/null || true)"
# Fallback: search TEXMFSYSVAR (system-wide cache, e.g. /var/lib/texmf on Arch)
if [ -z "$FMT_SRC" ]; then
  TEXMFSYSVAR="$(kpsewhich --var-value TEXMFSYSVAR 2>/dev/null || true)"
  if [ -n "$TEXMFSYSVAR" ] && [ -f "$TEXMFSYSVAR/web2c/pdftex/pdflatex.fmt" ]; then
    FMT_SRC="$TEXMFSYSVAR/web2c/pdftex/pdflatex.fmt"
  fi
fi
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
# User texmf trees (tlmgr --usermode installs land here)
TEXMFHOME="$(kpsewhich --var-value TEXMFHOME 2>/dev/null || true)"
echo "→ texmf-dist root: $TEXMF_DIST"
[ -n "$TEXMFHOME" ] && echo "→ texmf-home:      $TEXMFHOME"

COUNT=0
while IFS= read -r line; do
  if [[ "$line" == INPUT* ]]; then
    filepath="${line#INPUT }"
    [ -f "$filepath" ] || continue

    if [[ "$filepath" == "$TEXMF_DIST"* ]]; then
      relpath="${filepath#$TEXMF_DIST/}"
      destpath="$OUTPUT_DIR/texmf-dist/$relpath"
    elif [ -n "$TEXMFHOME" ] && [[ "$filepath" == "$TEXMFHOME"* ]]; then
      # User-installed packages: place them under texmf-dist/ so the WASM finds them
      relpath="${filepath#$TEXMFHOME/}"
      destpath="$OUTPUT_DIR/texmf-dist/$relpath"
    else
      # Skip files outside any known texmf tree (work dir, /etc, etc.)
      continue
    fi

    mkdir -p "$(dirname "$destpath")"
    cp "$filepath" "$destpath"
    COUNT=$((COUNT + 1))
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
