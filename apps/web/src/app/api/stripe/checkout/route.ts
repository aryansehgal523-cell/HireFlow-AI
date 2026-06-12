import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createCheckoutSession } from "@/lib/stripe";
import { handleError, parseBody } from "../../helpers";

const schema = z.object({ plan: z.enum(["PRO", "EXPERT"]) });

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { plan } = await parseBody(req, schema);
    const priceId = plan === "PRO" ? process.env.STRIPE_PRICE_PRO! : process.env.STRIPE_PRICE_EXPERT!;
    const origin = new URL(req.url).origin;
    const session = await createCheckoutSession(user.id, user.email, priceId, origin);
    return NextResponse.json({ url: session.url });
  } catch (e) {
    return handleError(e);
  }
}
