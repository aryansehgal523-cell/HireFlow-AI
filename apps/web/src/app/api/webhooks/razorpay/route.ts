import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const incomingSig = req.headers.get("x-razorpay-signature") ?? "";
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (secret) {
      const expected = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");
      if (expected !== incomingSig) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    }

    const event = JSON.parse(body);
    const entity = event?.payload?.payment?.entity ?? event?.payload?.subscription?.entity;

    switch (event.event) {
      case "payment.captured": {
        const notes = entity?.notes ?? {};
        if (notes.userId && notes.plan) {
          await prisma.user.update({
            where: { id: notes.userId },
            data: { plan: notes.plan },
          });
        }
        break;
      }
      case "subscription.cancelled":
      case "subscription.halted": {
        const notes = entity?.notes ?? {};
        if (notes.userId) {
          await prisma.user.update({
            where: { id: notes.userId },
            data: { plan: "FREE" },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("Razorpay webhook error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
