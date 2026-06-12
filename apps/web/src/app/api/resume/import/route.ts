import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { chat } from "@/lib/ai";
import { handleError } from "../../helpers";

export const maxDuration = 60;

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
  const data = await pdfParse(buffer);
  return data.text;
}

const PARSE_PROMPT = `You are an expert resume parser. Extract structured data from the following resume text.

Return ONLY a valid JSON object with this exact structure (omit sections that have no data):
{
  "basics": {
    "name": "",
    "email": "",
    "phone": "",
    "location": "",
    "headline": "",
    "linkedin": "",
    "github": "",
    "website": ""
  },
  "summary": "",
  "experience": [
    {
      "title": "",
      "company": "",
      "location": "",
      "start": "",
      "end": "",
      "bullets": [""]
    }
  ],
  "education": [
    {
      "school": "",
      "degree": "",
      "field": "",
      "start": "",
      "end": "",
      "gpa": ""
    }
  ],
  "skills": [""],
  "projects": [
    {
      "name": "",
      "url": "",
      "start": "",
      "end": "",
      "bullets": [""]
    }
  ],
  "certifications": [
    {
      "name": "",
      "issuer": "",
      "date": ""
    }
  ],
  "languages": [
    {
      "language": "",
      "proficiency": ""
    }
  ],
  "awards": [
    {
      "title": "",
      "issuer": "",
      "date": "",
      "description": ""
    }
  ]
}

Rules:
- Extract ALL bullet points verbatim
- Keep dates in the format found (e.g. "Jan 2022", "2021", "2020-2023")
- For "end", use "Present" if current role
- Skills should be a flat array of individual skill names
- Return only the JSON, no markdown, no explanation`;

export async function POST(req: Request) {
  try {
    await requireUser();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|txt)$/i)) {
      return NextResponse.json({ error: "Only PDF, DOCX, or TXT files are supported" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let text = "";

    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      text = await extractTextFromPDF(buffer);
    } else {
      text = buffer.toString("utf-8");
    }

    if (!text || text.trim().length < 50) {
      return NextResponse.json({ error: "Could not extract text from file. Try copying your resume as plain text." }, { status: 422 });
    }

    const truncated = text.slice(0, 12000);

    const result = await chat(
      "resume_import",
      PARSE_PROMPT,
      `Resume text:\n\n${truncated}`,
      2000
    );

    let parsed: Record<string, unknown>;
    try {
      const clean = result.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(clean);
    } catch (_e) {
      return NextResponse.json({ error: "AI could not parse the resume structure. Try a different file." }, { status: 422 });
    }

    return NextResponse.json({ resume: parsed });
  } catch (e) {
    return handleError(e);
  }
}
