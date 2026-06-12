"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function UpgradeBanner() {
  const params = useSearchParams();
  if (params.get("upgraded") !== "true") return null;
  return (
    <div className="mb-6 rounded-xl bg-signal/10 border border-signal/20 p-4 flex items-start gap-3">
      <span className="text-signal text-xl mt-0.5">✓</span>
      <div>
        <p className="font-semibold text-signal">Plan upgraded successfully!</p>
        <p className="text-sm text-ink/60 mt-0.5">Your new features are active — AI rewrites, unlimited ATS scans, and more.</p>
      </div>
    </div>
  );
}

interface ResumeRow {
  id: string;
  title: string;
  atsScore: number | null;
  updatedAt: string;
  template?: string;
}

const QUICK_ACTIONS = [
  { href: "/editor", label: "New resume", icon: "+" },
  { href: "/cover-letters", label: "Cover letter", icon: "✉" },
  { href: "/jobs", label: "Browse jobs", icon: "⬡" },
  { href: "/tracker", label: "Track apps", icon: "◈" },
  { href: "/interview", label: "Interview prep", icon: "◇" },
];

export default function Dashboard() {
  const [resumes, setResumes] = useState<ResumeRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/resumes")
      .then(async r => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "Failed to load");
        setResumes(d.resumes);
      })
      .catch(e => setError(e.message));

    const params = new URLSearchParams(window.location.search);
    const plan = params.get("checkout");
    if (plan === "PRO" || plan === "EXPERT") {
      fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan }),
      })
        .then(r => r.json())
        .then(d => { if (d.url) window.location.href = d.url; });
    }
  }, []);

  const avgScore = resumes?.length
    ? Math.round(resumes.reduce((s, r) => s + (r.atsScore ?? 0), 0) / resumes.length)
    : null;

  const highScore = resumes?.length
    ? Math.max(...resumes.map(r => r.atsScore ?? 0))
    : null;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Suspense fallback={null}>
        <UpgradeBanner />
      </Suspense>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-ink/50 mt-0.5">Your job search command center</p>
        </div>
        <Link href="/editor" className="btn-primary">+ New resume</Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { label: "Resumes", value: resumes?.length ?? "—", sub: "total saved" },
          { label: "Avg ATS score", value: avgScore ?? "—", sub: "across resumes" },
          { label: "Best score", value: highScore ?? "—", sub: "highest achieved" },
          { label: "Applications", value: "—", sub: "track in Tracker" },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className="text-xs text-ink/50 uppercase tracking-wide font-medium">{s.label}</p>
            <p className="font-mono text-3xl font-bold text-ink mt-1">{s.value}</p>
            <p className="text-xs text-ink/40 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="font-display text-sm font-semibold text-ink/50 uppercase tracking-widest mb-3">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map(a => (
            <Link key={a.href} href={a.href} className="btn-ghost text-sm gap-1.5">
              <span className="text-signal">{a.icon}</span> {a.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Resumes */}
      <div>
        <h2 className="font-display text-lg font-bold mb-4">Your resumes</h2>

        {error && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600 mb-4">
            {error}
            <span className="ml-2 text-xs text-ink/40">(Database not connected — start Docker and run migrations)</span>
          </div>
        )}

        {!resumes && !error && (
          <div className="flex items-center gap-2 text-sm text-ink/50 py-4">
            <span className="inline-block h-3 w-3 rounded-full bg-line animate-pulse" />
            Loading resumes…
          </div>
        )}

        {resumes && resumes.length === 0 && (
          <div className="card p-12 text-center">
            <div className="text-4xl mb-3">📄</div>
            <p className="font-display text-lg font-semibold">No resumes yet</p>
            <p className="mt-2 text-sm text-ink/60 max-w-xs mx-auto">
              Build your first resume — the live ATS score shows you exactly where you stand as you type.
            </p>
            <Link href="/editor" className="btn-primary mt-6 inline-flex">Open the editor →</Link>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resumes?.map(r => {
            const score = r.atsScore ?? 0;
            const scoreColor = score >= 80 ? "text-signal" : score >= 60 ? "text-amber" : "text-red-500";
            return (
              <div key={r.id} className="card p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium text-sm leading-snug">{r.title}</h3>
                  <span className={`font-mono text-2xl font-bold shrink-0 ${scoreColor}`}>
                    {r.atsScore ?? "—"}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-line mb-3">
                  {r.atsScore && (
                    <div
                      className={`h-1 rounded-full ${score >= 80 ? "bg-signal" : score >= 60 ? "bg-amber" : "bg-red-400"}`}
                      style={{ width: `${score}%` }}
                    />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-ink/40">
                    Updated {new Date(r.updatedAt).toLocaleDateString()}
                  </p>
                  <Link href={`/editor?id=${r.id}`} className="text-xs text-signal hover:underline">Edit →</Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Getting started checklist */}
      {resumes !== null && resumes.length === 0 && (
        <div className="mt-10 card p-6">
          <h2 className="font-display text-base font-bold mb-4">Getting started checklist</h2>
          <ul className="space-y-3">
            {[
              { done: false, label: "Build your first resume", href: "/editor" },
              { done: false, label: "Paste a job description to get your ATS score", href: "/editor" },
              { done: false, label: "Use AI to rewrite your weakest bullets", href: "/editor" },
              { done: false, label: "Generate a tailored cover letter", href: "/cover-letters" },
              { done: false, label: "Browse matched jobs", href: "/jobs" },
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <span className={`h-5 w-5 rounded-full border-2 flex items-center justify-center text-xs shrink-0 ${item.done ? "border-signal bg-signalSoft text-signal" : "border-line"}`}>
                  {item.done ? "✓" : ""}
                </span>
                <Link href={item.href} className="text-ink/70 hover:text-ink hover:underline">{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
