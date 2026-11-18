// Classifies a bullet's first word as a past-tense verb, a present-tense verb,
// or neither. Deliberately simple: a curated list of resume action verbs, a
// few irregular past forms, and any "-ed" word counted as past tense.

const BASE_VERBS = `
accelerate achieve acquire adapt add address administer advise advocate analyze apply arrange assemble
assess audit author automate balance build calculate campaign chair champion clarify coach code collaborate
collect compile complete compose compute conceive conduct configure consolidate construct consult contribute
convert coordinate create curate cut debug decrease define delegate deliver deploy design detect develop devise
diagnose direct discover document draft drive edit educate eliminate enable engineer enhance establish evaluate
examine execute expand expedite experiment facilitate fix forecast form formulate found generate grow guide
handle head hire identify implement improve increase influence initiate innovate inspect install instruct integrate
interview introduce invent investigate launch lead lower maintain manage map measure mentor migrate model moderate
monitor motivate negotiate obtain operate optimize orchestrate organize originate oversee perform pilot pioneer plan
prepare present prioritize process produce program promote propose prototype prove publish raise recruit redesign
reduce refactor refine reorganize repair research resolve restructure revamp review revise run save scale schedule
secure select serve set ship simplify solve spearhead standardize streamline strengthen structure supervise support
survey synthesize teach test train transform translate triage troubleshoot tutor unify update upgrade validate
verify visualize volunteer win write
`
  .split(/\s+/)
  .filter(Boolean);

const IRREGULAR_PAST: Record<string, string> = {
  built: "build",
  led: "lead",
  ran: "run",
  wrote: "write",
  won: "win",
  drove: "drive",
  grew: "grow",
  taught: "teach",
  oversaw: "oversee",
  made: "make",
  began: "begin",
  brought: "bring",
  chose: "choose",
  found: "find",
  gave: "give",
  held: "hold",
  kept: "keep",
  sold: "sell",
  spoke: "speak",
  took: "take",
  thought: "think",
  understood: "understand",
  undertook: "undertake",
  rebuilt: "rebuild",
  rewrote: "rewrite",
  // Same in past and present; treat as past so finished roles aren't flagged.
  cut: "cut",
  set: "set",
  put: "put",
  read: "read",
  shed: "shed",
};

const BASE = new Set(BASE_VERBS);

export type VerbTense = "past" | "present" | null;

/** First word of `text`, lowercased, with surrounding punctuation removed. */
export function firstWord(text: string): string {
  const match = text.trim().match(/^[^\s]+/);
  return (match?.[0] ?? "").toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, "");
}

export function verbTense(word: string): VerbTense {
  const w = word.toLowerCase();
  if (!w) return null;
  if (w in IRREGULAR_PAST) return "past";
  if (w.endsWith("ed")) {
    // Known verb or not, a word ending in -ed at the start of a bullet is almost always a past-tense verb.
    return "past";
  }
  if (BASE.has(w) || Object.values(IRREGULAR_PAST).includes(w)) return "present";
  if (w.endsWith("s") && (BASE.has(w.slice(0, -1)) || BASE.has(w.slice(0, -2)))) return "present"; // "builds", "manages", "teaches"
  if (w.endsWith("ies") && BASE.has(w.slice(0, -3) + "y")) return "present"; // "studies"
  return null;
}
