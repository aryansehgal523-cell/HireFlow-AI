import { NextResponse } from "next/server";
import { syncConfiguredBoards } from "@/lib/jobs";

// Cron endpoint (Vercel Cron / GitHub Actions). Protected by a shared secret.
export async function POST(req: Request) {
  if (req.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const result = await syncConfiguredBoards();
  return NextResponse.json(result);
}
