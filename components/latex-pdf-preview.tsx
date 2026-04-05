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
