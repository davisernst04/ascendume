import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { headers } from "next/headers";
import { put } from "@vercel/blob";
import PDFParser from "pdf2json";
import { generateText, Output } from "ai";
import { parseModel } from "@/lib/ai/models";
import { LIMIT_MESSAGES, refundAiUse, takeAiUse } from "@/lib/ai/usage";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { 
  resumes, 
  personalInfo, 
  workExperience, 
  education, 
  skillCategories,
  projects, 
  certifications 
} from "@/lib/db/schema";

export const maxDuration = 60;

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

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
  skills: z.array(z.object({
    label: z.string().describe("Category label exactly as the resume names it, e.g. 'Languages' or 'Lab Techniques'. Empty string if the resume lists skills without a label."),
    items: z.string().describe("Comma-separated skills in this category"),
  })),
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
    const session = await getServerSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Resume import is not available yet." }, { status: 503 });
    }

    const db = getDb();

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Upload a PDF." }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "That PDF is over 5 MB. Export a smaller one and try again." }, { status: 413 });
    }

    // 1. Extract text
    const buffer = Buffer.from(await file.arrayBuffer());
    const rawText = await new Promise<string>((resolve, reject) => {
      const pdfParser = new PDFParser(undefined, true);
      pdfParser.on("pdfParser_dataError", (errData: { parserError: Error } | Error) => reject(errData instanceof Error ? errData : errData.parserError));
      pdfParser.on("pdfParser_dataReady", () => {
        resolve(pdfParser.getRawTextContent());
      });
      pdfParser.parseBuffer(buffer);
    });

    if (rawText.replace(/-+Page \(\d+\) Break-+/g, "").trim().length < 50) {
      return NextResponse.json(
        { error: "We couldn't find any text in that PDF. It may be a scanned image; export it from Word or Google Docs instead." },
        { status: 422 }
      );
    }

    // 2. Keep the original file (optional — requires BLOB_READ_WRITE_TOKEN)
    let blobUrl: string | null = null;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(file.name, file, { access: 'private', addRandomSuffix: true });
      blobUrl = blob.url;
    }

    // 3. AI Parsing (counts toward the daily import cap; refunded if it fails)
    if (!(await takeAiUse(session.user.id, "import"))) {
      return NextResponse.json({ error: LIMIT_MESSAGES.import }, { status: 429 });
    }
    let object: z.infer<typeof resumeSchema>;
    try {
      ({ output: object } = await generateText({
        model: parseModel(),
        output: Output.object({ schema: resumeSchema }),
        prompt: `Parse the following raw resume text into the structured schema provided. Extract as much detail as possible. Ensure bullets are cleanly formatted with bullet characters or separated by newlines.
      Raw Text:
      ---
      ${rawText}
      ---`,
      }));
    } catch (error) {
      await refundAiUse(session.user.id, "import");
      throw error;
    }

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

    if (object.skills.length > 0) {
      await db.insert(skillCategories).values(
        object.skills.map((cat, i) => ({
          resumeId: newResume.id,
          label: cat.label,
          items: cat.items,
          order: i,
        }))
      );
    }

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
    return NextResponse.json({ error: "We couldn't read that PDF. Try exporting it again." }, { status: 500 });
  }
}
