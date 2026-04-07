import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import LandingPage from "./(marketing)/landing-page";
import DashboardPage from "./(application)/dashboard-page";
import { DashboardLayoutClient } from "@/components/dashboard-layout-client";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return <LandingPage />;
  }

  return (
    <DashboardLayoutClient sidebar={<DashboardSidebar />}>
      <DashboardPage />
    </DashboardLayoutClient>
  );
}