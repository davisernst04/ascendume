import { AuthForm } from "@/components/auth-form";
import { enabledSocialProviders } from "@/lib/auth-providers";
import { safeRedirectPath } from "@/lib/safe-redirect";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  return (
    <AuthForm
      mode="sign-in"
      providers={enabledSocialProviders()}
      next={safeRedirectPath(next)}
    />
  );
}
