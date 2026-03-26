"use client";

import { useCallback, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { ResumePDF } from "@/components/resume-pdf";
import { ResumeData } from "./resume-context";

export function usePdfExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportPdf = useCallback(async (data: ResumeData, filename?: string) => {
    setIsExporting(true);
    setError(null);

    try {
      const blob = await pdf(<ResumePDF data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || `${data.title || "resume"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF export error:", err);
      setError(err instanceof Error ? err.message : "Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { exportPdf, isExporting, error };
}