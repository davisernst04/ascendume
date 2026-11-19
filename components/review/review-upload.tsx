import Link from "next/link";
import { PdfDrop } from "@/components/pdf-drop";

export function ReviewUpload() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12 sm:py-20">
      <h1 className="text-[2.441rem] font-bold leading-[1.05] text-ink">Review my resume</h1>
      <p className="mt-3 max-w-prose text-lg text-ink-soft">
        Upload it as a PDF. It opens in the builder, and every finding in the review points at the bullet it&apos;s
        about.
      </p>
      <PdfDrop size="large" className="mt-8" />
      <p className="mt-6 text-sm text-ink-soft">
        No resume yet?{" "}
        <Link href="/new?guided=1" className="font-semibold text-brand hover:underline">
          Build one by answering questions
        </Link>
      </p>
    </div>
  );
}
