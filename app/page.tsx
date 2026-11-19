import { getServerSession } from "@/lib/auth";
import { headers } from "next/headers";
import LandingPage from "./(marketing)/landing-page";
import DashboardPage from "./(application)/dashboard-page";
import { AppFrame } from "@/components/app-header";

export default async function HomePage() {
  const session = await getServerSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return <LandingPage />;
  }

  return (
    <AppFrame user={{ name: session.user.name, email: session.user.email }}>
      <DashboardPage userId={session.user.id} />
    </AppFrame>
  );
}
