# Ascendume - Project Context

## Project Overview
Ascendume is a modern web application built with **Next.js 16 (App Router)** and **React 19**. It features a highly customized design system leveraging **Tailwind CSS v4** with OKLCH color palettes, custom shadows, and typography. The project is integrated with **Neon Serverless Postgres** using **Drizzle ORM** for database management and **shadcn/ui** for accessible components.

### Core Tech Stack
- **Framework:** Next.js 16.2.1 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (using `@theme inline` and OKLCH color spaces)
- **Components:** shadcn/ui (radix-nova style)
- **Database:** Neon Serverless Postgres (`@neondatabase/serverless`)
- **ORM:** Drizzle ORM (`drizzle-orm`, `drizzle-kit`)
- **Animations:** Framer Motion (`motion`) and `tw-animate-css`
- **Icons:** Lucide React

## Building and Running
| Command | Action |
|---------|--------|
| `npm run dev` | Starts the development server at `http://localhost:3000` |
| `npm run build` | Builds the application for production |
| `npm run start` | Starts the production server |
| `npm run lint` | Runs ESLint for code quality checks |

### Database Management
- **Schema Location:** `lib/db/schema.ts`
- **Generate Migrations:** `npx drizzle-kit generate`
- **Apply Schema to DB:** `npx drizzle-kit push`
- **Studio:** `npx drizzle-kit studio` (to view data)

## Project Structure
- `app/`: Contains the application routes, layout, and global styles.
  - `layout.tsx`: Root layout with Geist/custom font integration.
  - `page.tsx`: Main landing page.
  - `globals.css`: Tailwind v4 theme, OKLCH variables, and base styles.
- `components/ui/`: shadcn/ui primitive components.
- `lib/`: Shared utilities and database logic.
  - `db/index.ts`: Database connection initialization.
  - `db/schema.ts`: Drizzle table definitions.
  - `utils.ts`: Helper functions (e.g., `cn` for Tailwind class merging).

## Development Conventions
- **Routing:** Follow Next.js App Router conventions (`app/` directory).
- **Database Schema:** Define all tables in `lib/db/schema.ts` using Drizzle's `pg-core` functions.
- **Styling:** Use Tailwind CSS v4 utility classes. Prefer CSS variables defined in `globals.css` for theme-specific values (colors, shadows, spacing).
- **Typography:** The project uses a custom font setup with "Times New Roman" as the primary sans-serif/serif font and "JetBrains Mono" for monospaced text.
- **Components:** Always use shadcn/ui primitives from `components/ui/` and compose them into complex components.
- **Utils:** Use the `cn` utility from `lib/utils.ts` for conditional class name merging.
- **Animations:** Leverage `motion` for complex transitions and `tw-animate-css` for utility-based animations.

## Environment Variables
Ensure the following variables are set in your `.env` or `.env.local`:
- `DATABASE_URL`: The full connection string for your Neon Postgres database.
