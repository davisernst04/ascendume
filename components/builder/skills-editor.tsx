"use client";

import { useResume } from "@/lib/resume-context";
import { AddButton, ConfirmRemove } from "@/components/builder/fields";
import { Input } from "@/components/ui/input";

export function SkillsEditor({ disabled }: { disabled: boolean }) {
  const { resumeData, addSkillCategory, updateSkillCategory, removeSkillCategory } = useResume();
  const { skills } = resumeData;

  return (
    <div className="flex flex-col gap-4">
      {skills.length > 0 && (
        <div className="rounded-lg border border-rule bg-raised">
          <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] gap-3 border-b border-rule px-4 py-2 text-sm font-semibold text-ink sm:grid">
            <span id="skills-label-col">Label</span>
            <span id="skills-items-col">Skills, separated by commas</span>
            <span aria-hidden className="w-8" />
          </div>
          <ul className="divide-y divide-rule">
            {skills.map((category) => (
              <li
                key={category.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]"
              >
                <Input
                  aria-label="Label"
                  aria-describedby="skills-label-col"
                  placeholder="Languages"
                  value={category.label}
                  onChange={(e) => updateSkillCategory(category.id, { label: e.target.value })}
                  disabled={disabled}
                  className="font-semibold"
                />
                <div className="order-last col-span-2 sm:order-none sm:col-span-1">
                  <Input
                    aria-label={`Skills for ${category.label || "this row"}`}
                    placeholder="Python, Java, SQL"
                    value={category.items}
                    onChange={(e) => updateSkillCategory(category.id, { items: e.target.value })}
                    disabled={disabled}
                  />
                </div>
                <ConfirmRemove
                  what={category.label || "this row"}
                  onRemove={() => removeSkillCategory(category.id)}
                  disabled={disabled}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
      <AddButton onClick={() => addSkillCategory()} disabled={disabled}>
        Add a row
      </AddButton>
      <p className="text-sm text-ink-soft">Rename the labels to fit your field: Lab techniques, Languages, Software.</p>
    </div>
  );
}
