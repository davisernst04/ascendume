import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getServerSession } from "@/lib/auth";
import { ReviewUpload } from "@/components/review/review-upload";

// "Review my resume": upload → parse → builder → review. Parsing runs on the
// server with the AI, so it needs an account.
export default async function ReviewPage() {
  const session = await getServerSession({ headers: await headers() });
  if (!session?.user) redirect("/auth/sign-up?next=/review");
  return <ReviewUpload />;
}
