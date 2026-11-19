// components/latex-pdf-preview.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import { buildLatex } from "@/lib/resume-latex";
import type { ResumeData } from "@/lib/resume-context";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export interface CompileResult {
  /** The exact source that was compiled, so callers can tell whether it matches the current resume. */
  latex: string;
  /** Page count, or null if the compile failed. */
  pages: number | null;
}

interface Props {
  data: ResumeData;
  onPdfReady?: (blob: Blob) => void;
  onCompiled?: (result: CompileResult) => void;
  width?: number;
}

/** A compiled PDF and the source it came from. */
interface Pdf {
  url: string;
  latex: string;
}

/** Letter paper: 11 / 8.5. */
const PAGE_RATIO = 11 / 8.5;

/**
 * Compiles the resume in a worker and shows it one page at a time. The last
 * good PDF stays on screen while the next one compiles and renders, so typing
 * doesn't make the page flash.
 */
export function LatexPdfPreview({ data, onPdfReady, onCompiled, width = 388 }: Props) {
  const workerRef = useRef<Worker | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqIdRef = useRef(0);
  const onPdfReadyRef = useRef(onPdfReady);
  const onCompiledRef = useRef(onCompiled);
  const pendingLatexRef = useRef<string>("");

  // `shown` is on screen; `next` loads underneath and replaces it once its first page is drawn.
  const [shown, setShown] = useState<Pdf | null>(null);
  const [next, setNext] = useState<Pdf | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // One page at a time, so the whole page fits on screen; a pager moves between pages.
  const [pageWanted, setPageWanted] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const pagesByUrl = useRef(new Map<string, number>());

  useEffect(() => {
    onPdfReadyRef.current = onPdfReady;
    onCompiledRef.current = onCompiled;
  }, [onPdfReady, onCompiled]);

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
      setCompiling(false);

      if (success && pdf) {
        const blob = new Blob([pdf as BlobPart], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setError(null);
        setNext((prev) => {
          if (prev) URL.revokeObjectURL(prev.url);
          return { url, latex: pendingLatexRef.current };
        });
        onPdfReadyRef.current?.(blob);
      } else {
        const errorLine =
          (log ?? "")
            .split("\n")
            .find((l) => l.startsWith("!")) ?? log ?? "Unknown error";
        setError(errorLine.replace(/^!\s*/, ""));
        onCompiledRef.current?.({ latex: pendingLatexRef.current, pages: null });
      }
    };

    return () => {
      worker.terminate();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Revoke object URLs that leave the screen.
  const shownUrl = shown?.url;
  useEffect(() => {
    return () => {
      if (shownUrl) URL.revokeObjectURL(shownUrl);
    };
  }, [shownUrl]);

  // Debounce compilation: 1500ms after the last data change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!workerRef.current) return;
      const id = ++reqIdRef.current;
      const latex = buildLatex(data);
      pendingLatexRef.current = latex;
      setCompiling(true);
      workerRef.current.postMessage({ id, latex });
    }, 1500);
  }, [data]);

  const height = Math.round(width * PAGE_RATIO);
  const busy = compiling || next !== null;
  const page = Math.min(pageWanted, Math.max(1, pageCount));

  return (
    <div className="flex flex-col items-center gap-3" style={{ width }}>
      <div className="relative" style={{ width, height }}>
        {!shown && (
          <div className="sheet flex flex-col items-center justify-center gap-2 text-sm text-[#6b6257]" style={{ width, height }}>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Setting your page in type…
          </div>
        )}

        {[shown, next].map(
          (pdf) =>
            pdf && (
              <PdfLayer
                key={pdf.url}
                url={pdf.url}
                width={width}
                page={page}
                visible={pdf === shown}
                onLoad={(pages) => {
                  pagesByUrl.current.set(pdf.url, pages);
                  onCompiledRef.current?.({ latex: pdf.latex, pages });
                }}
                onRendered={() => {
                  if (pdf !== next) return;
                  setShown(pdf);
                  setPageCount(pagesByUrl.current.get(pdf.url) ?? 1);
                  setNext((n) => (n === pdf ? null : n));
                }}
              />
            )
        )}

        {shown && busy && (
          <p
            role="status"
            className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-[#2b2620]/80 px-2.5 py-1 text-xs font-semibold text-white"
          >
            <Loader2 className="size-3 animate-spin" aria-hidden /> Updating
          </p>
        )}

        {/* Errors sit over the foot of the page so they never push it down. */}
        {error && (
          <p
            role="status"
            className="absolute inset-x-3 bottom-3 rounded-md border border-danger/30 bg-danger-wash px-3 py-2 text-sm text-danger shadow-sm"
          >
            The page couldn&apos;t be typeset: {error}. The last good version is shown.
          </p>
        )}
      </div>

      {pageCount > 1 && (
        <div className="flex items-center gap-1 text-sm text-ink-soft" role="group" aria-label="Pages">
          <button
            type="button"
            onClick={() => setPageWanted(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
            className="grid size-8 place-items-center rounded-md hover:bg-mist disabled:opacity-40"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <span className="tabular-nums">
            Page {page} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPageWanted(page + 1)}
            disabled={page >= pageCount}
            aria-label="Next page"
            className="grid size-8 place-items-center rounded-md hover:bg-mist disabled:opacity-40"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}

/** Height the preview needs beyond the page itself: the pager row under a multi-page resume. */
export const PREVIEW_CHROME_HEIGHT = 44;

/**
 * One compiled PDF, showing a single page. A hidden layer sits on top of the
 * shown one, invisible, until its page has rendered.
 */
function PdfLayer({
  url,
  width,
  page,
  visible,
  onLoad,
  onRendered,
}: {
  url: string;
  width: number;
  page: number;
  visible: boolean;
  onLoad: (pages: number) => void;
  onRendered: () => void;
}) {
  const [pages, setPages] = useState(0);
  const height = Math.round(width * PAGE_RATIO);

  return (
    <div aria-hidden={!visible} className={visible ? undefined : "pointer-events-none absolute inset-0 opacity-0"}>
      <Document
        file={url}
        loading={null}
        suspense={false}
        onLoadSuccess={({ numPages }) => {
          setPages(numPages);
          onLoad(numPages);
        }}
      >
        {pages > 0 && (
          <div className="sheet" style={{ width, height }}>
            <Page
              pageNumber={Math.min(page, pages)}
              width={width}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              onRenderSuccess={onRendered}
            />
          </div>
        )}
      </Document>
    </div>
  );
}
