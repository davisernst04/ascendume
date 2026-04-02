import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resumes, personalInfo, workExperience, education, skills, projects, certifications } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Experience, Education, Project, Certification } from "@/lib/resume-context";

// GET /api/resumes/[id] - Get a specific resume
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const resume = await db.query.resumes.findFirst({
      where: and(eq(resumes.id, id), eq(resumes.userId, session.user.id)),
      with: {
        personalInfo: true,
        workExperience: true,
        education: true,
        skills: true,
        projects: true,
        certifications: true,
      },
    });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    return NextResponse.json(resume);
  } catch (error) {
    console.error("Error fetching resume:", error);
    return NextResponse.json({ error: "Failed to fetch resume" }, { status: 500 });
  }
}

// PUT /api/resumes/[id] - Update a resume
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const existing = await db.query.resumes.findFirst({
      where: and(eq(resumes.id, id), eq(resumes.userId, session.user.id)),
    });

    if (!existing) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    const { title, personalInfoData, workExperienceData, educationData, skillsData, projectsData, certificationsData } = body;

    // Update resume title and timestamp
    await db.update(resumes)
      .set({ 
        title: title || existing.title,
        updatedAt: new Date(),
      })
      .where(eq(resumes.id, id));

    // Update personal info
    if (personalInfoData) {
      const existingPersonal = await db.query.personalInfo.findFirst({
        where: eq(personalInfo.resumeId, id),
      });
      
      if (existingPersonal) {
        await db.update(personalInfo)
          .set(personalInfoData)
          .where(eq(personalInfo.resumeId, id));
      } else {
        await db.insert(personalInfo).values({
          resumeId: id,
          ...personalInfoData,
        });
      }
    }

    // Update work experience (delete and recreate)
    if (workExperienceData !== undefined) {
      await db.delete(workExperience).where(eq(workExperience.resumeId, id));
      if (workExperienceData?.length) {
        await db.insert(workExperience).values(
          workExperienceData.map((exp: Experience, index: number) => ({
            resumeId: id,
            company: exp.company,
            position: exp.position,
            startDate: exp.startDate,
            endDate: exp.endDate,
            current: exp.current,
            bullets: exp.bullets,
            order: index,
          }))
        );
      }
    }

    // Update education
    if (educationData !== undefined) {
      await db.delete(education).where(eq(education.resumeId, id));
      if (educationData?.length) {
        await db.insert(education).values(
          educationData.map((edu: Education, index: number) => ({
            resumeId: id,
            institution: edu.institution,
            degree: edu.degree,
            field: edu.field,
            gpa: edu.gpa,
            graduationDate: edu.graduationDate,
            order: index,
          }))
        );
      }
    }

    // Update skills
    if (skillsData) {
      const existingSkills = await db.query.skills.findFirst({
        where: eq(skills.resumeId, id),
      });
      
      if (existingSkills) {
        await db.update(skills)
          .set(skillsData)
          .where(eq(skills.resumeId, id));
      } else {
        await db.insert(skills).values({
          resumeId: id,
          ...skillsData,
        });
      }
    }

    // Update projects
    if (projectsData !== undefined) {
      await db.delete(projects).where(eq(projects.resumeId, id));
      if (projectsData?.length) {
        await db.insert(projects).values(
          projectsData.map((proj: Project, index: number) => ({
            resumeId: id,
            name: proj.name,
            url: proj.url,
            technologies: proj.technologies,
            description: proj.description,
            order: index,
          }))
        );
      }
    }

    // Update certifications
    if (certificationsData !== undefined) {
      await db.delete(certifications).where(eq(certifications.resumeId, id));
      if (certificationsData?.length) {
        await db.insert(certifications).values(
          certificationsData.map((cert: Certification, index: number) => ({
            resumeId: id,
            name: cert.name,
            issuer: cert.issuer,
            date: cert.date,
            credentialUrl: cert.credentialUrl,
            order: index,
          }))
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating resume:", error);
    return NextResponse.json({ error: "Failed to update resume" }, { status: 500 });
  }
}

// DELETE /api/resumes/[id] - Delete a resume
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existing = await db.query.resumes.findFirst({
      where: and(eq(resumes.id, id), eq(resumes.userId, session.user.id)),
    });

    if (!existing) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    // Delete (cascade will handle related tables)
    await db.delete(resumes).where(eq(resumes.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting resume:", error);
    return NextResponse.json({ error: "Failed to delete resume" }, { status: 500 });
  }
}