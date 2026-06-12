import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scoreResume, type ResumeContent } from "@hireflow/ats-engine";
import { handleError, parseBody } from "../../helpers";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const resume = await prisma.resume.findFirst({ where: { id: params.id, userId: user.id } });
    if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ resume });
  } catch (e) {
    return handleError(e);
  }
}

const patchSchema = z.object({ title: z.string().min(1).max(120).optional(), content: z.any().optional() });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const existing = await prisma.resume.findFirst({ where: { id: params.id, userId: user.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const body = await parseBody(req, patchSchema);

    // Snapshot a version before overwriting content
    if (body.content) {
      await prisma.resumeVersion.create({
        data: { resumeId: existing.id, content: existing.content as any, atsScore: existing.atsScore, label: "Auto-snapshot" },
      });
    }
    const ats = body.content ? scoreResume(body.content as ResumeContent) : null;
    const resume = await prisma.resume.update({
      where: { id: existing.id },
      data: {
        ...(body.title ? { title: body.title } : {}),
        ...(body.content ? { content: body.content, atsScore: ats!.overall, atsBreakdown: ats!.breakdown as any } : {}),
      },
    });
    return NextResponse.json({ resume });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    await prisma.resume.deleteMany({ where: { id: params.id, userId: user.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
