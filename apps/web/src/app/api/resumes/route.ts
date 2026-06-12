import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { consume } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";
import { scoreResume, type ResumeContent } from "@hireflow/ats-engine";
import { handleError, parseBody } from "../helpers";

export async function GET() {
  try {
    const user = await requireUser();
    const resumes = await prisma.resume.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, template: true, atsScore: true, updatedAt: true },
    });
    return NextResponse.json({ resumes });
  } catch (e) {
    return handleError(e);
  }
}

const createSchema = z.object({ title: z.string().min(1).max(120), content: z.any() });

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    await consume(user, "ats_basic", "resumesGenerated");
    const { title, content } = await parseBody(req, createSchema);
    const ats = scoreResume(content as ResumeContent);
    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        title,
        content,
        atsScore: ats.overall,
        atsBreakdown: ats.breakdown as any,
        isWatermarked: user.plan === "FREE",
      },
    });
    return NextResponse.json({ resume }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
