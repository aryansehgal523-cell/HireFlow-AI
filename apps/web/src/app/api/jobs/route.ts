import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleError } from "../helpers";

export async function GET(req: Request) {
  try {
    await requireUser();
    const url = new URL(req.url);
    const q = url.searchParams.get("q") ?? undefined;
    const remote = url.searchParams.get("remote") === "1";

    const jobs = await prisma.job.findMany({
      where: {
        isActive: true,
        ...(remote ? { remote: true } : {}),
        ...(q ? { OR: [
          { title: { contains: q, mode: "insensitive" } },
          { company: { contains: q, mode: "insensitive" } },
          { extractedSkills: { has: q } },
        ]} : {}),
      },
      orderBy: { postedAt: "desc" },
      take: 100,
      select: {
        id: true, title: true, company: true, location: true, remote: true,
        url: true, extractedSkills: true, postedAt: true, source: true,
        salaryMin: true, salaryMax: true, currency: true, description: true,
      },
    });

    return NextResponse.json({ jobs });
  } catch (e) {
    return handleError(e);
  }
}
