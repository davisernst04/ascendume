// components/ResumeBuilder.tsx
"use client";

import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { AlertCircle, ArrowLeft, Check, ChevronDown, Download, Loader2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResumeProvider, useResume, type ResumeData } from "@/lib/resume-context";
import { useResumePersistence, type SaveState } from "@/lib/use-resume-persistence";
import { useSession } from "@/lib/auth-client";
import { buildLatex } from "@/lib/resume-latex";
import { useReview } from "@/lib/review/use-review";
import { ReviewPanel } from "@/components/review/review-panel";
import type { CompileResult } from "@/components/latex-pdf-preview";
import { cn } from "@/lib/utils";
import { GuidedStart } from "@/components/ai/guided-start";
import { track } from "@/lib/analytics/track";
import { SECTIONS, SectionEditor, type SectionType } from "@/components/builder/section-editors";
import { HEADER_SLOT_ID } from "@/components/app-header";

const LatexPdfPreview = dynamic(() => import("./latex-pdf-preview").then((m) => m.LatexPdfPreview), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center gap-2 text-sm text-ink-soft">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      Loading the page viewer…
    </div>
  ),
});

/** Phones show one of these at a time; wider screens show the editor beside the desk. */
type View = "edit" | "page" | "review";
type DeskTab = "page" | "review";

