"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { useResumeUpload } from "@/lib/use-resume-upload";
import { cn } from "@/lib/utils";

/**
 * Drop or choose a PDF resume. The server reads it into a new resume, which
 * opens in the builder with a review running.
 */
export function PdfDrop({ className, size = "default" }: { className?: string; size?: "default" | "large" }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading, error } = useResumeUpload();
  const [over, setOver] = useState(false);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file && !isUploading) upload(file);
        }}
        disabled={isUploading}
        aria-describedby={error ? "pdf-drop-error" : undefined}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 text-center transition-colors",
          size === "large" ? "min-h-56 py-10" : "min-h-36 py-6",
          over ? "border-brand bg-brand-wash" : "border-rule-strong bg-mist/40 hover:border-ink-soft hover:bg-mist/70",
          isUploading && "cursor-progress"
        )}
      >
        {isUploading ? (
          <>
            <Loader2 className="size-6 animate-spin text-brand" aria-hidden />
            <span className="font-semibold text-ink">Reading your resume…</span>
            <span className="text-sm text-ink-soft">This can take up to a minute. Keep this tab open.</span>
          </>
        ) : (
          <>
            <FileUp className="size-6 text-ink-soft" aria-hidden />
            <span className="font-semibold text-ink">Drop a PDF here, or choose one</span>
            <span className="text-sm text-ink-soft">Up to 5 MB. It opens in the builder with a review running.</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) upload(file);
        }}
      />
      {error && (
        <p id="pdf-drop-error" role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
