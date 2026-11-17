import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  return drizzle(neon(databaseUrl), { schema });
}

let database: ReturnType<typeof createDatabase> | undefined;

// Initialize only when a configured, authenticated request needs persistence.
export function getDb() {
  return database ??= createDatabase();
}
