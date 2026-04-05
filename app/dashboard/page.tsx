import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { resumes } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Download, Edit, Trash2 } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const userResumes = await db.query.resumes.findMany({
    where: eq(resumes.userId, session.user.id),
    orderBy: [desc(resumes.updatedAt)],
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-bold text-lg tracking-tighter">
              ascendume
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium">{session.user.name}</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Resumes</h1>
            <p className="text-muted-foreground mt-1">Manage and create your professional resumes.</p>
          </div>
          <Link href="/dashboard/new">
            <Button className="gap-2 font-bold shadow-lg shadow-primary/20 rounded-xl">
              <Plus className="w-4 h-4" />
              Create New
            </Button>
          </Link>
        </div>

        {userResumes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-border rounded-xl bg-muted/20">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold">No resumes yet</h3>
            <p className="text-muted-foreground mt-2 mb-6 max-w-sm text-center">
              You haven&apos;t created any resumes. Start building your career profile today.
            </p>
            <Link href="/dashboard/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create your first resume
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userResumes.map((resume) => (
              <Card key={resume.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="truncate">{resume.title}</span>
                  </CardTitle>
                  <CardDescription>
                    Last updated {new Date(resume.updatedAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  {/* Future: mini preview or stats here */}
                  <div className="bg-muted/30 aspect-[8.5/11] rounded-md border border-border w-1/3 flex items-center justify-center overflow-hidden">
                    <FileText className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2 pt-4 border-t border-border">
                  <Link href={`/builder/${resume.id}`} className="flex-1">
                    <Button variant="outline" className="w-full gap-2">
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                  </Link>
                  <Button variant="outline" size="icon" className="shrink-0" title="Download PDF">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="shrink-0 text-destructive hover:bg-destructive/10" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
