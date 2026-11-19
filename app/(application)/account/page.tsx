import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getServerSession } from "@/lib/auth";
import { DeleteAccount } from "@/components/delete-account";
import { SignInMethods } from "@/components/sign-in-methods";
import { enabledSocialProviders } from "@/lib/auth-providers";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const { error } = await searchParams;
  const session = await getServerSession({ headers: await headers() });
  if (!session?.user) redirect("/auth/sign-in?next=/account");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-[2.441rem] font-bold leading-[1.05] text-ink">Account</h1>
      <p className="mt-2 text-ink-soft">
        Signed in as <span className="font-semibold text-ink">{session.user.name}</span> ({session.user.email})
      </p>

      <div className="mt-10 divide-y divide-rule border-y border-rule">
        <section aria-labelledby="methods-h" className="grid gap-4 py-8 sm:grid-cols-[12rem_1fr]">
          <h2 id="methods-h" className="font-bold text-ink">
            Ways to sign in
          </h2>
          <SignInMethods
            available={enabledSocialProviders()}
            linkError={error ? "That account couldn't be connected. Make sure it uses the same email as this one." : null}
          />
        </section>

        <section aria-labelledby="data-h" className="grid gap-4 py-8 sm:grid-cols-[12rem_1fr]">
          <h2 id="data-h" className="font-bold text-ink">
            Your data
          </h2>
          <p className="text-ink-soft">
            What we store and where your resume text goes is explained in the{" "}
            <Link href="/privacy" className="font-semibold text-brand hover:underline">
              privacy note
            </Link>
            .
          </p>
        </section>

        <section aria-labelledby="delete-h" className="grid gap-4 py-8 sm:grid-cols-[12rem_1fr]">
          <h2 id="delete-h" className="font-bold text-danger">
            Delete account
          </h2>
          <div className="flex flex-col gap-4">
            <p className="text-ink-soft">
              This permanently deletes your account, every resume and uploaded PDF, your sign-in methods, and the
              usage and analytics records tied to your account. It can&apos;t be undone. Download anything you want to
              keep first.
            </p>
            <DeleteAccount />
          </div>
        </section>
      </div>
    </div>
  );
}
