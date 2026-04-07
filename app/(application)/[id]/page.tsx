import ResumeBuilder from "@/components/ResumeBuilder";
import { use } from "react";

export default function BuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ResumeBuilder resumeId={id} />;
}
