# Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Features, How It Works, and Pricing sections to the landing page with editorial polish.

**Architecture:** All changes live in a single file (`app/(marketing)/landing-page.tsx`). New section components are defined as local constants/functions at the top of the file, following the existing `HeroButtons` and `Headline` pattern. No new files needed.

**Tech Stack:** Next.js 15, React, Tailwind CSS v4, motion/react, shadcn Button, lucide-react

---

## File Map

| File | Change |
|------|--------|
| `app/(marketing)/landing-page.tsx` | Add imports, `SectionLabel` component, grain texture overlay, and three new sections |

---

## Task 1: Add SectionLabel component, paper grain texture, and section divider pattern

**Files:**
- Modify: `app/(marketing)/landing-page.tsx`

**Context:** The existing file imports `motion`, `AnimatePresence`, `ArrowRight`, `Menu`, `X`, `Button`, `PDFResumePreview`, `Link`, `useState`. We need to add `Check` from lucide-react and `useRef` isn't needed. `cn` is used throughout the app but not yet imported here.

- [ ] **Step 1: Add missing imports**

Replace the existing import block at the top of `app/(marketing)/landing-page.tsx`:

```tsx
"use client";

import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Check, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PDFResumePreview } from "@/components/pdf-preview";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
```

- [ ] **Step 2: Add the SectionLabel component**

After the `Headline` component definition (around line 30), add:

```tsx
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">
    {children}
  </p>
);
```

- [ ] **Step 3: Add the paper grain texture overlay**

Inside `LandingPage`, just after the opening `<div className="min-h-screen bg-background ...">` and before `{/* Navigation */}`, add:

```tsx
{/* Paper grain texture overlay */}
<div
  className="pointer-events-none fixed inset-0 z-[999] opacity-[0.03]"
  style={{
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  }}
/>
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/\(marketing\)/landing-page.tsx
git commit -m "feat: add SectionLabel component and paper grain texture to landing page"
```

---

## Task 2: Add Features section

**Files:**
- Modify: `app/(marketing)/landing-page.tsx`

**Context:** The Features section uses an asymmetric `lg:grid-cols-[3fr_2fr]` layout. The left card (feature 01) is large; the right column stacks features 02–04 vertically. Each card has a decorative oversized number, bold title, and muted description.

- [ ] **Step 1: Add the feature data and FeatureCard component**

Add these just before the `LandingPage` function definition:

```tsx
const features = [
  {
    num: "01",
    title: "AI Bullet Enhancement",
    description:
      "Rewrites your bullet points to be stronger, more impactful, and ATS-optimized — so your experience speaks for itself.",
  },
  {
    num: "02",
    title: "Live LaTeX Preview",
    description:
      "See your resume render in real-time as you type. No refreshing, no guessing.",
  },
  {
    num: "03",
    title: "One-Click PDF Export",
    description:
      "Download a pixel-perfect PDF instantly, ready to send to any employer.",
  },
  {
    num: "04",
    title: "Smart Resume Parser",
    description:
      "Upload an existing resume and we'll import your content automatically.",
  },
];

function FeatureCard({
  num,
  title,
  description,
  className,
}: {
  num: string;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-card ring-1 ring-border p-8 flex flex-col justify-end",
        "bg-gradient-to-br from-primary/5 to-transparent",
        className
      )}
    >
      <span className="absolute top-5 right-6 text-[96px] leading-none font-bold text-muted-foreground/10 select-none pointer-events-none">
        {num}
      </span>
      <h3 className="text-2xl font-bold tracking-tight mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed text-sm">
        {description}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Add the Features section to the JSX**

Inside `LandingPage`, in the `<div className="overflow-x-hidden">` block, replace the existing `{/* Footer */}` comment with the Features section followed by the footer. Add this between the closing `</section>` of the hero and the `{/* Footer */}` comment:

```tsx
{/* Features Section */}
<section className="py-24 lg:py-32 border-t border-border">
  <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mb-12"
    >
      <SectionLabel>Features</SectionLabel>
      <h2 className="text-5xl lg:text-6xl font-bold tracking-tighter">
        Everything you need
        <br />
        to land the job.
      </h2>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4"
    >
      <FeatureCard {...features[0]} className="min-h-[320px]" />
      <div className="grid grid-cols-1 gap-4">
        {features.slice(1).map((f) => (
          <FeatureCard key={f.num} {...f} />
        ))}
      </div>
    </motion.div>
  </div>
