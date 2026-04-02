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
    fullName: z.string().default(""),
    email: z.string().default(""),
    phone: z.string().default(""),
    location: z.string().default(""),
    summary: z.string().default(""),
    website: z.string().default(""),
    linkedin: z.string().default(""),
    github: z.string().default(""),
  }),
  experience: z.array(z.object({
    company: z.string().default(""),
    position: z.string().default(""),
    startDate: z.string().default(""),
    endDate: z.string().default(""),
    current: z.boolean().default(false),
    bullets: z.string().default(""),
  })),
  education: z.array(z.object({
    institution: z.string().default(""),
    degree: z.string().default(""),
    field: z.string().default(""),
    gpa: z.string().default(""),
    graduationDate: z.string().default(""),
  })),
  skills: z.object({
    technical: z.string().default(""),
    frameworks: z.string().default(""),
    tools: z.string().default(""),
  }),
  projects: z.array(z.object({
    name: z.string().default(""),
    url: z.string().default(""),
    technologies: z.string().default(""),
    description: z.string().default(""),
  })),
  certifications: z.array(z.object({
    name: z.string().default(""),
    issuer: z.string().default(""),
    date: z.string().default(""),
    credentialUrl: z.string().default(""),
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

    // 1. Upload to Blob
    const blob = await put(file.name, file, { access: 'public' });

    // 2. Extract Text
    let rawText = "";
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      const buffer = Buffer.from(await file.arrayBuffer());
      
      rawText = await new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null as any, true);
        pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError || errData));
        pdfParser.on("pdfParser_dataReady", () => {
          resolve((pdfParser as any).getRawTextContent());
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
      originalFileUrl: blob.url,
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
    console.error("Parse Error:", error);
    return NextResponse.json({ error: "Failed to parse resume" }, { status: 500 });
  }
}
