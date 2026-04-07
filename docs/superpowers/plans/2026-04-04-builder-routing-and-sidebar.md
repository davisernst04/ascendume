# Builder Routing & Persistent Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the resume builder from `app/builder/[id]/` to `app/(application)/[id]/` and `app/(application)/new/`, add a shared layout with the persistent dashboard sidebar, and replace the builder's left section panel with a section tab navbar at the top.

**Architecture:** Create `app/(application)/layout.tsx` as an auth-guarded server component that wraps builder routes with `DashboardLayoutClient` + `DashboardSidebar`. `ResumeBuilder.tsx` loses its own header and left section panel — section navigation moves to a top navbar tab bar. The dashboard at `/` keeps its existing sidebar setup unchanged.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, Drizzle + Neon, better-auth

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `app/(application)/layout.tsx` | Auth-guarded layout, renders DashboardLayoutClient + DashboardSidebar for all builder routes |
| Create | `app/(application)/[id]/page.tsx` | Builder page for an existing resume (URL: `/<id>`) |
| Create | `app/(application)/new/page.tsx` | Builder page for a new resume (URL: `/new`) |
| Modify | `components/ResumeBuilder.tsx` | Remove header + left panel; add section tab navbar; fix height to fill layout |
| Modify | `components/dashboard-sidebar.tsx` | Update resume links from `/builder/<id>` → `/<id>`; update "New Resume" link to `/new` |
| Delete | `app/builder/[id]/page.tsx` | Old builder route, now replaced |

---

## Task 1: Create `(application)` layout with auth guard and sidebar

**Files:**
- Create: `app/(application)/layout.tsx`

- [ ] **Step 1: Create the layout file**

```tsx
// app/(application)/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DashboardLayoutClient } from "@/components/dashboard-layout-client";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default async function ApplicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/auth/sign-in");

  return (
    <DashboardLayoutClient sidebar={<DashboardSidebar />}>
      {children}
    </DashboardLayoutClient>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors from this file.

- [ ] **Step 3: Commit**

```bash
git add app/\(application\)/layout.tsx
git commit -m "feat: add (application) layout with auth guard and persistent sidebar"
```

---

## Task 2: Add builder pages inside `(application)`

**Files:**
- Create: `app/(application)/[id]/page.tsx`
- Create: `app/(application)/new/page.tsx`

- [ ] **Step 1: Create the `[id]` page**

```tsx
// app/(application)/[id]/page.tsx
import ResumeBuilder from "@/components/ResumeBuilder";
import { use } from "react";

export default function BuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ResumeBuilder resumeId={id} />;
}
```

- [ ] **Step 2: Create the `new` page**

```tsx
// app/(application)/new/page.tsx
import ResumeBuilder from "@/components/ResumeBuilder";

export default function NewResumePage() {
  return <ResumeBuilder resumeId="new" />;
}
```

Note: `resumeId="new"` is handled by `use-resume-persistence.ts` line 86 — it skips the DB load and starts with a blank resume that saves as a new record on first edit.

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/\(application\)/\[id\]/page.tsx app/\(application\)/new/page.tsx
git commit -m "feat: add builder pages at /[id] and /new inside (application) route group"
```

---

## Task 3: Refactor `ResumeBuilder.tsx` — remove header + left panel, add section tab navbar

**Files:**
- Modify: `components/ResumeBuilder.tsx`

The current `ResumeBuilderContent` renders:
1. `<header>` (lines 125–165): back arrow, title input, preview/export buttons — **remove**
2. `<div className="flex h-[calc(100vh-3.5rem)]">` wrapping three panels — **restructure**
3. Left panel `w-64` with sections nav and "Add Section" — **remove**
4. Center panel (form editor) — **keep**
5. Right panel `w-[420px]` (preview) — **keep**

Replace the entire `ResumeBuilderContent` return value and remove `ArrowLeft` from imports.

- [ ] **Step 1: Remove `ArrowLeft` from imports**

In `components/ResumeBuilder.tsx`, change the lucide-react import from:

```tsx
import {
  User,
  Briefcase,
  GraduationCap,
  Code,
  FolderKanban,
  Award,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Download,
  Loader2,
} from "lucide-react";
```

to:

```tsx
import {
  User,
  Briefcase,
  GraduationCap,
  Code,
  FolderKanban,
  Award,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
} from "lucide-react";
```

Also remove the `Link` import from `next/link` since there are no links in the builder anymore:

```tsx
// Remove this line:
import Link from "next/link";
```

- [ ] **Step 2: Replace the `ResumeBuilderContent` return value**

Replace the entire `return (...)` block inside `ResumeBuilderContent` (starting at `return (` on line 122, ending at the closing `);` before `function SectionEditor`) with:

