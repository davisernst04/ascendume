"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics/track";

/**
 * Uploads a PDF resume, which the server parses into a new resume, then opens it
 * in the builder with a review requested (`?review=1`).
 */
export function useResumeUpload() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setError(null);
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Upload a PDF. In Word or Google Docs, use File → Download → PDF.");
      return;
    }
    setIsUploading(true);
    track("resume_started", { route: "review" });
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/resumes/parse", { method: "POST", body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "We couldn't read that PDF.");
      track("resume_imported", {});
      router.push(`/${data.resumeId}?review=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't read that PDF.");
      setIsUploading(false);
    }
  };

  return { upload, isUploading, error };
}
