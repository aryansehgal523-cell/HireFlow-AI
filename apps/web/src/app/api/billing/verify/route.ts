import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleError, parseBody } from "../../helpers";

const schema = z.object({
  subscriptionId: z.string(),
  paymentId:      z.string(),
  signature:      z.string(),
  plan:           z.enum(["PRO", "EXPERT"]),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { subscriptionId, paymentId, signature, plan } = await parseBody(req, schema);

    // Razorpay subscription signature: HMAC-SHA256(paymentId + "|" + subscriptionId)
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${paymentId}|${subscriptionId}`)
      .digest("hex");

    if (expected !== signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { plan },
    });

    return NextResponse.json({ success: true, plan });
  } catch (e) {
    return handleError(e);
  }
}
