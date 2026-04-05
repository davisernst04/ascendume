import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { resumes } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { SidebarUserButton } from "@/components/sidebar-user-button";

export async function DashboardSidebar() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  const userResumes = await db.query.resumes.findMany({
    where: eq(resumes.userId, session.user.id),
    orderBy: [desc(resumes.updatedAt)],
  });

  return (
    <div className="w-64 bg-zinc-950 text-zinc-300 flex flex-col h-full border-r border-zinc-800 shrink-0">
      <div className="p-4">
        <Link href="/dashboard" className="block">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 hover:text-zinc-50 border border-zinc-800 h-10 px-3"
          >
            <Plus className="h-4 w-4" />
            <span className="font-medium">New Resume</span>
          </Button>
        </Link>
      </div>

      <div className="flex-1 px-3 overflow-y-auto overflow-x-hidden">
        <div className="space-y-1 pb-4">
          <p className="px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Recent Resumes
          </p>
          {userResumes.map((resume) => (
            <Link key={resume.id} href={`/builder/${resume.id}`}>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-10 px-2 font-normal text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50 truncate"
              >
                <FileText className="h-4 w-4 shrink-0 text-zinc-500" />
                <span className="truncate">{resume.title || "Untitled Resume"}</span>
              </Button>
            </Link>
          ))}
          {userResumes.length === 0 && (
            <div className="px-2 py-4 text-sm text-zinc-500 text-center">
              No resumes yet
            </div>
          )}
        </div>
      </div>

      <div className="p-3 border-t border-zinc-800">
        <SidebarUserButton session={session} />
      </div>
    </div>
  );
}
