import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DashboardLayoutClient } from "@/components/dashboard-layout-client";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default async function ApplicationLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/auth/sign-in");

  return (
    <DashboardLayoutClient sidebar={<DashboardSidebar />}>
      {children}
    </DashboardLayoutClient>
  );
}
