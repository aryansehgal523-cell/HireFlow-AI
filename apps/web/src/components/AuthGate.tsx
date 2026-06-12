"use client";

import Link from "next/link";

interface Props {
  title: string;
  description: string;
  features: string[];
  returnPath: string;
}

export function AuthGate({ title, description, features, returnPath }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
      <div className="card max-w-md w-full p-8 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-signalSoft text-signal text-2xl mb-5 mx-auto">
          🔒
        </div>
        <h1 className="font-display text-xl font-bold mb-2">{title}</h1>
        <p className="text-sm text-ink/60 mb-6 leading-relaxed">{description}</p>

        <ul className="text-left space-y-2 mb-7">
          {features.map(f => (
            <li key={f} className="flex items-start gap-2 text-sm text-ink/70">
              <span className="text-signal mt-0.5 shrink-0">✓</span>
              {f}
            </li>
          ))}
        </ul>

        <div className="space-y-2">
          <Link
            href={`/sign-in?redirect_url=${encodeURIComponent(returnPath)}`}
            className="btn-primary w-full block text-center"
          >
            Sign in to continue
          </Link>
          <Link
            href={`/sign-up?redirect_url=${encodeURIComponent(returnPath)}`}
            className="btn-ghost w-full block text-center"
          >
            Create free account
          </Link>
        </div>

        <p className="mt-5 text-xs text-ink/40">Free forever plan available · No credit card required</p>
      </div>
    </div>
  );
}
