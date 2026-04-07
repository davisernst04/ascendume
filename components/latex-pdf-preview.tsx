// components/latex-pdf-preview.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import { buildLatex } from "@/lib/resume-latex";
import type { ResumeData } from "@/lib/resume-context";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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
  const onPdfReadyRef = useRef(onPdfReady);

  const [state, setState] = useState<PreviewState>({ type: "idle" });
  const [numPages, setNumPages] = useState<number>(0);

  // Keep ref synced with latest callback
  useEffect(() => {
    onPdfReadyRef.current = onPdfReady;
  }, [onPdfReady]);

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
      if (id !== reqIdRef.current) return;

      if (success && pdf) {
        const blob = new Blob([pdf as BlobPart], { type: "application/pdf" });
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
  }, []);

  // Debounce compilation: 1500ms after the last data change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!workerRef.current) return;
      const id = ++reqIdRef.current;
      setState({ type: "compiling" });
      workerRef.current.postMessage({ id, latex: buildLatex(data) });
    }, 1500);
  }, [data]);

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
    <Document
      file={state.url}
      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
      loading={null}
    >
      {Array.from({ length: numPages }, (_, i) => (
        <Page
          key={i}
          pageNumber={i + 1}
          width={width}
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />
      ))}
    </Document>
  );
}
