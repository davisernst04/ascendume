import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "./db";

function createAuth() {
  return betterAuth({
    database: drizzleAdapter(getDb(), {
      provider: "pg",
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // Can enable later
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "user",
        },
      },
    },
  });
}

let auth: ReturnType<typeof createAuth> | undefined;

export function isAuthConfigured() {
  return Boolean(process.env.DATABASE_URL && process.env.BETTER_AUTH_SECRET);
}

export function getAuth() {
  return auth ??= createAuth();
}

// A public landing page can be deployed before account storage is configured.
// Protected pages and API handlers still require an authenticated session.
export async function getServerSession(options: { headers: Headers }) {
  if (!isAuthConfigured()) return null;
  return getAuth().api.getSession(options);
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"];
