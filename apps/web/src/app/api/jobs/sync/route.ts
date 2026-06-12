import { NextResponse } from "next/server";
import { syncConfiguredBoards } from "@/lib/jobs";
import { requireUser } from "@/lib/auth";
import { handleError } from "../../helpers";

export async function POST(req: Request) {
  if (req.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const result = await syncConfiguredBoards();
  return NextResponse.json(result);
}

export async function GET() {
  try {
    await requireUser();
    const result = await syncConfiguredBoards();
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}
