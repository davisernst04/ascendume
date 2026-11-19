import { redirect } from "next/navigation";
import { headers } from "next/headers";
import ResumeBuilder from "@/components/ResumeBuilder";
import { getServerSession } from "@/lib/auth";

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession({ headers: await headers() });
  if (!session?.user) redirect(`/auth/sign-in?next=${encodeURIComponent(`/${id}`)}`);

  return <ResumeBuilder resumeId={id} />;
}
