// Server-only: reads OAuth credentials from the environment.

export type SocialProviderId = "github" | "google" | "microsoft";

const ENV: Record<SocialProviderId, { id: string; secret: string }> = {
  github: { id: "GITHUB_CLIENT_ID", secret: "GITHUB_CLIENT_SECRET" },
  google: { id: "GOOGLE_CLIENT_ID", secret: "GOOGLE_CLIENT_SECRET" },
  microsoft: { id: "MICROSOFT_CLIENT_ID", secret: "MICROSOFT_CLIENT_SECRET" },
};

function credentials(provider: SocialProviderId) {
  const clientId = process.env[ENV[provider].id];
  const clientSecret = process.env[ENV[provider].secret];
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

/** Providers whose credentials are set, in the order the sign-in page shows them. */
export function enabledSocialProviders(): SocialProviderId[] {
  return (["github", "google", "microsoft"] as const).filter((p) => credentials(p) !== null);
}

/** better-auth `socialProviders` config, containing only providers that have credentials. */
export function socialProvidersConfig() {
  const github = credentials("github");
  const google = credentials("google");
  const microsoft = credentials("microsoft");
  return {
    ...(github && { github }),
    ...(google && { google }),
    // "common" accepts personal Microsoft accounts and work/school (Entra ID) accounts.
    ...(microsoft && { microsoft: { ...microsoft, tenantId: "common" } }),
  };
}
