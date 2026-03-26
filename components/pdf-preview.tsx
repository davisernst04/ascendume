"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { FileText, Loader2 } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set up PDF worker
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

export function PDFResumePreview() {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [containerWidth, setContainerWidth] = useState<number>(300);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const padding = window.innerWidth < 640 ? 32 : 48;
        const availableWidth = containerRef.current.clientWidth - padding;
        setContainerWidth(Math.min(availableWidth, 600));
      }
    };

    const timeoutId = setTimeout(updateWidth, 100);
    window.addEventListener("resize", updateWidth);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  }

  function onDocumentLoadError(err: Error) {
    console.error("PDF load error:", err);
    setError(err.message);
    setIsLoading(false);
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-3xl mx-auto group px-4 sm:px-8 lg:px-0"
    >
      <div className="absolute -inset-2 sm:-inset-10 from-primary/20 to-accent/20 blur-[40px] sm:blur-[100px] opacity-40 group-hover:opacity-70 transition-opacity duration-1000 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        className="relative overflow-hidden shadow-2xl bg-background"
      >
        <div className="min-h-[350px] sm:min-h-[600px] flex items-center justify-center p-4 sm:p-8">
          <Document
            file="/JohnDoe.pdf"
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex flex-col items-center gap-4 py-20">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-[10px] sm:text-xs font-black text-muted-foreground animate-pulse tracking-widest uppercase">
                  Loading PDF...
                </p>
              </div>
            }
            error={
              <div className="py-20 text-center px-6">
                <FileText className="w-8 h-8 text-destructive mx-auto mb-4 opacity-20" />
                <p className="text-destructive font-black text-[10px] uppercase mb-2">
                  PDF Load Failed
                </p>
                <p className="text-muted-foreground text-xs">{error}</p>
              </div>
            }
          >
            {numPages && (
              <div className="border-0 shadow-none outline-none">
                <Page
                  pageNumber={1}
                  width={containerWidth}
                  className="border-0 shadow-none"
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                />
              </div>
            )}
          </Document>
        </div>
      </motion.div>
    </div>
  );
}
