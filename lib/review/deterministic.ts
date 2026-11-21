// Rubric checks that need no AI. They run in the browser for everyone,
// guests included, and only when the user asks for a review.
import type { ResumeData } from "@/lib/resume-context";
import { type Bullet, extractBullets, type ResumeSection } from "@/lib/review/bullets";
import { type Finding, MIN_BULLETS_FOR_SCORE as MIN_BULLETS } from "@/lib/review/findings";
import type { CriterionId } from "@/lib/review/rubric";
import { firstWord, verbTense } from "@/lib/review/verbs";
import { sanitizeUrl } from "@/lib/resume-latex";
import { normalizeSectionOrder } from "@/lib/section-order";

export interface DeterministicInput {
  data: ResumeData;
  /** Pages in the compiled PDF, or null if it isn't known (still compiling, or the compile failed). */
  pageCount: number | null;
}

export interface DeterministicResult {
  findings: Finding[];
  checked: Set<CriterionId>;
  bullets: Bullet[];
  entryCount: number;
}

const MEASURABLE =
  /\d|\b(dozens?|hundreds?|thousands?|millions?|billions?|doubled?|tripled?|halved|percent)\b/i;

const WEAK_PHRASES: RegExp[] = [
  /\bresponsible for\b/i,
  /\bhelped( to| with)?\b/i,
  /\bassisted (with|in)\b/i,
  /\bworked on\b/i,
  /\bparticipated in\b/i,
  /\binvolved in\b/i,
  /\bduties included\b/i,
  /\btasked with\b/i,
  /\bin charge of\b/i,
  /\bvarious\b/i,
  /\betc\b\.?/i,
];


/** Jake's template fits roughly 110 characters per bullet line. */
const MAX_BULLET_CHARS = 220;
const MIN_BULLET_CHARS = 25;

// Characters pdfTeX can typeset from this template: printable ASCII, Latin-1,
// and the common typographic punctuation (dashes, curly quotes, bullet, ellipsis).
const UNRENDERABLE_CHAR = /[^\x20-\x7E\u00A0-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026\n\r\t]/u;

// A link is fine if the PDF can make it clickable (see sanitizeUrl).

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function quote(s: string, max = 40): string {
  return s.length > max ? `"${s.slice(0, max - 1)}…"` : `"${s}"`;
}

// ---- Dates ---------------------------------------------------------------

