# Ascendume - Project Context

## Overview
Ascendume is a modern web application built with **Next.js 16 (App Router)** and **React 19**. It leverages **Tailwind CSS v4** for styling and **shadcn/ui** for high-quality accessible components. The project is designed to use **Neon Serverless Postgres** with **Drizzle ORM** for database management.

## Tech Stack
- **Framework:** Next.js 16.2.1 (App Router)
- **Styling:** Tailwind CSS v4, `tw-animate-css`, `motion` (Framer Motion)
- **Components:** shadcn/ui (Radix UI based)
- **Database:** Neon Serverless Postgres (`@neondatabase/serverless`)
- **ORM:** Drizzle ORM (`drizzle-orm`, `drizzle-kit`)
- **Fonts:** Geist Sans & Mono (Next.js font optimization)

## Building and Running
| Command | Action |
|---------|--------|
| `npm run dev` | Starts the development server at `http://localhost:3000` |
| `npm run build` | Builds the application for production |
| `npm run start` | Starts the production server |
| `npm run lint` | Runs ESLint for code quality checks |

## Project Structure
- `app/`: Contains the application routes and layout (Next.js App Router).
  - `layout.tsx`: Root layout with Geist font and global styles.
  - `page.tsx`: Landing page.
  - `globals.css`: Tailwind v4 configuration and shadcn/ui variables.
- `components/ui/`: shadcn/ui primitive components.
- `lib/`: Utility functions and (planned) database initialization.
  - `utils.ts`: Tailwind CSS class merging utility.
- `.agents/skills/`: Custom agent skills (e.g., `neon-postgres` for database guidance).

## Development Conventions
- **Routing:** Use the App Router convention (`app/` directory).
- **Styling:** Use Tailwind CSS utility classes. shadcn/ui components should be used for common UI patterns.
- **Database:** 
  - [TODO] Initialize Drizzle ORM (`drizzle.config.ts`).
  - [TODO] Set up database schema in `lib/db/schema.ts` or similar.
  - [TODO] Configure Neon connection in `lib/db/index.ts`.
- **Naming:** Follow standard TypeScript and React naming conventions (PascalCase for components, camelCase for functions/variables).
- **Icons:** Use `lucide-react` for iconography.

## External Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs/v4-beta)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [Neon Docs](https://neon.com/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team)
