import { AuthForm } from "@/components/auth-form";
import { enabledSocialProviders } from "@/lib/auth-providers";
import { safeRedirectPath } from "@/lib/safe-redirect";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; error?: string | string[] }>;
}) {
  const { next, error } = await searchParams;
  return (
    <AuthForm
      mode="sign-up"
      providers={enabledSocialProviders()}
      next={safeRedirectPath(next)}
      oauthError={typeof error === "string" ? error : undefined}
    />
  );
}
