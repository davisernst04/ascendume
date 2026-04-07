# Landing Page Redesign — Design Spec

**Date:** 2026-04-06
**Branch:** dashboard

---

## Overview

Extend the existing landing page (`app/(marketing)/landing-page.tsx`) with three new sections below the hero — Features, How It Works, and Pricing — while adding subtle global polish. The hero section (title left, resume image right) is preserved exactly as-is.

---

## Constraints & Non-Goals

- Hero section layout is frozen — do not modify it
- No testimonials section (to be added later once users exist)
- No new fonts or color tokens — extend the existing design system
- Pricing amounts (Pro tier price) are left as a placeholder for the owner to fill in

---

## Global Polish

- **Paper grain texture:** A subtle SVG noise filter at ~3% opacity applied as a pseudo-element over the `background` — adds warmth without changing the beige color
- **Section labels:** Small-caps, `tracking-widest`, `text-muted-foreground`, above each section heading (e.g., `FEATURES`, `HOW IT WORKS`, `PRICING`)
- **Section padding:** `py-24 lg:py-32` consistently across all new sections
- **Container:** `max-w-7xl mx-auto px-6 sm:px-8 lg:px-12` — matches hero and nav
- **Section dividers:** Thin full-width `border-t border-border` between sections
- **Scroll animations:** `motion/react` `whileInView` fade-up on each section, `viewport={{ once: true }}`

---

## Section 1: Features

### Layout

Asymmetric grid: on desktop, the first feature occupies a large left card (~60% width), and the remaining three features fill a 2×2 grid on the right. On mobile, all four cards stack vertically.

### Card Design

- Background: `bg-card` with `ring-1 ring-border rounded-2xl`
- Subtle inner gradient: `bg-gradient-to-br from-primary/5 to-transparent` for depth
- Decorative number: `01`, `02`, `03`, `04` — oversized serif, `text-muted-foreground/20`, positioned top-right
- Feature title: bold serif
- Description: `text-muted-foreground`, one to two sentences
- No icons

### Features

| # | Title | Description |
|---|-------|-------------|
| 01 | AI Bullet Enhancement | Rewrites your bullet points to be stronger, more impactful, and ATS-optimized |
| 02 | Live LaTeX Preview | See your resume render in real-time as you type — no refreshing needed |
| 03 | One-Click PDF Export | Download a pixel-perfect PDF instantly, ready to send |
| 04 | Smart Resume Parser | Upload an existing resume and we'll import your content automatically |

---

## Section 2: How It Works

### Layout

Three steps in a horizontal timeline on desktop; stacked vertically on mobile. Steps are connected by a thin dashed rule on desktop.

### Step Design

- Large oversized serif step number (`1`, `2`, `3`) as visual anchor
- Bold title below the number
- One-sentence description in `text-muted-foreground`
- Dashed connector between steps (`border-dashed border-t border-border`) — hidden on mobile

### Steps

1. **Upload or start fresh** — Import your existing resume or begin from our template
2. **Edit and enhance** — Use AI to sharpen your bullets, fill in your experience, and fine-tune every detail
3. **Export and apply** — Download a polished PDF and start sending applications

### CTA

Centered below the timeline: a single `Button` — "Build my resume →" — linking to `/auth/sign-in`.

---

## Section 3: Pricing

### Layout

Two cards side-by-side on desktop, stacked on mobile. Centered within the section.

### Card Design

**Free card:**
- Label: `FREE` (small-caps section label style)
- Price: `$0 / forever`
- Features: 1 resume, limited AI enhancements per month, PDF export, live preview
- CTA: "Start for free →" (links to `/auth/sign-in`)

**Pro card (elevated):**
- Label: `PRO`
- Visual elevation: `ring-2 ring-primary`, subtle `bg-gradient-to-b from-primary/5 to-transparent`
- Badge: "Most Popular" pill in top-right corner
- Price: `$[X]/mo` *(owner to fill in)*
- Features: Unlimited resumes, unlimited AI enhancements, PDF export, live preview, priority support
- CTA: "Get Pro →" (links to `/auth/sign-in`)

**Below both cards:**
> "No credit card required. Upgrade anytime." — `text-muted-foreground text-sm text-center`

---

## Footer

Existing footer is preserved. No changes required.

---

## File Changes

- `app/(marketing)/landing-page.tsx` — add Features, How It Works, Pricing sections; add paper grain texture
- No new files required; all new section content is co-located in the landing page component

---

## Open Items

- [ ] Owner to set Pro tier price (replace `$[X]/mo` placeholder)
- [ ] Testimonials section — deferred until real users exist
