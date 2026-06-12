import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleError } from "../../helpers";
import { ApplicationStatus } from "@prisma/client";

type UIStatus = "wishlist" | "applied" | "phone" | "interview" | "offer" | "rejected";

function uiToDb(s: UIStatus): ApplicationStatus {
  const map: Record<UIStatus, ApplicationStatus> = {
    wishlist:  ApplicationStatus.DRAFT,
    applied:   ApplicationStatus.SUBMITTED,
    phone:     ApplicationStatus.VIEWED,
    interview: ApplicationStatus.INTERVIEW,
    offer:     ApplicationStatus.OFFER,
    rejected:  ApplicationStatus.REJECTED,
  };
  return map[s] ?? ApplicationStatus.DRAFT;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const body = await req.json();

    const existing = await prisma.application.findFirst({
      where: { id: params.id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let meta: Record<string, string> = {};
    try { meta = JSON.parse(existing.notes ?? "{}"); } catch {}

    if (body.meta) Object.assign(meta, body.meta);

    await prisma.application.update({
      where: { id: params.id },
      data: {
        ...(body.status ? { status: uiToDb(body.status as UIStatus) } : {}),
        notes: JSON.stringify(meta),
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    await prisma.application.deleteMany({
      where: { id: params.id, userId: user.id },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
