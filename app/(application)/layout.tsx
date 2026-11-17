import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { headers } from "next/headers";
import { DashboardLayoutClient } from "@/components/dashboard-layout-client";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default async function ApplicationLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession({ headers: await headers() });
  if (!session?.user) redirect("/auth/sign-in");

  return (
    <DashboardLayoutClient sidebar={<DashboardSidebar />}>
      {children}
    </DashboardLayoutClient>
  );
}
