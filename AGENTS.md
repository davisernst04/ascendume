# Ascendume Agent Instructions

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS v4, Radix UI, Shadcn UI, `motion` (Framer Motion)
- **Database:** Drizzle ORM, Neon Serverless Postgres (`@neondatabase/serverless`)
- **Authentication:** `better-auth`
- **AI & PDF:** Vercel AI SDK, `@react-pdf/renderer`

## Execution Commands
- **Type Checking (Run after refactors):** `npx tsc --noEmit`
- **Linting:** `npm run lint` (ESLint 9)
- **Database Migrations:** `npx drizzle-kit generate`
- **Database Push:** `npx drizzle-kit push`
- **Drizzle Studio:** `npx drizzle-kit studio`
- **Dev Server:** `npm run dev`

*(Note: No test runner is currently configured. Rely on `tsc --noEmit` to verify logic.)*

## Architecture & Conventions
- **App Router:** `app/` is strictly for routes, layouts, and pages. Default to Server Components.
- **Client Components:** Use `"use client";` only when necessary (e.g. state, effects, interactions).
- **API Routes:** Use `app/api/.../route.ts` with Next.js App Router signatures.
- **Components:** Place in `components/`. Use `PascalCase` filenames.
- **Database Schema:** Defined in `db/schema.ts` (or `db/` equivalent). Prefer Drizzle's relational queries.
- **Styling:** Use Tailwind v4 directly in `className`. Use `cn()` from `@/lib/utils` for conditional classes. Prefer Shadcn UI primitives.
- **Imports:** Use absolute imports (`@/components/...`, `@/lib/...`). Group imports: React/Next, third-party, internal aliases, relative paths.

## Constraints & Security
- Never commit `.env` or `.env.local`.
- Do not log sensitive credentials (API keys, better-auth secrets).
- Handle server errors with `try/catch` and return standardized JSON `{ error: string, status: number }`. Do not leak raw DB errors or stacks.
