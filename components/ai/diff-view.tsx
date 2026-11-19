import { diffWords } from "@/lib/text-diff";

/**
 * A rewrite shown against the original: removed words struck through in red,
 * added words highlighted the way a skimming reader would mark them.
 */
export function DiffView({ before, after }: { before: string; after: string }) {
  return (
    <p className="rounded-sm bg-paper px-3 py-2 font-serif text-[0.9375rem] leading-relaxed text-[#2b2620] shadow-[0_0_0_1px_var(--rule)]">
      {diffWords(before, after).map((part, i) =>
        part.type === "same" ? (
          <span key={i}>{part.text}</span>
        ) : part.type === "added" ? (
          <ins key={i} className="highlight no-underline">
            {part.text}
          </ins>
        ) : (
          <del key={i} className="text-[#6b6257] decoration-[#8e2f2a] decoration-2">
            {part.text}
          </del>
        )
      )}
    </p>
  );
}
