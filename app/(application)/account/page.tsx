import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getServerSession } from "@/lib/auth";
import { DeleteAccount } from "@/components/delete-account";

export default async function AccountPage() {
  const session = await getServerSession({ headers: await headers() });
  if (!session?.user) redirect("/auth/sign-in?next=/account");

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-10">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Account</h1>
        <p className="text-muted-foreground">
          Signed in as {session.user.name} ({session.user.email}).
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Your data</h2>
        <p className="text-sm text-muted-foreground">
          What we store and where your resume text goes is explained in the{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            privacy note
          </Link>
          .
        </p>
      </section>

      <section className="space-y-3 rounded-xl border border-destructive/40 p-5">
        <h2 className="text-lg font-semibold">Delete my account and data</h2>
        <p className="text-sm text-muted-foreground">
          This permanently deletes your account, every resume and uploaded PDF, your sign-in methods, and the usage
          and analytics records tied to your account. It can&apos;t be undone. Download anything you want to keep
          first.
        </p>
        <DeleteAccount />
      </section>
    </div>
  );
}
