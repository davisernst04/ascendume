import { diffWords } from "@/lib/text-diff";

/** A rewrite shown against the original: removed words struck through, added words highlighted. */
export function DiffView({ before, after }: { before: string; after: string }) {
  return (
    <p className="rounded-md bg-muted/40 px-2 py-1.5 leading-relaxed">
      {diffWords(before, after).map((part, i) =>
        part.type === "same" ? (
          <span key={i}>{part.text}</span>
        ) : part.type === "added" ? (
          <ins key={i} className="no-underline bg-emerald-500/20 text-emerald-300 rounded-sm">
            {part.text}
          </ins>
        ) : (
          <del key={i} className="bg-red-500/15 text-red-300/80 rounded-sm">
            {part.text}
          </del>
        )
      )}
    </p>
  );
}
