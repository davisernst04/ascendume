import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { put } from "@vercel/blob";
import PDFParser from "pdf2json";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { db } from "@/lib/db";
import { 
  resumes, 
  personalInfo, 
  workExperience, 
  education, 
  skills, 
  projects, 
  certifications 
} from "@/lib/db/schema";

// Disable body parser for file uploads
export const maxDuration = 60;

const resumeSchema = z.object({
  personalInfo: z.object({
    fullName: z.string(),
    email: z.string(),
    phone: z.string(),
    location: z.string(),
    summary: z.string(),
    website: z.string(),
    linkedin: z.string(),
    github: z.string(),
  }),
  experience: z.array(z.object({
    company: z.string(),
    position: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    current: z.boolean(),
    bullets: z.string(),
  })),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    field: z.string(),
    gpa: z.string(),
    graduationDate: z.string(),
  })),
  skills: z.object({
    technical: z.string(),
    frameworks: z.string(),
    tools: z.string(),
  }),
  projects: z.array(z.object({
    name: z.string(),
    url: z.string(),
    technologies: z.string(),
    description: z.string(),
  })),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string(),
    date: z.string(),
    credentialUrl: z.string(),
  })),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 1. Upload to Blob (optional — requires BLOB_READ_WRITE_TOKEN)
    let blobUrl: string | null = null;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(file.name, file, { access: 'private', addRandomSuffix: true });
      blobUrl = blob.url;
    }

    // 2. Extract Text
    let rawText = "";
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      const buffer = Buffer.from(await file.arrayBuffer());
      
      rawText = await new Promise<string>((resolve, reject) => {
        const pdfParser = new PDFParser(undefined, true);
        pdfParser.on("pdfParser_dataError", (errData: { parserError: Error } | Error) => reject(errData instanceof Error ? errData : errData.parserError));
        pdfParser.on("pdfParser_dataReady", () => {
          resolve(pdfParser.getRawTextContent());
        });
        pdfParser.parseBuffer(buffer);
      });
    } else {
      rawText = await file.text(); 
    }

    // 3. AI Parsing
    const { object } = await generateObject({
      model: openai('gpt-4o'),
      schema: resumeSchema,
      prompt: `Parse the following raw resume text into the structured schema provided. Extract as much detail as possible. Ensure bullets are cleanly formatted with bullet characters or separated by newlines. 
      Raw Text:
      ---
      ${rawText}
      ---`,
    });

    // 4. Save to Database
    const [newResume] = await db.insert(resumes).values({
      userId: session.user.id,
      title: `${object.personalInfo.fullName || "My"} Resume`,
      ...(blobUrl ? { originalFileUrl: blobUrl } : {}),
    }).returning({ id: resumes.id });

    // Insert sub-tables
    await db.insert(personalInfo).values({
      resumeId: newResume.id,
      ...object.personalInfo
    });

    if (object.experience.length > 0) {
      await db.insert(workExperience).values(
        object.experience.map((exp, i) => ({
          resumeId: newResume.id,
          ...exp,
          order: i,
        }))
      );
    }

    if (object.education.length > 0) {
      await db.insert(education).values(
        object.education.map((edu, i) => ({
          resumeId: newResume.id,
          ...edu,
          order: i,
        }))
      );
    }

    await db.insert(skills).values({
      resumeId: newResume.id,
      ...object.skills
    });

    if (object.projects.length > 0) {
      await db.insert(projects).values(
        object.projects.map((proj, i) => ({
          resumeId: newResume.id,
          ...proj,
          order: i,
        }))
      );
    }

    if (object.certifications.length > 0) {
      await db.insert(certifications).values(
        object.certifications.map((cert, i) => ({
          resumeId: newResume.id,
          ...cert,
          order: i,
        }))
      );
    }

    return NextResponse.json({ resumeId: newResume.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Parse Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
