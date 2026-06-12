"use client";

import { useState } from "react";

declare global {
  interface Window { Razorpay: any }
}

interface Props {
  plan: "PRO" | "EXPERT";
  label: string;
  className?: string;
}

function loadScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function CheckoutButton({ plan, label, className = "" }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setError(null);
    try {
      const ready = await loadScript();
      if (!ready) throw new Error("Payment gateway failed to load. Check your connection.");

      // Create subscription on server
      const res = await fetch("/api/billing/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) { window.location.href = "/sign-in"; return; }
      if (!res.ok) throw new Error(data.error ?? "Could not start subscription. Please try again.");
      const { subscriptionId } = data;

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          subscription_id: subscriptionId,
          name: "HireFlow AI",
          description: `${plan === "PRO" ? "Pro" : "Expert"} Plan — Monthly`,
          theme: { color: "#16a34a" },
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_subscription_id: string;
            razorpay_signature: string;
          }) => {
            try {
              const vRes = await fetch("/api/billing/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  subscriptionId: response.razorpay_subscription_id,
                  paymentId:      response.razorpay_payment_id,
                  signature:      response.razorpay_signature,
                  plan,
                }),
              });
              if (!vRes.ok) throw new Error("Payment verification failed. Contact support.");
              window.location.href = "/dashboard?upgraded=true";
              resolve();
            } catch (e: any) {
              reject(new Error(e.message));
            }
          },
          modal: { ondismiss: () => resolve() },
        });
        rzp.open();
      });
    } catch (e: any) {
      setError(e.message ?? "Payment failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full">
      <button onClick={handleClick} disabled={busy} className={`w-full ${className}`}>
        {busy ? "Processing…" : label}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-500 text-center leading-snug">{error}</p>
      )}
    </div>
  );
}
