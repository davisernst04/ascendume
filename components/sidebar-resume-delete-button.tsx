"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SidebarResumeDeleteButton({ resumeId }: { resumeId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(true);
    try {
      await fetch(`/api/resumes/${resumeId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDelete}
      disabled={deleting}
      className="shrink-0 h-7 w-7 opacity-0 group-hover/resume-item:opacity-100 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-opacity"
      title="Delete resume"
    >
      <Trash2 className="h-3.5 w-3.5" />
      <span className="sr-only">Delete resume</span>
    </Button>
  );
}
