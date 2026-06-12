import Razorpay from "razorpay";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export const PLANS = {
  PRO: {
    planId: process.env.RAZORPAY_PLAN_PRO!,
    amount: 149900,
    currency: "INR",
    label: "₹1,499/mo",
    name: "HireFlow Pro",
  },
  EXPERT: {
    planId: process.env.RAZORPAY_PLAN_EXPERT!,
    amount: 299900,
    currency: "INR",
    label: "₹2,999/mo",
    name: "HireFlow Expert",
  },
} as const;
