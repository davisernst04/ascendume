import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resumes, personalInfo, workExperience, education, skills, projects, certifications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/resumes - Get all resumes for the current user
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: new Headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userResumes = await db.query.resumes.findMany({
      where: eq(resumes.userId, session.user.id),
      with: {
        personalInfo: true,
        workExperience: true,
        education: true,
        skills: true,
        projects: true,
        certifications: true,
      },
      orderBy: (resumes, { desc }) => [desc(resumes.updatedAt)],
    });

    return NextResponse.json(userResumes);
  } catch (error) {
    console.error("Error fetching resumes:", error);
    return NextResponse.json({ error: "Failed to fetch resumes" }, { status: 500 });
  }
}

// POST /api/resumes - Create a new resume
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: new Headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, personalInfoData, workExperienceData, educationData, skillsData, projectsData, certificationsData } = body;

    // Create resume
    const [resume] = await db.insert(resumes).values({
      userId: session.user.id,
      title: title || "My Resume",
    }).returning();

    // Create personal info
    if (personalInfoData) {
      await db.insert(personalInfo).values({
        resumeId: resume.id,
        ...personalInfoData,
      });
    } else {
      await db.insert(personalInfo).values({ resumeId: resume.id });
    }

    // Create work experience
    if (workExperienceData?.length) {
      await db.insert(workExperience).values(
        workExperienceData.map((exp: any, index: number) => ({
          resumeId: resume.id,
          ...exp,
          order: index,
        }))
      );
    }

    // Create education
    if (educationData?.length) {
      await db.insert(education).values(
        educationData.map((edu: any, index: number) => ({
          resumeId: resume.id,
          ...edu,
          order: index,
        }))
      );
    }

    // Create skills
    if (skillsData) {
      await db.insert(skills).values({
        resumeId: resume.id,
        ...skillsData,
      });
    } else {
      await db.insert(skills).values({ resumeId: resume.id });
    }

    // Create projects
    if (projectsData?.length) {
      await db.insert(projects).values(
        projectsData.map((proj: any, index: number) => ({
          resumeId: resume.id,
          ...proj,
          order: index,
        }))
      );
    }

    // Create certifications
    if (certificationsData?.length) {
      await db.insert(certifications).values(
        certificationsData.map((cert: any, index: number) => ({
          resumeId: resume.id,
          ...cert,
          order: index,
        }))
      );
    }

    return NextResponse.json(resume, { status: 201 });
  } catch (error) {
    console.error("Error creating resume:", error);
    return NextResponse.json({ error: "Failed to create resume" }, { status: 500 });
  }
}