function ResumeBuilderContent({ resumeId }: { resumeId?: string }) {
  const { resumeData, updateTitle } = useResume();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const [active, setActive] = useState<SectionType>(
    SECTIONS.find((s) => s.type === tabParam)?.type ??
      // "Build one with AI" lands where the guided interview starts.
      (searchParams.get("guided") === "1" ? "experience" : SECTIONS[0].type)
  );
  const [view, setView] = useState<View>("edit");
  const [deskTab, setDeskTab] = useState<DeskTab>("page");

  // Holds the latest generated PDF blob for download
  const pdfBlobRef = useRef<Blob | null>(null);
  const [hasPdf, setHasPdf] = useState(false);

  const { isLoaded, saveState } = useResumePersistence(resumeId);
  const { data: session } = useSession();
  const signedIn = Boolean(session?.user);

  // The entry the guided start just added, whose interview opens straight away.
  const [guidedEntryId, setGuidedEntryId] = useState<string | null>(null);
  const [compiled, setCompiled] = useState<CompileResult | null>(null);
  const review = useReview({ data: resumeData, loaded: isLoaded, compiled, signedIn });

  const showDesk = useCallback((tab: DeskTab) => {
    setDeskTab(tab);
    setView(tab);
  }, []);

  // Notes for the resume as it stands are shown again; a new review runs only after edits.
  const startReview = useCallback(() => {
    showDesk("review");
    if (!review.result || review.outdated) review.request();
  }, [review, showDesk]);

  const goToSection = useCallback(
    (type: SectionType) => {
      setActive(type);
      setView("edit");
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", type);
      params.delete("review");
      replaceQuery(params);
    },
    [searchParams]
  );

  // resume_started (build): the first edit to a new resume after it has loaded.
  const startRef = useRef<{ loadedData: ResumeData | null; tracked: boolean }>({ loadedData: null, tracked: false });
  useEffect(() => {
    const start = startRef.current;
    if (resumeId !== "new" || !isLoaded || start.tracked) return;
    if (start.loadedData === null) {
      start.loadedData = resumeData;
    } else if (start.loadedData !== resumeData) {
      start.tracked = true;
      track("resume_started", { route: "build" });
    }
  }, [resumeId, isLoaded, resumeData]);

  // Arriving from the review route (/<id>?review=1): the user asked for a review, so run one once loaded.
  const autoReviewedRef = useRef(false);
  useEffect(() => {
    if (!isLoaded || autoReviewedRef.current || searchParams.get("review") !== "1") return;
    autoReviewedRef.current = true;
    startReview();
    const params = new URLSearchParams(searchParams.toString());
    params.delete("review");
    replaceQuery(params);
  }, [isLoaded, searchParams, startReview]);

  // A title left at the default makes every download "My-Resume.pdf"; use the person's name instead.
  const fileBase = toFileName(
    resumeData.title.trim() === "My Resume" && resumeData.personalInfo.fullName.trim()
      ? `${resumeData.personalInfo.fullName} Resume`
      : resumeData.title
  );

  const handleDownload = useCallback(() => {
    if (!pdfBlobRef.current) return;
    downloadBlob(pdfBlobRef.current, `${fileBase}.pdf`);
    track("exported", { format: "pdf" });
  }, [fileBase]);

  const handleDownloadTex = useCallback(() => {
    const tex = buildLatex(resumeData);
    downloadBlob(new Blob([tex], { type: "application/x-tex" }), `${fileBase}.tex`);
    track("exported", { format: "tex" });
  }, [resumeData, fileBase]);

  const reviewBusy = review.status === "running" || review.status === "waiting-for-preview";
  const findingCount = review.result?.findingCount ?? 0;
  const section = SECTIONS.find((s) => s.type === active) ?? SECTIONS[0];

  // The desk measures itself so the whole page fits in it without scrolling.
  // Room is kept for the pager and the page-count warning only when the resume runs past one page.
  const deskRef = useRef<HTMLDivElement>(null);
  const desk = useElementSize(deskRef);
  const pages = compiled?.pages ?? null;
  const deskChrome = DESK_PADDING + (pages && pages > 1 ? PAGER_HEIGHT + WARNING_HEIGHT : 0);
  const pageWidth = Math.floor(
    Math.max(240, Math.min(900, desk.width - DESK_PADDING, (desk.height - deskChrome) / PAGE_RATIO))
  );

  // On wider screens the title and actions live in the app header, freeing a row for the form and page.
  const headerSlot = useSyncExternalStore(
    noopSubscribe,
    () => document.getElementById(HEADER_SLOT_ID),
    () => null
  );

  const toolbar = (
    <>
      <label className="group flex min-w-0 max-w-xs flex-1 items-center gap-2">
        <span className="sr-only">Resume title</span>
        <input
          type="text"
          value={resumeData.title}
          onChange={(e) => updateTitle(e.target.value)}
          className="font-display min-w-0 flex-1 truncate rounded-sm border-b border-transparent bg-transparent py-1 text-[1.125rem] font-bold text-ink outline-none transition-colors hover:border-rule-strong focus-visible:border-brand focus-visible:outline-none"
          placeholder="Untitled resume"
        />
        <PenLine className="size-3.5 shrink-0 text-ink-soft opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
      </label>
      <SaveStatus state={saveState} signedIn={signedIn} loaded={isLoaded} />

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Button variant="marker" size="sm" onClick={startReview} disabled={reviewBusy}>
          {reviewBusy && <Loader2 className="animate-spin" aria-hidden />}
          Review
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" aria-label="Download">
              <Download aria-hidden />
              <span className="hidden sm:inline">Download</span>
              <ChevronDown className="text-ink-soft" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuItem onSelect={handleDownload} disabled={!hasPdf} className="flex-col items-start gap-0.5">
              <span className="font-semibold">PDF</span>
              <span className="text-xs text-ink-soft">
                {hasPdf ? "What you see on the page. Send this one." : "Available once the page is typeset."}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleDownloadTex} className="flex-col items-start gap-0.5">
              <span className="font-semibold">LaTeX source (.tex)</span>
              <span className="text-xs text-ink-soft">To keep editing in Overleaf or any TeX editor.</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  const showGuidedStart = isLoaded && (active === "experience" || active === "projects");

  return (
    <div className="flex h-full flex-col bg-surface text-ink">
      {headerSlot && createPortal(toolbar, headerSlot)}
      {/* Phones (and before the header slot is found): the toolbar as its own row */}
      <div className={cn("flex h-12 shrink-0 items-center gap-3 border-b border-rule px-4", headerSlot && "md:hidden")}>
        {toolbar}
      </div>

      {/* Phone view switch */}
      <div className="flex shrink-0 border-b border-rule px-4 lg:hidden" role="tablist" aria-label="Builder view">
        {(
          [
            ["edit", "Edit"],
            ["page", "Page"],
            ["review", "Review"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            onClick={() => (v === "edit" ? setView("edit") : showDesk(v))}
            className={cn(
              "-mb-px border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors",
              view === v ? "border-ink text-ink" : "border-transparent text-ink-soft hover:text-ink"
            )}
          >
            {label}
            {v === "review" && findingCount > 0 && <CountBadge n={findingCount} muted={review.outdated} />}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Section list (wide screens) */}
        <nav aria-label="Resume sections" className="hidden w-48 shrink-0 overflow-y-auto border-r border-rule py-5 pl-4 pr-3 xl:block">
          <ul className="flex flex-col gap-0.5">
            {SECTIONS.map((s) => (
              <li key={s.type}>
                <button
                  type="button"
                  onClick={() => goToSection(s.type)}
                  aria-current={active === s.type ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[0.9375rem] font-medium transition-colors",
                    active === s.type ? "bg-mist text-ink" : "text-ink-soft hover:bg-mist/50 hover:text-ink"
                  )}
                >
                  {s.title}
                  <EntryCount type={s.type} data={resumeData} />
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Editor */}
        <div className={cn("min-w-0 flex-1 overflow-y-auto", view !== "edit" && "hidden lg:block")}>
          {/* Section tabs (narrower screens) */}
          <div className="sticky top-0 z-10 overflow-x-auto border-b border-rule bg-surface/95 backdrop-blur xl:hidden">
            <div className="flex w-max gap-1 px-4 py-1.5 sm:px-6" role="tablist" aria-label="Resume sections">
              {SECTIONS.map((s) => (
                <button
                  key={s.type}
                  type="button"
                  role="tab"
                  aria-selected={active === s.type}
                  onClick={() => goToSection(s.type)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[0.9375rem] font-medium transition-colors",
                    active === s.type ? "bg-mist text-ink" : "text-ink-soft hover:text-ink"
                  )}
                >
                  {s.title}
                  <EntryCount type={s.type} data={resumeData} />
                </button>
              ))}
            </div>
          </div>

          <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-5 sm:px-6">
            <header>
              <h1 className="text-[1.625rem] font-bold leading-tight text-ink">{section.title}</h1>
              <p className="max-w-prose text-[0.9375rem] text-ink-soft">{section.hint}</p>
            </header>
            {showGuidedStart && (
              <GuidedStart
                forceOpen={searchParams.get("guided") === "1"}
                onStart={(s, entryId) => {
                  setGuidedEntryId(entryId);
                  goToSection(s);
                }}
              />
            )}
            {isLoaded ? (
              <SectionEditor key={active} type={active} openInterviewFor={guidedEntryId} />
            ) : (
              <div className="flex items-center gap-2 py-8 text-sm text-ink-soft">
                <Loader2 className="size-4 animate-spin" aria-hidden /> Opening your resume…
              </div>
            )}
          </div>
        </div>

        {/* The desk: the page, or the review notes beside it */}
        <div
          className={cn(
            "flex min-w-0 flex-col bg-mist lg:w-[clamp(380px,42vw,780px)] lg:shrink-0 lg:border-l lg:border-rule",
            view === "edit" ? "hidden lg:flex" : "flex flex-1 lg:flex-none"
          )}
        >
          <div ref={deskRef} className="relative min-h-0 flex-1">
            {/* The preview stays mounted while the review is shown: the review needs its page count. */}
            <div className={cn("flex h-full flex-col items-center justify-center gap-2 p-3", deskTab !== "page" && "hidden")}>
              <PageWarning pages={pages} />
              <LatexPdfPreview
                data={resumeData}
                onPdfReady={(blob) => {
                  pdfBlobRef.current = blob;
                  setHasPdf(true);
                }}
                onCompiled={setCompiled}
                width={pageWidth}
              />
            </div>
            {deskTab === "review" && (
              <div className="absolute inset-0 overflow-y-auto">
                <div className="mx-auto max-w-xl px-4 py-6 sm:px-6">
                  {/* Phones switch views with the tabs above; wide screens get a way back here. */}
                  <Button variant="ghost" size="sm" onClick={() => showDesk("page")} className="-ml-3 mb-3 hidden lg:inline-flex">
                    <ArrowLeft aria-hidden />
                    Back to page
                  </Button>
                  <ReviewPanel
                    status={review.status}
                    result={review.result}
                    error={review.error}
                    outdated={review.outdated}
                    signedIn={signedIn}
                    onRun={review.request}
                    onGoTo={goToSection}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Letter paper, the desk's padding (both sides), and the pager and warning rows of a multi-page resume. */
const PAGE_RATIO = 11 / 8.5;
const DESK_PADDING = 24;
const PAGER_HEIGHT = 44;
const WARNING_HEIGHT = 28;

const noopSubscribe = () => () => {};

function CountBadge({ n, muted }: { n: number; muted: boolean }) {
  return (
    <span
      className={cn(
        "ml-1.5 inline-grid min-w-5 place-items-center rounded-full px-1.5 text-xs font-bold tabular-nums",
        muted ? "bg-mist-deep text-ink-soft" : "bg-brand text-white dark:text-surface"
      )}
    >
      {n}
    </span>
  );
}

/** Flags a resume that runs past one page. */
function PageWarning({ pages }: { pages: number | null }) {
  if (!pages || pages === 1) return null;
  return (
    <p className="text-sm font-semibold text-danger">
      Runs to {pages} pages. Aim for one.
    </p>
  );
}

function EntryCount({ type, data }: { type: SectionType; data: ResumeData }) {
  const n =
    type === "experience"
      ? data.experience.length
      : type === "education"
        ? data.education.length
        : type === "projects"
          ? data.projects.length
          : type === "skills"
            ? data.skills.length
            : type === "certifications"
              ? data.certifications.length
              : 0;
  if (!n) return null;
  return (
    <span className="text-xs font-medium tabular-nums text-ink-soft" aria-label={`${n} ${n === 1 ? "entry" : "entries"}`}>
      {n}
    </span>
  );
}

function SaveStatus({ state, signedIn, loaded }: { state: SaveState; signedIn: boolean; loaded: boolean }) {
  if (!loaded) return null;
  const content =
    state === "error" ? (
      <span className="flex items-center gap-1 text-danger">
        <AlertCircle className="size-3.5" aria-hidden /> Not saved. We&apos;ll retry when you next edit.
      </span>
    ) : state === "saving" ? (
      <span>Saving…</span>
    ) : (
      <span className="flex items-center gap-1">
        <Check className="size-3.5" aria-hidden /> {signedIn ? "Saved" : "Saved in this browser"}
      </span>
    );
  return (
    <p role="status" className="hidden min-w-0 truncate text-xs text-ink-soft md:block">
      {content}
    </p>
  );
}

/** Tracks an element's size, keeping the last non-zero size while it is hidden. */
function useElementSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 600, height: 800 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const { clientWidth: width, clientHeight: height } = el;
      if (width > 0 && height > 0) setSize((s) => (s.width === width && s.height === height ? s : { width, height }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

/**
 * Updates the query string without a navigation. Next 16 keeps useSearchParams
 * in sync with history.replaceState, and skipping router.replace avoids a
 * server round trip (and a route transition) on every tab switch.
 */
function replaceQuery(params: URLSearchParams) {
  const query = params.toString();
  window.history.replaceState(window.history.state, "", query ? `?${query}` : window.location.pathname);
}

/** "Jane's Resume (v2)" -> "Janes-Resume-v2"; never empty. */
function toFileName(title: string): string {
  const base = title.trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
  return base || "resume";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ResumeBuilder({ resumeId }: { resumeId?: string }) {
  return (
    <ResumeProvider>
      <Suspense>
        <ResumeBuilderContent resumeId={resumeId} />
      </Suspense>
    </ResumeProvider>
  );
}
