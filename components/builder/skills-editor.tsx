"use client";

import { Plus, Trash2 } from "lucide-react";
import { useResume } from "@/lib/resume-context";
import { addButtonClass, inputClass, labelClass } from "@/components/builder/form-styles";

export function SkillsEditor({ disabled }: { disabled: boolean }) {
  const { resumeData, addSkillCategory, updateSkillCategory, removeSkillCategory } =
    useResume();
  const { skills } = resumeData;

  return (
    <div className="space-y-4 mt-4">
      <p className="text-sm text-muted-foreground">
        Each row becomes one line on your resume, like{" "}
        <span className="font-medium text-foreground">Languages: Python, Java</span>.
        Rename the labels to fit your field.
      </p>
      {skills.map((category) => (
        <div key={category.id} className="flex gap-3 items-end">
          <div className="w-1/3">
            <label className={labelClass} htmlFor={`skill-label-${category.id}`}>
              Label
            </label>
            <input
              id={`skill-label-${category.id}`}
              type="text"
              className={inputClass}
              placeholder="Languages"
              value={category.label}
              onChange={(e) => updateSkillCategory(category.id, { label: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div className="flex-1">
            <label className={labelClass} htmlFor={`skill-items-${category.id}`}>
              Skills
            </label>
            <input
              id={`skill-items-${category.id}`}
              type="text"
              className={inputClass}
              placeholder="Python, Java, SQL"
              value={category.items}
              onChange={(e) => updateSkillCategory(category.id, { items: e.target.value })}
              disabled={disabled}
            />
          </div>
          <button
            type="button"
            onClick={() => removeSkillCategory(category.id)}
            disabled={disabled}
            aria-label={`Remove ${category.label || "skill category"}`}
            className="h-10 px-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => addSkillCategory()}
        disabled={disabled}
        className={addButtonClass}
      >
        <Plus className="w-4 h-4" /> Add Category
      </button>
    </div>
  );
}