const SHORT_MONTH = /^(jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\.? \d{4}$/i;
const FULL_MONTH = /^(january|february|march|april|june|july|august|september|october|november|december) \d{4}$/i;
const MAY = /^may \d{4}$/i; // "May" is both the short and the full name

type DateFormat = "Jan 2025" | "January 2025" | "01/2025" | "01/25" | "2025-01" | "2025";

/** The format a date string is written in, or null for formats that mix with anything (seasons, "Present", blanks). */
export function dateFormat(raw: string): DateFormat | null {
  const s = raw.trim().replace(/^expected\s+/i, "");
  if (!s || /^(present|current|now|ongoing)$/i.test(s)) return null;
  if (/^(spring|summer|fall|autumn|winter) \d{4}$/i.test(s)) return null;
  if (MAY.test(s)) return null;
  if (SHORT_MONTH.test(s)) return "Jan 2025";
  if (FULL_MONTH.test(s)) return "January 2025";
  if (/^\d{1,2}\/\d{4}$/.test(s)) return "01/2025";
  if (/^\d{1,2}\/\d{2}$/.test(s)) return "01/25";
  if (/^\d{4}-\d{2}$/.test(s)) return "2025-01";
  if (/^\d{4}$/.test(s)) return "2025";
  return null;
}

function allDates(data: ResumeData): string[] {
  return [
    ...data.experience.flatMap((e) => [e.startDate, e.endDate]),
    ...data.education.map((e) => e.graduationDate),
    ...data.certifications.map((c) => c.date),
  ];
}

// ---- Text fields (for character and link checks) ---------------------------

interface TextField {
  section: ResumeSection;
  label: string;
  value: string;
}

function textFields(data: ResumeData): TextField[] {
  const p = data.personalInfo;
  return [
    { section: "personal", label: "Name", value: p.fullName },
    { section: "personal", label: "Email", value: p.email },
    { section: "personal", label: "Phone", value: p.phone },
    { section: "personal", label: "Location", value: p.location },
    { section: "personal", label: "Summary", value: p.summary },
    ...data.experience.flatMap((e) => [
      { section: "experience" as const, label: `Company (${e.company || "untitled"})`, value: e.company },
      { section: "experience" as const, label: `Position (${e.company || "untitled"})`, value: e.position },
      { section: "experience" as const, label: `Location (${e.company || "untitled"})`, value: e.location },
    ]),
    ...data.education.flatMap((e) => [
      { section: "education" as const, label: `School (${e.institution || "untitled"})`, value: e.institution },
      { section: "education" as const, label: `Degree (${e.institution || "untitled"})`, value: `${e.degree} ${e.field}` },
    ]),
    ...data.skills.map((c) => ({ section: "skills" as const, label: `Skills (${c.label || "unlabeled"})`, value: `${c.label} ${c.items}` })),
    ...data.projects.flatMap((pr) => [
      { section: "projects" as const, label: `Project name (${pr.name || "untitled"})`, value: pr.name },
      { section: "projects" as const, label: `Technologies (${pr.name || "untitled"})`, value: pr.technologies },
    ]),
    ...data.certifications.flatMap((c) => [
      { section: "certifications" as const, label: `Certification (${c.name || "untitled"})`, value: `${c.name} ${c.issuer}` },
    ]),
  ];
}

function linkFields(data: ResumeData): TextField[] {
  const p = data.personalInfo;
  return [
    { section: "personal" as const, label: "Website", value: p.website },
    { section: "personal" as const, label: "LinkedIn", value: p.linkedin },
    { section: "personal" as const, label: "GitHub", value: p.github },
    ...data.projects.map((pr) => ({ section: "projects" as const, label: `Project link (${pr.name || "untitled"})`, value: pr.url })),
    ...data.certifications.map((c) => ({ section: "certifications" as const, label: `Credential link (${c.name || "untitled"})`, value: c.credentialUrl })),
  ];
}

// ---- Checks ---------------------------------------------------------------

export function runDeterministicChecks({ data, pageCount }: DeterministicInput): DeterministicResult {
  const findings: Finding[] = [];
  const checked = new Set<CriterionId>([
    "impact.measurable",
    "language.action-verb",
    "language.weak-phrasing",
    "clarity.length",
    "consistency.dates",
    "consistency.tense",
    "consistency.punctuation",
    "completeness.contact",
    "completeness.entry-dates",
    "completeness.entry-bullets",
    "completeness.substance",
    "ats.characters",
    "ats.links",
  ]);
  const bullets = extractBullets(data);
  const add = (criterionId: CriterionId, target: Finding["target"], detail: string, extra?: Pick<Finding, "reorder">) =>
    findings.push({ criterionId, target, detail, ...extra });

  // Bullet-level checks
  for (const b of bullets) {
    const target = { kind: "bullet" as const, bulletId: b.id };
    const word = firstWord(b.text);
    const tense = verbTense(word);

    if (!MEASURABLE.test(b.text)) add("impact.measurable", target, "No number, percentage or scale.");

    if (tense === null || word.endsWith("ing")) {
      add("language.action-verb", target, word ? `Starts with ${quote(b.text.trim().split(/\s+/)[0])}.` : "Starts without a word.");
    }

    const weak = WEAK_PHRASES.map((re) => b.text.match(re)?.[0]).find(Boolean);
    if (weak) add("language.weak-phrasing", target, `Uses ${quote(weak)}.`);

    if (b.text.length > MAX_BULLET_CHARS) {
      add("clarity.length", target, `${b.text.length} characters: likely more than two lines.`);
    } else if (b.text.length < MIN_BULLET_CHARS) {
      add("clarity.length", target, "Too short to say what you did and what came of it.");
    }

    if (b.pastRole && tense === "present") {
      add("consistency.tense", target, `${quote(b.text.trim().split(/\s+/)[0])} is present tense, but this role has ended.`);
    }
  }

  // Length
  if (pageCount !== null) {
    checked.add("length.one-page");
    if (pageCount > 1) add("length.one-page", { kind: "resume" }, `The PDF is ${pageCount} pages.`);
  }

  // Date formats
  const formats = new Map<DateFormat, string>();
  for (const d of allDates(data)) {
    const f = dateFormat(d);
    if (f && !formats.has(f)) formats.set(f, d.trim());
  }
  if (formats.size > 1) {
    add("consistency.dates", { kind: "resume" }, `Mixes ${[...formats.values()].map((d) => quote(d)).join(", ")}.`);
  }

  // Punctuation
  const withPeriod = bullets.filter((b) => b.text.trim().endsWith(".")).length;
  const withoutPeriod = bullets.length - withPeriod;
  if (withPeriod > 0 && withoutPeriod > 0) {
    add(
      "consistency.punctuation",
      { kind: "resume" },
      `${withPeriod} bullet${withPeriod === 1 ? "" : "s"} end with a period and ${withoutPeriod} don't.`
    );
  }

  // Contact
  const p = data.personalInfo;
  if (!p.fullName.trim()) add("completeness.contact", { kind: "field", section: "personal", label: "Name" }, "Your name is missing.");
  if (!p.email.trim()) {
    add("completeness.contact", { kind: "field", section: "personal", label: "Email" }, "Your email is missing.");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim())) {
    add("completeness.contact", { kind: "field", section: "personal", label: "Email" }, `${quote(p.email)} doesn't look like an email address.`);
  }

  // Entry dates
  for (const e of data.experience) {
    const label = [e.position, e.company].filter(Boolean).join(", ") || "Untitled role";
    const missing = [!e.startDate.trim() && "start date", !e.current && !e.endDate.trim() && "end date"].filter(Boolean);
    if (missing.length) {
      add("completeness.entry-dates", { kind: "entry", section: "experience", entryId: e.id, label }, `Missing ${missing.join(" and ")}.`);
    }
  }
  for (const e of data.education) {
    if (!e.graduationDate.trim()) {
      add(
        "completeness.entry-dates",
        { kind: "entry", section: "education", entryId: e.id, label: e.institution || "Untitled school" },
        "Missing graduation date (use \"Expected May 2027\" if you haven't graduated)."
      );
    }
  }

  // Bullets per entry, and enough bullets overall
  const entriesWithBullets = new Set(bullets.map((b) => b.entryId));
  for (const e of data.experience) {
    if (!entriesWithBullets.has(e.id)) {
      const label = [e.position, e.company].filter(Boolean).join(", ") || "Untitled role";
      add("completeness.entry-bullets", { kind: "entry", section: "experience", entryId: e.id, label }, "No bullet points yet.");
    }
  }
  for (const p of data.projects) {
    if (!entriesWithBullets.has(p.id)) {
      add("completeness.entry-bullets", { kind: "entry", section: "projects", entryId: p.id, label: p.name || "Untitled project" }, "No bullet points yet.");
    }
  }
  if (bullets.length < MIN_BULLETS) {
    add(
      "completeness.substance",
      { kind: "resume" },
      bullets.length === 0 ? "There are no bullet points yet." : `Only ${bullets.length} bullet point${bullets.length === 1 ? "" : "s"} so far.`
    );
  }

  // Characters the template can't render
  for (const b of bullets) {
    const bad = b.text.match(UNRENDERABLE_CHAR)?.[0];
    if (bad) add("ats.characters", { kind: "bullet", bulletId: b.id }, `Contains ${quote(bad)}.`);
  }
  for (const f of textFields(data)) {
    const bad = f.value.match(UNRENDERABLE_CHAR)?.[0];
    if (bad) {
      add("ats.characters", { kind: "field", section: f.section, label: f.label }, `Contains ${quote(bad)}.`);
    }
  }

  // Links
  for (const f of linkFields(data)) {
    const v = f.value.trim();
    if (v && !sanitizeUrl(v)) {
      add("ats.links", { kind: "field", section: f.section, label: f.label }, `${quote(v)} isn't a web address, so it won't be a working link.`);
    }
  }

  // Section order: lead with whichever of Experience and Projects says more.
  // Only checked (and scored) when both sections are on the page.
  if (data.experience.length > 0 && data.projects.length > 0) {
    checked.add("relevance.section-order");
    const order = normalizeSectionOrder(data.sectionOrder);
    const projectsFirst = order.indexOf("projects") < order.indexOf("experience");
    const jobBullets = bullets.filter((b) => b.section === "experience").length;
    const projectBullets = bullets.length - jobBullets;
    const counts = `Your projects have ${plural(projectBullets, "bullet")} and your experience has ${jobBullets}.`;
    // Projects first only with little work history (one role at most), so a long career isn't pushed down.
    if (!projectsFirst && data.experience.length <= 1 && projectBullets > jobBullets) {
      add("relevance.section-order", { kind: "resume" }, `${counts} Move Projects above Experience.`, {
        reorder: { section: "projects", above: "experience" },
      });
    } else if (projectsFirst && jobBullets > projectBullets) {
      add("relevance.section-order", { kind: "resume" }, `${counts} Move Experience back above Projects.`, {
        reorder: { section: "experience", above: "projects" },
      });
    }
  }

  return {
    findings,
    checked,
    bullets,
    entryCount: data.experience.length + data.education.length,
  };
}
