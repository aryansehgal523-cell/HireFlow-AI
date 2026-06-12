import { NextResponse } from "next/server";
import { z } from "zod";
import { scoreResume, type ResumeContent } from "@hireflow/ats-engine";
import { requireUser } from "@/lib/auth";
import { consume } from "@/lib/entitlements";
import { handleError, parseBody } from "../../helpers";

const schema = z.object({
  resume: z.any(), // validated structurally by the engine
  jobDescription: z.string().max(20000).optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    await consume(user, "ats_basic", "atsScans");
    const { resume, jobDescription } = await parseBody(req, schema);
    const result = scoreResume(resume as ResumeContent, jobDescription);
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}
