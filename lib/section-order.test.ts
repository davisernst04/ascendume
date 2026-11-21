import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SECTION_ORDER, moveSection, normalizeSectionOrder, placeAbove } from "@/lib/section-order";
import { buildLatex } from "@/lib/resume-latex";
import type { ResumeData } from "@/lib/resume-context";

test("missing or invalid orders fall back to the default", () => {
  assert.deepEqual(normalizeSectionOrder(undefined), DEFAULT_SECTION_ORDER);
  assert.deepEqual(normalizeSectionOrder("projects"), DEFAULT_SECTION_ORDER);
  assert.deepEqual(normalizeSectionOrder([]), DEFAULT_SECTION_ORDER);
});

test("unknown names and repeats are dropped; missing sections are added at the end", () => {
  assert.deepEqual(normalizeSectionOrder(["projects", "bogus", "projects", "experience", "education"]), [
    "projects",
    "experience",
    "education",
    "skills",
    "certifications",
  ]);
  assert.deepEqual(normalizeSectionOrder(["certifications", "projects"]), [
    "certifications",
    "projects",
    "education",
    "experience",
    "skills",
  ]);
});

test("moving and placing sections", () => {
  const order = [...DEFAULT_SECTION_ORDER];
  assert.deepEqual(moveSection(order, "projects", -1), ["education", "projects", "experience", "skills", "certifications"]);
  assert.deepEqual(moveSection(order, "education", -1), order);
  assert.deepEqual(moveSection(order, "certifications", 1), order);
  assert.deepEqual(placeAbove(order, "projects", "experience"), ["education", "projects", "experience", "skills", "certifications"]);
  assert.deepEqual(placeAbove(order, "certifications", "education"), ["certifications", "education", "experience", "projects", "skills"]);
});

test("the LaTeX lists sections in the resume's order", () => {
  const data: ResumeData = {
    title: "",
    personalInfo: { fullName: "Sam", email: "", phone: "", location: "", summary: "", website: "", linkedin: "", github: "" },
    experience: [{ id: "j", company: "Acme", position: "", location: "", startDate: "", endDate: "", current: false, bullets: "" }],
    education: [{ id: "e", institution: "State", degree: "", field: "", gpa: "", graduationDate: "" }],
    skills: [],
    projects: [{ id: "p", name: "Bot", url: "", technologies: "", description: "" }],
    certifications: [],
    sectionOrder: ["projects", "education", "experience", "skills", "certifications"],
  };
  const tex = buildLatex(data);
  const at = (name: string) => tex.indexOf(`\\section{${name}}`);
  assert.ok(at("Projects") > 0 && at("Projects") < at("Education") && at("Education") < at("Experience"));
});
