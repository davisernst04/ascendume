import { ReactNode } from "react";
import { getServerSession } from "@/lib/auth";
import { headers } from "next/headers";
import { AppFrame } from "@/components/app-header";

// Guests may use the builder at /new (draft kept in the browser). Pages that
// need an account, like /[id], check the session themselves.
export default async function ApplicationLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession({ headers: await headers() });
  const user = session?.user ? { name: session.user.name, email: session.user.email } : null;
  return <AppFrame user={user}>{children}</AppFrame>;
}
