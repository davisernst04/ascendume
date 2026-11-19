import Image from "next/image";
import { Check } from "lucide-react";
import resumePreview from "@/public/resume-preview.png";
import { cn } from "@/lib/utils";

/** Where the numbers sit on resume-preview.png, as percentages of the image. */
const MARKS = [
  { left: 50.67, top: 26.85, width: 13.85 },
  { left: 53.77, top: 31.6, width: 10.61 },
  { left: 63.09, top: 39.2, width: 15.34 },
  { left: 75.19, top: 51.45, width: 14.11 },
  { left: 52.61, top: 75.1, width: 13.85 },
];
const MARK_HEIGHT = 1.9;

/** Section headings on resume-preview.png (top %, centred on the heading's rule). */
const SECTIONS = [11.4, 22, 65.9, 80.5];

/** What the closing report lists. These match checks the real review runs. */
const REPORT = ["Every bullet has a number", "Parses cleanly for ATS", "Fits on one page"];

// The timeline, in seconds. The scan line's bright edge moves linearly from the
// top of the page (0%) to past the bottom (BEAM_TRAVEL%), so anything at y%
// lights up at SCAN_AT + SCAN_FOR * y / BEAM_TRAVEL.
const LAND_AT = 0.2;
const SCAN_AT = 1.5;
const SCAN_FOR = 2.6;
const BEAM_TRAVEL = 128; // 100% of the page plus the trail's own height
const SCORE_AT = SCAN_AT + SCAN_FOR + 0.05;

/** The moment the score reaches 100; the page uses it to nudge the review button. */
export const SCORE_DONE_AT = SCORE_AT + 1.4;

const passes = (y: number) => SCAN_AT + (SCAN_FOR * y) / BEAM_TRAVEL;
const at = (s: number) => ({ animationDelay: `${s}s` });

/**
 * The sample resume, run through an "ATS scan" once on load: a scan line sweeps
 * down the page, section checks and the numbers light up as it passes, then a
 * score dial counts up to 100 and a short report slides out. Pure CSS animation,
 * so it plays from the server HTML and ends on its final frame.
 */
export function HeroResume({ className }: { className?: string }) {
  return (
    <div className={cn("animate-land relative", className)} style={at(LAND_AT)}>
      {/* Below lg the page is as wide as the column; when the window is too short
          for all of it, the sheet crops from the bottom and fades instead of shrinking. */}
      <div className="sheet relative overflow-hidden rounded-[2px] max-lg:max-h-full">
        <div className="relative">
          <Image
            src={resumePreview}
            alt="A sample one-page resume for John Doe, a software engineer, scored 100 by the review"
            priority
            sizes="(min-width: 1024px) 560px, 100vw"
            className="h-auto w-full rounded-[2px]"
          />

          {MARKS.map((m) => (
            <span
              key={m.top}
              aria-hidden
              className="absolute origin-left animate-swipe rounded-[2px] bg-marker/80 mix-blend-multiply"
              style={{
                left: `${m.left - 0.4}%`,
                top: `${m.top}%`,
                width: `${m.width + 0.8}%`,
                height: `${MARK_HEIGHT}%`,
                ...at(passes(m.top + MARK_HEIGHT)),
              }}
            />
          ))}

          {SECTIONS.map((top) => (
            <span
              key={top}
              aria-hidden
              className="ats-tick absolute grid aspect-square w-[3.4%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ok text-white"
              style={{ left: "96.6%", top: `${top}%`, ...at(passes(top)) }}
            >
              <Check className="size-[70%]" strokeWidth={3.5} />
            </span>
          ))}

          {/* The scan line with its tinted trail, clipped to the page. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2px]">
            <div
              className="ats-beam absolute inset-x-0 top-0"
              style={
                {
                  height: `${BEAM_TRAVEL - 100}%`,
                  // translateY is relative to the trail's height: end with its top at the page bottom.
                  "--beam-end": `${(100 / (BEAM_TRAVEL - 100)) * 100}%`,
                  animationDuration: `${SCAN_FOR}s`,
                  ...at(SCAN_AT),
                } as React.CSSProperties
              }
            />
          </div>
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[8%] bg-linear-to-t from-paper lg:hidden" />
      </div>

      {/* Viewfinder corners while the scan runs. */}
      <div
        aria-hidden
        className="ats-frame pointer-events-none absolute -inset-[3%]"
        style={{ animationDuration: `${SCAN_FOR + 0.6}s`, ...at(SCAN_AT - 0.3) }}
      >
        <span className="left-0 top-0 border-l-2 border-t-2" />
        <span className="right-0 top-0 border-r-2 border-t-2" />
        <span className="bottom-0 left-0 border-b-2 border-l-2" />
        <span className="bottom-0 right-0 border-b-2 border-r-2" />
      </div>

      {/* Score dial, stamped over the top-right corner. */}
      <div
        role="img"
        aria-label="ATS score: 100 out of 100"
        className="ats-stamp on-paper absolute -right-[3%] -top-[3%] grid aspect-square w-[22%] min-w-16 place-items-center rounded-full bg-paper text-ink lg:-right-[9%] lg:-top-[5%] lg:w-[24%]"
        style={at(SCORE_AT)}
      >
        <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
          <circle cx="50" cy="50" r="44" fill="none" stroke="var(--mist-deep)" strokeWidth="7" />
          <circle
            className="ats-ring"
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="var(--ok)"
            strokeWidth="7"
            strokeLinecap="round"
            pathLength={1}
            style={at(SCORE_AT + 0.15)}
          />
        </svg>
        <div aria-hidden className="relative flex flex-col items-center leading-none">
          <span className="text-[clamp(0.5rem,1.1vh,0.75rem)] font-bold tracking-[0.14em] text-ink-soft uppercase">ATS</span>
          <span className="ats-score font-display text-[clamp(1.25rem,4.2vh,2.6rem)] font-bold" style={at(SCORE_AT + 0.15)} />
        </div>
      </div>

      {/* Report card, tucked over the lower-left edge on desktop. */}
      <div
        aria-hidden
        className="ats-report absolute bottom-[7%] -left-[16%] hidden w-[62%] on-paper rounded-md border border-rule bg-raised p-[clamp(0.6rem,1.6vh,1rem)] text-ink shadow-[0_18px_40px_-18px_rgb(0_0_0/0.65)] lg:block"
        style={at(SCORE_AT + 0.5)}
      >
        <p className="mb-2 flex items-center justify-between text-[clamp(0.7rem,1.5vh,0.875rem)] font-bold tracking-[0.08em] text-ok uppercase">
          Scan complete
          <span className="rounded-full bg-ok-wash px-2 py-0.5 tracking-normal normal-case">Perfect</span>
        </p>
        <ul className="space-y-1.5">
          {REPORT.map((line, i) => (
            <li
              key={line}
              className="ats-report-row flex items-center gap-2 text-[clamp(0.8rem,1.75vh,1rem)]"
              style={at(SCORE_AT + 0.75 + i * 0.18)}
            >
              <span className="grid size-[1.15em] shrink-0 place-items-center rounded-full bg-ok text-white">
                <Check className="size-[0.75em]" strokeWidth={3.5} />
              </span>
              {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