</section>
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/\(marketing\)/landing-page.tsx
git commit -m "feat: add Features section to landing page"
```

---

## Task 3: Add How It Works section

**Files:**
- Modify: `app/(marketing)/landing-page.tsx`

**Context:** Three steps in a horizontal timeline on desktop (stacked on mobile). A dashed connector line runs between the step numbers, implemented as an `absolute` positioned element. A CTA button sits below the steps.

- [ ] **Step 1: Add the steps data**

Add this constant just before the `LandingPage` function definition (after `features`):

```tsx
const steps = [
  {
    num: "1",
    title: "Upload or start fresh",
    description:
      "Import your existing resume or begin from our template.",
  },
  {
    num: "2",
    title: "Edit and enhance",
    description:
      "Use AI to sharpen your bullets, fill in your experience, and fine-tune every detail.",
  },
  {
    num: "3",
    title: "Export and apply",
    description:
      "Download a polished PDF and start sending applications.",
  },
];
```

- [ ] **Step 2: Add the How It Works section to the JSX**

Add this after the closing `</section>` of the Features section:

```tsx
{/* How It Works Section */}
<section className="py-24 lg:py-32 border-t border-border">
  <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mb-16"
    >
      <SectionLabel>How It Works</SectionLabel>
      <h2 className="text-5xl lg:text-6xl font-bold tracking-tighter">
        Three steps to your
        <br />
        next job.
      </h2>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.1 }}
    >
      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
        {/* Dashed connector — desktop only */}
        <div className="hidden md:block absolute top-9 left-[20%] right-[20%] border-t border-dashed border-border" />

        {steps.map((step, i) => (
          <div key={i} className="flex flex-col">
            <span className="text-8xl font-bold tracking-tighter leading-none mb-5 text-foreground">
              {step.num}
            </span>
            <h3 className="text-xl font-bold mb-2">{step.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-16 flex justify-center">
        <Link href="/auth/sign-in">
          <Button
            size="lg"
            className="h-14 px-10 text-lg font-black shadow-2xl shadow-primary/30 group rounded-xl"
          >
            Build my resume
            <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </div>
    </motion.div>
  </div>
</section>
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/\(marketing\)/landing-page.tsx
git commit -m "feat: add How It Works section to landing page"
```

---

## Task 4: Add Pricing section

**Files:**
- Modify: `app/(marketing)/landing-page.tsx`

**Context:** Two cards side-by-side (stacked on mobile). The Pro card has `ring-2 ring-primary`, a gradient wash, and a "Most Popular" badge. Both use `Check` from lucide-react for feature lists. The Pro price is a placeholder — owner fills in the number before shipping.

- [ ] **Step 1: Add pricing feature lists**

Add these constants just before the `LandingPage` function definition (after `steps`):

```tsx
const freeFeatures = [
  "1 resume",
  "Limited AI enhancements per month",
  "PDF export",
  "Live LaTeX preview",
];

const proFeatures = [
  "Unlimited resumes",
  "Unlimited AI enhancements",
  "PDF export",
  "Live LaTeX preview",
  "Priority support",
];
```

- [ ] **Step 2: Add the Pricing section to the JSX**

Add this after the closing `</section>` of the How It Works section:

```tsx
{/* Pricing Section */}
<section className="py-24 lg:py-32 border-t border-border">
  <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mb-16 text-center"
    >
      <SectionLabel>Pricing</SectionLabel>
      <h2 className="text-5xl lg:text-6xl font-bold tracking-tighter">
        Simple, honest pricing.
      </h2>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.1 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Free card */}
        <div className="rounded-2xl bg-card ring-1 ring-border p-8 flex flex-col">
          <SectionLabel>Free</SectionLabel>
          <div className="mb-6">
            <span className="text-5xl font-bold tracking-tighter">$0</span>
            <span className="text-muted-foreground ml-2 text-sm">
              / forever
            </span>
          </div>
          <ul className="space-y-3 mb-8 flex-1">
            {freeFeatures.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm">
                <Check className="w-4 h-4 text-primary shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <Link href="/auth/sign-in">
            <Button
              variant="outline"
              className="w-full rounded-xl font-bold h-12"
            >
              Start for free
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Pro card */}
        <div className="relative rounded-2xl bg-gradient-to-b from-primary/5 to-transparent ring-2 ring-primary p-8 flex flex-col">
          <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
            Most Popular
          </div>
          <SectionLabel>Pro</SectionLabel>
          <div className="mb-6">
            <span className="text-5xl font-bold tracking-tighter">$X</span>
            <span className="text-muted-foreground ml-2 text-sm">/ mo</span>
          </div>
          <ul className="space-y-3 mb-8 flex-1">
            {proFeatures.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm">
                <Check className="w-4 h-4 text-primary shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <Link href="/auth/sign-in">
            <Button className="w-full rounded-xl font-bold h-12 shadow-lg shadow-primary/20">
              Get Pro
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-6">
        No credit card required. Upgrade anytime.
      </p>
    </motion.div>
  </div>
</section>
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/\(marketing\)/landing-page.tsx
git commit -m "feat: add Pricing section to landing page"
```

---

## Open Items (post-implementation)

- [ ] Replace `$X` in the Pro pricing card with the actual monthly price before shipping
