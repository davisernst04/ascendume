/** One `Label: items` row in the Skills section of Jake's template. */
export interface SkillCategory {
  id: string;
  label: string;
  items: string;
}

/** CS-style starting labels. Users rename or remove them (e.g. "CAD / Lab / Software"). */
const DEFAULT_LABELS = ["Languages", "Frameworks", "Developer Tools"];

export function newSkillCategory(partial?: Partial<SkillCategory>): SkillCategory {
  return {
    id: partial?.id || crypto.randomUUID(),
    label: partial?.label ?? "",
    items: partial?.items ?? "",
  };
}

export function defaultSkillCategories(): SkillCategory[] {
  return DEFAULT_LABELS.map((label) => newSkillCategory({ label }));
}

/**
 * Accepts skills in either the current shape (an array of categories) or the
 * legacy `{ technical, frameworks, tools }` object that older browser drafts
 * still hold, and returns categories.
 */
export function normalizeSkillCategories(raw: unknown): SkillCategory[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((c): c is Record<string, unknown> => typeof c === "object" && c !== null)
      .map((c) =>
        newSkillCategory({
          id: typeof c.id === "string" ? c.id : undefined,
          label: typeof c.label === "string" ? c.label : "",
          items: typeof c.items === "string" ? c.items : "",
        })
      );
  }

  if (typeof raw === "object" && raw !== null) {
    const legacy = raw as Record<string, unknown>;
    const pairs: [string, unknown][] = [
      ["Languages", legacy.technical],
      ["Frameworks", legacy.frameworks],
      ["Developer Tools", legacy.tools],
    ];
    return pairs
      .filter(([, items]) => typeof items === "string" && items.trim() !== "")
      .map(([label, items]) => newSkillCategory({ label, items: items as string }));
  }

  return defaultSkillCategories();
}
