import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "./db";
import { socialProvidersConfig } from "./auth-providers";
import { eq } from "drizzle-orm";
import { resumes } from "./db/schema";
import { deleteUploadedFiles } from "./blob-files";

function createAuth() {
  return betterAuth({
    database: drizzleAdapter(getDb(), {
      provider: "pg",
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // Can enable later
    },
    socialProviders: socialProvidersConfig(),
    // OAuth failures land on our sign-in page (with ?error=...) instead of better-auth's raw error screen.
    onAPIError: { errorURL: "/auth/sign-in" },
    account: {
      accountLinking: {
        enabled: true,
        // Google and GitHub only return verified emails, so signing in with one
        // links to an existing account with the same email. Microsoft is left out:
        // work/school tenants can return an email the user doesn't own.
        trustedProviders: ["google", "github"],
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
    },
    user: {
      // "Delete my account and data": rows cascade from the user (resumes and
      // their sections, sessions, accounts, AI usage, analytics events). Uploaded
      // PDFs are in Blob storage, so they are removed first.
      deleteUser: {
        enabled: true,
        beforeDelete: async (user) => {
          const rows = await getDb()
            .select({ url: resumes.originalFileUrl })
            .from(resumes)
            .where(eq(resumes.userId, user.id));
          await deleteUploadedFiles(rows.map((r) => r.url));
        },
      },
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
