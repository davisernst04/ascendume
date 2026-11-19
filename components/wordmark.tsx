import Link from "next/link";
import { cn } from "@/lib/utils";

/** The product name in the book serif. Links home. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("font-display text-[1.3125rem] font-bold tracking-[-0.01em] text-ink", className)}>
      ascendume
    </Link>
  );
}
