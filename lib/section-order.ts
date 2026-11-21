// The order of the body sections on the page. Contact (and the summary) always
// come first; everything below them can be rearranged per resume.

export const BODY_SECTIONS = ["education", "experience", "projects", "skills", "certifications"] as const;

export type BodySection = (typeof BODY_SECTIONS)[number];

export const DEFAULT_SECTION_ORDER: readonly BodySection[] = BODY_SECTIONS;

export function isBodySection(value: unknown): value is BodySection {
  return typeof value === "string" && (BODY_SECTIONS as readonly string[]).includes(value);
}

/**
 * Any stored or submitted order made safe: unknown names and repeats are
 * dropped, and missing sections are added at the end in default order. Old
 * resumes and drafts (no order at all) get the default.
 */
export function normalizeSectionOrder(raw: unknown): BodySection[] {
  const known = Array.isArray(raw) ? raw.filter(isBodySection) : [];
  return [...new Set([...known, ...DEFAULT_SECTION_ORDER])];
}

/** The order with one section moved one place up (-1) or down (+1). */
export function moveSection(order: readonly BodySection[], section: BodySection, step: -1 | 1): BodySection[] {
  const from = order.indexOf(section);
  const to = from + step;
  if (from === -1 || to < 0 || to >= order.length) return [...order];
  const next = [...order];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

/** The order with `section` placed directly above `target`. */
export function placeAbove(order: readonly BodySection[], section: BodySection, target: BodySection): BodySection[] {
  const next = order.filter((s) => s !== section);
  next.splice(next.indexOf(target), 0, section);
  return next;
}
