import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { razorpay, PLANS } from "@/lib/razorpay";
import { handleError, parseBody } from "../../helpers";

const schema = z.object({
  plan: z.enum(["PRO", "EXPERT"]),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { plan } = await parseBody(req, schema);
    const p = PLANS[plan];

    let subscription: { id: string };
    try {
      subscription = await (razorpay.subscriptions.create as any)({
        plan_id: p.planId,
        total_count: 12,
        quantity: 1,
        customer_notify: 1,
        notes: { userId: user.id, plan },
      });
    } catch (rzpErr: any) {
      const msg = rzpErr?.error?.description ?? rzpErr?.message ?? "Razorpay error";
      console.error("[billing/order] Razorpay error:", rzpErr);
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    return NextResponse.json({ subscriptionId: subscription.id });
  } catch (e) {
    return handleError(e);
  }
}
