import Stripe from "stripe";
import { Plan } from "@prisma/client";
import { prisma } from "./prisma";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2024-06-20",
});

export const PRICE_TO_PLAN: Record<string, Plan> = {
  [process.env.STRIPE_PRICE_PRO ?? "price_pro"]: "PRO",
  [process.env.STRIPE_PRICE_EXPERT ?? "price_expert"]: "EXPERT",
};

export async function createCheckoutSession(userId: string, email: string, priceId: string, origin: string) {
  let sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) {
    const customer = await stripe.customers.create({ email, metadata: { userId } });
    sub = await prisma.subscription.create({
      data: { userId, stripeCustomerId: customer.id },
    });
  }
  return stripe.checkout.sessions.create({
    customer: sub.stripeCustomerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    subscription_data: { trial_period_days: 7, metadata: { userId } },
    success_url: `${origin}/dashboard?upgraded=1`,
    cancel_url: `${origin}/pricing`,
  });
}

export async function createPortalSession(userId: string, origin: string) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) throw new Error("No billing account.");
  return stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${origin}/settings/billing`,
  });
}

const STATUS_MAP: Record<string, "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED" | "INCOMPLETE"> = {
  active: "ACTIVE",
  trialing: "TRIALING",
  past_due: "PAST_DUE",
  canceled: "CANCELED",
  unpaid: "PAST_DUE",
  incomplete: "INCOMPLETE",
  incomplete_expired: "CANCELED",
  paused: "CANCELED",
};

/** Single source of truth: Stripe subscription -> our Subscription row + User.plan. */
export async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const sub = await prisma.subscription.findUnique({ where: { stripeCustomerId: customerId } });
  if (!sub) return;

  const priceId = subscription.items.data[0]?.price.id;
  const isLive = ["active", "trialing", "past_due"].includes(subscription.status);
  const plan: Plan = isLive ? PRICE_TO_PLAN[priceId ?? ""] ?? "FREE" : "FREE";

  await prisma.$transaction([
    prisma.subscription.update({
      where: { id: sub.id },
      data: {
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        status: STATUS_MAP[subscription.status] ?? "INCOMPLETE",
        plan,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      },
    }),
    prisma.user.update({ where: { id: sub.userId }, data: { plan } }),
  ]);
}
