import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { razorpay } from "@/lib/razorpay";

export async function GET() {
  try {
    await requireUser();

    const results: Record<string, unknown> = {
      keyId:      process.env.RAZORPAY_KEY_ID ? "✓ set" : "✗ MISSING",
      keySecret:  process.env.RAZORPAY_KEY_SECRET ? "✓ set" : "✗ MISSING",
      planPro:    process.env.RAZORPAY_PLAN_PRO ?? "✗ MISSING",
      planExpert: process.env.RAZORPAY_PLAN_EXPERT ?? "✗ MISSING",
    };

    // Try fetching plan PRO
    try {
      const plan = await (razorpay.plans as any).fetch(process.env.RAZORPAY_PLAN_PRO);
      results.planProStatus = `✓ found: ${plan.item?.name} (${plan.item?.amount / 100} ${plan.item?.unit_amount ? "" : plan.currency})`;
    } catch (e: any) {
      results.planProStatus = `✗ ${e?.error?.description ?? e?.message ?? "fetch failed"}`;
    }

    // Try fetching plan EXPERT
    try {
      const plan = await (razorpay.plans as any).fetch(process.env.RAZORPAY_PLAN_EXPERT);
      results.planExpertStatus = `✓ found: ${plan.item?.name}`;
    } catch (e: any) {
      results.planExpertStatus = `✗ ${e?.error?.description ?? e?.message ?? "fetch failed"}`;
    }

    return NextResponse.json(results);
  } catch (e: any) {
    return NextResponse.json({ auth: `✗ ${e?.message}` }, { status: 401 });
  }
}
