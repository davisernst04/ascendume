import { ReactNode } from "react";
import { getServerSession } from "@/lib/auth";
import { headers } from "next/headers";
import { DashboardLayoutClient } from "@/components/dashboard-layout-client";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { GuestLayout } from "@/components/guest-layout";

// Guests may use the builder at /new (draft kept in the browser). Pages that
// need an account, like /[id], check the session themselves.
export default async function ApplicationLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession({ headers: await headers() });
  if (!session?.user) return <GuestLayout>{children}</GuestLayout>;

  return (
    <DashboardLayoutClient sidebar={<DashboardSidebar />}>
      {children}
    </DashboardLayoutClient>
  );
}
