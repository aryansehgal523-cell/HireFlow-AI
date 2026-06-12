import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createPortalSession } from "@/lib/stripe";
import { handleError } from "../../helpers";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const session = await createPortalSession(user.id, new URL(req.url).origin);
    return NextResponse.json({ url: session.url });
  } catch (e) {
    return handleError(e);
  }
}
