"use client";

import { useRef } from "react";
import Link from "next/link";
import { FileUp, Loader2 } from "lucide-react";
import { useResumeUpload } from "@/lib/use-resume-upload";

export function ReviewUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading, error } = useResumeUpload();

  return (
    <div className="h-full flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-lg space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Review my resume</h1>
          <p className="text-muted-foreground">
            Upload your resume as a PDF. We&apos;ll import it into the builder and review it,
            with every finding tied to the bullet it&apos;s about.
          </p>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="w-full rounded-xl border-2 border-dashed border-border hover:border-primary/60 transition-colors p-10 flex flex-col items-center gap-3 disabled:opacity-70"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="font-medium">Reading your resume…</span>
              <span className="text-xs text-muted-foreground">This takes up to a minute.</span>
            </>
          ) : (
            <>
              <FileUp className="h-8 w-8 text-primary" />
              <span className="font-medium">Choose a PDF</span>
            </>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) upload(file);
          }}
        />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        <p className="text-sm text-muted-foreground">
          No resume yet?{" "}
          <Link href="/new" className="text-primary hover:underline">
            Build one instead
          </Link>
        </p>
      </div>
    </div>
  );
}
