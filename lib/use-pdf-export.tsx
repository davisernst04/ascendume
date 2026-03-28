"use client";

import { useCallback, useState } from "react";
import { ResumeData, jakesResumeTemplate, resumeTemplates } from "./resume-context";
import { useLatexPdf } from "./use-latex-pdf";

export function usePdfExport() {
  const {
    compileResume,
    isCompiling,
    engineReady,
    loadEngine,
  } = useLatexPdf();
  const [exportError, setExportError] = useState<string | null>(null);

  // Get Jake's resume template
  const getJakeTemplate = useCallback(() => {
    return jakesResumeTemplate;
  }, []);

  // Load Jake's template
  const loadJakeTemplate = useCallback(() => {
    return resumeTemplates.jake;
  }, []);

  const exportPdf = useCallback(async (
    data: ResumeData, 
    filename?: string
  ) => {
    setExportError(null);

    // Check if engine is ready, try to load if not
    if (!engineReady) {
      try {
        await loadEngine();
      } catch (err) {
        console.error("Failed to load engine:", err);
        setExportError("Failed to load LaTeX compiler. Please try again.");
        return;
      }
    }

    if (!engineReady) {
      setExportError("LaTeX compiler failed to initialize.");
      return;
    }

    try {
      const result = await compileResume(data);

      if (result.success && result.pdfBlob) {
        // Create download link
        const url = URL.createObjectURL(result.pdfBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename || `${data.title || "resume"}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Cleanup
        URL.revokeObjectURL(url);
        setExportError(null);
      } else {
        console.error("PDF compilation failed:", result.error);
        setExportError(result.error || "Failed to generate PDF");
      }
    } catch (err) {
      console.error("PDF export error:", err);
      setExportError(err instanceof Error ? err.message : "Failed to export PDF");
    }
  }, [compileResume, engineReady, loadEngine]);

  return { 
    exportPdf, 
    isExporting: isCompiling,
    error: exportError,
    engineReady,
    loadEngine,
    getJakeTemplate,
    loadJakeTemplate,
  };
}