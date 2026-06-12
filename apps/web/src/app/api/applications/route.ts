import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleError } from "../helpers";
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

function dbToUI(s: ApplicationStatus): UIStatus {
  const map: Record<ApplicationStatus, UIStatus> = {
    DRAFT:      "wishlist",
    QUEUED:     "applied",
    SUBMITTED:  "applied",
    VIEWED:     "phone",
    INTERVIEW:  "interview",
    OFFER:      "offer",
    REJECTED:   "rejected",
    WITHDRAWN:  "rejected",
  };
  return map[s] ?? "wishlist";
}

export async function GET() {
  try {
    const user = await requireUser();
    const apps = await prisma.application.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      applications: apps.map(app => {
        let meta: Record<string, string> = {};
        try { meta = JSON.parse(app.notes ?? "{}"); } catch {}
        return {
          id: app.id,
          company:  meta.company  ?? "",
          role:     meta.role     ?? "",
          salary:   meta.salary   ?? "",
          url:      meta.url      ?? "",
          notes:    meta.userNotes ?? "",
          status:   dbToUI(app.status),
          date:     (app.appliedAt ?? app.createdAt).toISOString().slice(0, 10),
        };
      }),
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { company, role, salary, url, notes, status = "wishlist" } = body;

    if (!company || !role) {
      return NextResponse.json({ error: "Company and role are required" }, { status: 400 });
    }

    const app = await prisma.application.create({
      data: {
        userId:    user.id,
        status:    uiToDb(status as UIStatus),
        source:    "manual",
        appliedAt: status !== "wishlist" ? new Date() : null,
        notes:     JSON.stringify({ company, role, salary: salary ?? "", url: url ?? "", userNotes: notes ?? "" }),
      },
    });

    return NextResponse.json({ id: app.id });
  } catch (e) {
    return handleError(e);
  }
}
