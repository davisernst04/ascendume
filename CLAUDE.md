# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint (v9)
npx tsc --noEmit     # Type-check (run after refactoring)

# Database (Drizzle + Neon)
npx drizzle-kit generate   # Generate migrations
npx drizzle-kit push       # Push schema to DB
npx drizzle-kit studio     # Open Drizzle Studio
```

No test runner is configured — use `npx tsc --noEmit` to validate logic.

## Architecture

**Ascendume** is an AI-powered resume builder. Users create/edit resumes, get AI-enhanced bullet points, and export to PDF.

### Route Structure

The `app/` directory uses two route groups plus standalone routes:

- `app/(marketing)/` — Landing page (unauthenticated)
- `app/(application)/` — Dashboard (authenticated); page components live here as `-page.tsx` files rather than in `page.tsx` directly
- `app/(application)/[id]/` — Resume builder for an existing resume (URL: `/<id>`)
- `app/(application)/new/` — Resume builder for a new resume (URL: `/new`)
- `app/(application)/layout.tsx` — Auth-guarded layout: redirects unauthenticated users to `/auth/sign-in`, wraps builder routes with `DashboardLayoutClient` + `DashboardSidebar`
- `app/auth/sign-in/` and `app/auth/sign-up/` — Auth pages
- `app/api/` — Route handlers:
  - `resumes/` — CRUD for resumes
  - `resumes/[id]/export/` — PDF export
  - `resumes/parse/` — Parse uploaded PDF resumes
  - `ai/enhance/` — AI bullet point enhancement (Vercel AI SDK streaming)
  - `auth/[...all]/` — better-auth catch-all handler

### Data Layer

- Schema: `lib/db/schema.ts` — tables: `user`, `session`, `account`, `verification` (better-auth managed), `resumes`, `personalInfo`, `workExperience`, `education`, `skills`, `projects`, `certifications`
- DB client: `lib/db/index.ts` using Neon serverless driver
- Auth: `lib/auth.ts` (server), `lib/auth-client.ts` (client)

### Resume State

`lib/resume-context.tsx` provides a React context (`ResumeContext`) with the full resume data shape (`ResumeData`) used throughout the builder. The builder page reads/writes through this context, which syncs to the DB via `lib/use-resume-persistence.ts`.

### Key Conventions

- **Server Components by default** — add `"use client"` only for interactivity/hooks
- **Absolute imports** — always use `@/components/...`, `@/lib/...` etc.
- **Named exports** everywhere except `page.tsx`, `layout.tsx`, `route.ts`
- **`cn()`** from `@/lib/utils` for conditional Tailwind classes
- **Drizzle inferred types** — use `typeof table.$inferSelect` for DB model types
- **No default exports** outside Next.js conventions
- Schema changes require both `npx drizzle-kit generate` + `npx drizzle-kit push`