```tsx
  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Section Tab Navbar */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shrink-0">
        <div className="px-4 h-12 flex items-center gap-1 overflow-x-auto">
          <input
            type="text"
            value={resumeData.title}
            onChange={(e) => updateTitle(e.target.value)}
            className="bg-transparent border-none text-sm font-semibold focus:outline-none focus:ring-0 w-36 shrink-0 text-foreground"
            placeholder="Resume title"
          />
          <div className="h-4 w-px bg-border shrink-0 mx-2" />
          {sections.map((section) => {
            const Icon = sectionIcons[section.type];
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors shrink-0 ${
                  activeSection === section.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {section.title}
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-2 shrink-0 pl-4">
            <Button
              size="sm"
              className="font-bold shadow-lg shadow-primary/20 rounded-lg gap-2 h-8"
              onClick={() => exportPdf()}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Export PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 min-h-0">
        {/* Center Panel - Editor */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {sections.filter((s) => s.id === activeSection).map((section) => {
              const Icon = sectionIcons[section.type];
              return (
                <div key={section.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-primary" />
                      <h2 className="font-semibold">{section.title}</h2>
                    </div>
                    {section.expanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  {section.expanded && (
                    <div className="p-4 pt-0 border-t border-border">
                      <SectionEditor type={section.type} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="w-[420px] border-l border-border bg-muted/30 overflow-y-auto hidden lg:block shrink-0">
          <div className="p-4">
            <h3 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">Live Preview</h3>
            <ResumePreview />
          </div>
        </div>
      </div>
    </div>
  );
```

- [ ] **Step 3: Remove the now-unused state and functions**

The `addSection` and `removeSection` functions are no longer called. Remove them from `ResumeBuilderContent`. Find these lines and delete them (lines ~94–120):

```tsx
  const addSection = (type: SectionType) => {
    const existing = sections.find((s) => s.type === type);
    if (existing) {
      setActiveSection(existing.id);
      if (!existing.expanded) {
        toggleSection(existing.id);
      }
      return;
    }
    
    const newSection: Section = {
      id: crypto.randomUUID(),
      type,
      title: type === "experience" ? "Work Experience" :
             type === "education" ? "Education" :
             type === "skills" ? "Skills" :
             type === "projects" ? "Projects" :
             type === "certifications" ? "Certifications" : "Personal Info",
      expanded: true,
    };
    setSections([...sections, newSection]);
    setActiveSection(newSection.id);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id));
  };
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors. If there are unused import errors, remove those imports.

- [ ] **Step 5: Commit**

```bash
git add components/ResumeBuilder.tsx
git commit -m "feat: replace builder header+left panel with section tab navbar; fill layout height"
```

---

## Task 4: Update sidebar links and remove old builder route

**Files:**
- Modify: `components/dashboard-sidebar.tsx`
- Delete: `app/builder/[id]/page.tsx`

- [ ] **Step 1: Update resume links in `DashboardSidebar`**

In `components/dashboard-sidebar.tsx`, change the "New Resume" button link from `href="/"` to `href="/new"`:

```tsx
// Change:
<Link href="/" className="mr-2 block ...">

// To:
<Link href="/new" className="mr-2 block ...">
```

Change each resume link from `/builder/${resume.id}` to `/${resume.id}`:

```tsx
// Change:
<Link key={resume.id} href={`/builder/${resume.id}`}>

// To:
<Link key={resume.id} href={`/${resume.id}`}>
```

- [ ] **Step 2: Delete the old builder route**

```bash
rm app/builder/\[id\]/page.tsx
rmdir app/builder/\[id\] app/builder
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Verify dev server**

```bash
npm run dev
```

Check:
- `/` — dashboard still shows with sidebar; resume list links now go to `/<id>` not `/builder/<id>`
- `/new` — opens the builder with empty resume, persistent sidebar visible
- `/<existing-resume-id>` — opens builder with loaded resume, persistent sidebar visible
- Section tabs in the builder navbar work (clicking each changes the form panel)
- Export PDF button still works
- Sidebar toggle (open/close) works on builder pages

- [ ] **Step 5: Commit**

```bash
git add components/dashboard-sidebar.tsx
git commit -m "feat: update sidebar links to new routes; remove old /builder/[id] route"
```

---

## Task 5: Update CLAUDE.md route documentation

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update the route structure section**

In `CLAUDE.md`, update the Route Structure section to reflect the new routes. Change:

```
- `app/builder/[id]/` — Resume builder for a specific resume by ID
```

To:

```
- `app/(application)/[id]/` — Resume builder for an existing resume (URL: `/<id>`)
- `app/(application)/new/` — Resume builder for a new resume (URL: `/new`)
- `app/(application)/layout.tsx` — Auth-guarded layout: redirects unauthenticated users to `/auth/sign-in`, wraps builder routes with `DashboardLayoutClient` + `DashboardSidebar`
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with new builder route structure"
```
