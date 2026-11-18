import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Next.js reads .env.local; load it first so drizzle-kit sees the same values.
dotenv.config({ path: [".env.local", ".env"], quiet: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
