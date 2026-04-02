# Ascendume - Agentic Development Guidelines

This file contains the context, code style guidelines, and execution commands for AI coding agents operating in the `ascendume` repository. Adhere strictly to these rules when reading or modifying the codebase.

## 1. Project Overview & Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **UI & Styling:** React 19, Tailwind CSS v4, Radix UI, Shadcn UI, `motion` (Framer Motion)
- **Database:** Drizzle ORM, Neon Serverless Postgres (`@neondatabase/serverless`)
- **Authentication:** `better-auth`
- **AI:** Vercel AI SDK (`ai`, `@ai-sdk/openai`)
- **PDF Generation:** `@react-pdf/renderer`

## 2. Execution Commands

### Build & Type-Checking
Always run type checks and linters after modifying files.
- **Development Server:** `npm run dev`
- **Production Build:** `npm run build`
- **Linting:** `npm run lint` (uses ESLint 9)
- **Type Checking:** `npx tsc --noEmit` (Crucial: Run this after refactoring)

### Database (Drizzle & Neon)
- **Generate Migrations:** `npx drizzle-kit generate`
- **Push Schema to DB:** `npx drizzle-kit push`
- **Drizzle Studio:** `npx drizzle-kit studio`

### Testing (Setup required)
*(Note: As the project currently lacks a test runner in `package.json`, agents should prioritize verifying logic through TypeScript validation (`npx tsc --noEmit`) and checking endpoints/components manually. If `vitest` or `jest` is added later, follow these test conventions:)*
- **Run all tests:** `npm run test`
- **Run a single test file:** `npx vitest run path/to/file.test.ts` (if Vitest) or `npx jest path/to/file.test.ts` (if Jest).
- **Run tests in watch mode:** `npx vitest` or `npm run test:watch`.

## 3. Code Style & Architecture

### 3.1 Next.js App Router Conventions
- Use the `app/` directory exclusively for routes, layouts, and page-level components.
- Default to **Server Components** (`page.tsx`, `layout.tsx`).
- Explicitly add `"use client";` at the very top of files only when necessary (e.g., when using hooks like `useState`, `useEffect`, `useRouter`, or interactive UI components).
- API routes must be located in `app/api/.../route.ts` using modern Next.js route handler signatures.

### 3.2 Imports and File Structure
- **Absolute Imports:** Use absolute imports (e.g., `@/components/...`, `@/lib/...`) over relative paths (`../../`) whenever possible.
- **Grouping:** Group imports in the following order:
  1. React and Next.js built-ins (`react`, `next/link`, etc.)
  2. Third-party packages (`clsx`, `lucide-react`, `drizzle-orm`, etc.)
  3. Internal aliases (`@/lib`, `@/components`, `@/db`)
  4. Relative imports (only for closely related sibling files)
- Keep UI components in `components/`.
- Keep utility functions, shared logic, and db clients in `lib/`.

### 3.3 TypeScript & Types
- Strictly type all function parameters and return types. Avoid `any`.
- Define `interface` or `type` for all Component props.
- Export shared types from a dedicated `types/` folder or at the top of the relevant module.
- Use optional chaining (`?.`) and nullish coalescing (`??`) for robust object access.
- For database models, rely on Drizzle's inferred types (e.g., `typeof users.$inferSelect`).

### 3.4 Formatting & Naming Conventions
- **Files/Directories:** Use `kebab-case` for directories and route files (`sign-in`, `page.tsx`). Use `PascalCase` for React component files (if outside the `app/` routing tree, e.g., `components/Button.tsx`). Use `camelCase` for utilities (`utils.ts`).
- **Variables/Functions:** Use `camelCase`.
- **Components:** Use `PascalCase` for component names (`UserProfile`, `ResumeBuilder`).
- **Constants:** Use `UPPER_SNAKE_CASE` for global constants.
- Avoid default exports unless required by Next.js conventions (`page.tsx`, `layout.tsx`, `route.ts`). Use named exports for standard components and utilities.

### 3.5 Styling (Tailwind CSS v4 & Shadcn UI)
- Use Tailwind utility classes directly in the `className` prop.
- Use `cn()` (which wraps `clsx` and `tailwind-merge`) when conditionally joining classes:
  ```tsx
  import { cn } from "@/lib/utils";
  // ...
  className={cn("base-classes", isActive && "active-classes", className)}
  ```
- Use Framer Motion (`motion`) for complex animations, or `tw-animate-css` for simple Tailwind-based animations.
- Rely on Shadcn UI primitive components for foundational UI (Buttons, Inputs, Dialogs) to maintain a consistent design system.

### 3.6 Error Handling & Data Fetching
- **Server-Side Errors:** Wrap server actions and route handlers in `try/catch` blocks. Return standardized error responses (e.g., `{ error: "Message", status: 500 }`).
- **Client-Side Data Fetching:** Prefer React Server Components for initial data loads. When fetching client-side, gracefully handle loading and error states.
- Do not expose raw database errors or stack traces to the client.

### 3.7 Database (Drizzle + Neon)
- All schema definitions should reside in `db/schema.ts` (or equivalent Drizzle setup).
- Use Neon's serverless driver for Edge/Serverless compatibility (`@neondatabase/serverless`).
- When querying, prefer Drizzle's relational query API for readability where performance permits.

### 3.8 Agent Interaction Guidelines
- **Verification:** Always verify file paths before writing using the `bash` tool (e.g., `ls path/to/dir`).
- **Scope:** Do not apply large architectural refactors outside the explicit scope of the user's request.
- **Commenting:** Add inline comments to explain *why* complex logic exists, rather than *what* it is doing. Do not leave "todo" comments for the user unless explicitly instructed.
- **Security:** Never commit `.env` or `.env.local`. Do not log sensitive credentials (API keys, better-auth secrets) in terminal outputs.