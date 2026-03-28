# LaTeX PDF Integration for Ascendume

This document describes the WASM-based LaTeX to PDF compiler integration for the Ascendume resume builder.

## Overview

The Ascendume resume builder now uses **SwiftLaTeX** (PdfTeX) compiled to WebAssembly to compile resumes to PDF directly in the browser, without requiring server-side processing.

## Technical Stack

- **Compiler**: SwiftLaTeX PdfTeX Engine (WebAssembly)
- **Location**: `public/latex-engine/`
- **Integration Hook**: `lib/use-latex-pdf.ts`
- **Export Hook**: `lib/use-pdf-export.tsx`

## Files and Structure

```
ascendume/
├── public/
│   ├── latex-engine/
│   │   ├── PdfTeXEngine.js          # Main engine JavaScript
│   │   ├── swiftlatexpdftex.js      # Engine wrapper
│   │   └── swiftlatexpdftex.wasm    # WebAssembly binary
│   └── templates/
│       └── jakes-resume.tex         # Jake's resume template (LaTeX source)
├── lib/
│   ├── use-latex-pdf.ts             # LaTeX compilation hook
│   ├── use-pdf-export.tsx           # Resume export hook
│   └── resume-context.tsx           # Updated with Jake template
└── LATEX_INTEGRATION.md             # This file
```

## How It Works

1. **Engine Loading**: On first PDF export attempt, the PdfTeX engine is loaded from `public/latex-engine/PdfTeXEngine.js`
2. **LaTeX Generation**: Resume data is converted to LaTeX format using the template in `use-latex-pdf.ts`
3. **Compilation**: The LaTeX source is written to the engine's virtual filesystem and compiled to PDF
4. **Download**: The resulting PDF is downloaded to the user's browser

## Key Features

- **Client-side only**: No server processing required
- **Fast compilation**: WebAssembly provides near-native performance
- **Full LaTeX support**: Supports all standard packages and commands
- **Jake's template**: Default professional resume template
- **Clean PDF output**: No borders, proper formatting

## Usage

### In Components

```typescript
import { usePdfExport } from "@/lib/use-pdf-export";
import { jakesResumeTemplate } from "@/lib/resume-context";

function MyComponent() {
  const { exportPdf, isExporting, engineReady } = usePdfExport();

  const handleExport = async () => {
    // Use Jake's template or custom data
    const data = jakesResumeTemplate; // or your resume data
    await exportPdf(data, "my-resume.pdf");
  };

  return (
    <button onClick={handleExport} disabled={isExporting}>
      {isExporting ? "Compiling..." : "Export PDF"}
    </button>
  );
}
```

### Using Jake's Template

```typescript
import { jakesResumeTemplate } from "@/lib/resume-context";

// Get Jake's default template
const resumeData = jakesResumeTemplate;

// Or modify it
const customResume = {
  ...jakesResumeTemplate,
  personalInfo: {
    ...jakesResumeTemplate.personalInfo,
    fullName: "Your Name",
    email: "your@email.com",
  },
};
```

## Engine Files

The WASM engine files are hosted locally in `public/latex-engine/`:

| File | Size | Purpose |
|------|------|---------|
| `PdfTeXEngine.js` | ~12KB | Main engine interface |
| `swiftlatexpdftex.js` | ~90KB | Engine wrapper |
| `swiftlatexpdftex.wasm` | ~1.7MB | WebAssembly binary |

## Limitations

- **Engine loading time**: First load may take a few seconds as the WASM module initializes
- **Memory usage**: Large documents may require more memory
- **Browser compatibility**: Requires modern browsers with WebAssembly support

## Troubleshooting

### Engine fails to load
- Check if the files exist in `public/latex-engine/`
- Ensure your development server serves static files correctly
- Check browser console for WASM compilation errors

### PDF compilation fails
- Verify the LaTeX template is valid
- Check the engine log for specific errors
- Ensure all required packages are loaded

### PDF has formatting issues
- The template uses `memoir`-compatible formatting
- Check the `geometry` and `enumitem` package settings
- Verify no special characters need escaping

## Customization

### Modifying the LaTeX Template

Edit `lib/use-latex-pdf.ts` to customize the resume template:

```typescript
const getResumeLatexTemplate = (data: ResumeData): string => {
  // Modify the LaTeX generation here
  return `\\documentclass[10pt]{article}
% ... your custom template
`;
};
```

### Using a Different Template

You can create custom LaTeX templates and use them with the `compileLatex` function:

```typescript
import { useLatexPdf } from "@/lib/use-latex-pdf";

function MyComponent() {
  const { compileLatex } = useLatexPdf();

  const handleExport = async () => {
    const customLatex = `\\documentclass{article}
\\begin{document}
Hello World!
\\end{document}`;
    
    await compileLatex(customLatex, "output.pdf");
  };
}
```

## Future Enhancements

- [ ] Support for multiple resume templates
- [ ] Template editor in the UI
- [ ] Export to multiple formats (PDF, DOCX)
- [ ] Real-time preview
- [ ] Custom color themes
- [ ] Font customization

## References

- [SwiftLaTeX GitHub](https://github.com/SwiftLaTeX/SwiftLaTeX)
- [PdfTeX Documentation](https://en.wikibooks.org/wiki/LaTeX/Reference_List)
- [LaTeX wikibook](https://en.wikibooks.org/wiki/LaTeX)
