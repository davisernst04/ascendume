import { cn } from "@/lib/utils";

const CHAR_GAP = 0.035; // seconds between letters
const LINE_GAP = 0.18; // extra pause before the second line
const START = 0.15;

/** When the last letter has landed, so the underline and buttons can follow it. */
export const HEADLINE_DONE_AT = START + ("Get hired".length + "yesterday.".length) * CHAR_GAP + LINE_GAP + 0.55;

/** One line of letters, each rising out of a clipped band. */
function Line({ text, startAt, className }: { text: string; startAt: number; className?: string }) {
  return (
    <span className={cn("hero-line", className)}>
      {Array.from(text).map((ch, i) => (
        <span key={i} className="hero-char" style={{ animationDelay: `${startAt + i * CHAR_GAP}s` }}>
          {ch === " " ? " " : ch}
        </span>
      ))}
    </span>
  );
}

/**
 * "Get hired / yesterday." set very large: letters rise in one by one, then an
 * ochre stroke is drawn under "yesterday." Pure CSS, so it plays from server HTML.
 */
export function HeroHeadline({ className }: { className?: string }) {
  const secondLineAt = START + "Get hired".length * CHAR_GAP + LINE_GAP;
  return (
    <h1 className={cn("font-bold", className)} aria-label="Get hired yesterday.">
      <span aria-hidden className="block">
        <Line text="Get hired" startAt={START} />
        <span className="relative inline-block">
          <Line text="yesterday." startAt={secondLineAt} className="italic" />
          <svg
            className="hero-swoosh pointer-events-none absolute -bottom-[0.06em] left-[-2%] h-[0.22em] w-[100%] overflow-visible text-marker"
            viewBox="0 0 300 20"
            preserveAspectRatio="none"
            style={{ "--at": `${HEADLINE_DONE_AT - 0.15}s` } as React.CSSProperties}
          >
            <path
              d="M4 14 C 60 6, 130 4, 196 8 S 280 13, 296 6"
              pathLength={1}
              fill="none"
              stroke="currentColor"
              strokeWidth={7}
              strokeLinecap="round"
            />
          </svg>
        </span>
      </span>
    </h1>
  );
}
