import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { consume, recordAiUsage } from "@/lib/entitlements";
import { chat, coverLetterPrompt } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { handleError, parseBody } from "../../helpers";

const schema = z.object({
  resumeText: z.string().min(50).max(20000),
  jobDescription: z.string().min(50).max(20000),
  company: z.string().min(1).max(120),
  tone: z.enum(["professional", "executive", "startup", "confident", "formal"]).default("professional"),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    await consume(user, "cover_letter", "coverLettersGenerated");
    const body = await parseBody(req, schema);
    const p = coverLetterPrompt({ resumeText: body.resumeText, jd: body.jobDescription, company: body.company, tone: body.tone });
    const result = await chat("cover_letter", p.system, p.user, 900);
    await recordAiUsage(user.id, "cover_letter", result.model, result.inputTokens, result.outputTokens);
    const saved = await prisma.coverLetter.create({
      data: { userId: user.id, title: `${body.company} cover letter`, body: result.text, tone: body.tone },
    });
    return NextResponse.json({ id: saved.id, body: result.text });
  } catch (e) {
    return handleError(e);
  }
}
