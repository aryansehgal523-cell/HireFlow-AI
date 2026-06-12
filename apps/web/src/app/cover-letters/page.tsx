"use client";

import { useState } from "react";

const TONES = [
  { value: "professional", label: "Professional", desc: "Clear, confident, business-standard" },
  { value: "executive", label: "Executive", desc: "Senior-level gravitas and strategic framing" },
  { value: "startup", label: "Startup", desc: "Direct, energetic, culture-forward" },
  { value: "confident", label: "Bold & Confident", desc: "Strong openers, no hedging language" },
  { value: "formal", label: "Formal", desc: "Traditional industries — law, finance, gov" },
];

const SAMPLE_LETTERS = [
  {
    id: "1",
    title: "Senior Engineer @ Stripe",
    tone: "Professional",
    date: "2025-11-14",
    preview: "I was drawn to Stripe's mission of increasing the GDP of the internet — and the infrastructure challenges your payments team is tackling align directly with my work scaling distributed systems at scale.",
  },
  {
    id: "2",
    title: "Product Manager @ Notion",
    tone: "Startup",
    date: "2025-11-10",
    preview: "Notion is building the OS for human knowledge, and I've spent the last three years shipping tools that help teams think more clearly. That overlap isn't a coincidence — it's why I'm writing.",
  },
];

export default function CoverLetters() {
  const [mode, setMode] = useState<"list" | "create">("list");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [tone, setTone] = useState("professional");
  const [jd, setJd] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [generated, setGenerated] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!company || !role || !jd || !resumeText) {
      setError("Fill in company, role, job description, and resume text.");
      return;
    }
    setBusy(true);
    setError(null);
    setGenerated("");
    try {
      const res = await fetch("/api/ai/cover-letter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ company, role, tone, jd, resumeText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setGenerated(data.letter ?? data.body ?? "");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (mode === "create") {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => { setMode("list"); setGenerated(""); setError(null); }} className="text-sm text-ink/50 hover:text-ink">← Back</button>
          <h1 className="font-display text-2xl font-bold">New Cover Letter</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
          {/* Form */}
          <div className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            <div className="card p-5 space-y-4">
              <h2 className="font-display text-sm font-semibold text-ink/60 uppercase tracking-widest">Job details</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <span className="label">Company *</span>
                  <input className="input" placeholder="Stripe" value={company} onChange={e => setCompany(e.target.value)} />
                </div>
                <div>
                  <span className="label">Role / title *</span>
                  <input className="input" placeholder="Senior Software Engineer" value={role} onChange={e => setRole(e.target.value)} />
                </div>
              </div>
              <div>
                <span className="label">Job description *</span>
                <textarea className="input min-h-[120px] font-mono text-xs" placeholder="Paste the full job description here…" value={jd} onChange={e => setJd(e.target.value)} />
              </div>
            </div>

            <div className="card p-5 space-y-3">
              <h2 className="font-display text-sm font-semibold text-ink/60 uppercase tracking-widest">Your background</h2>
              <div>
                <span className="label">Paste your resume or key experience *</span>
                <textarea
                  className="input min-h-[140px] font-mono text-xs"
                  placeholder={"Senior Software Engineer at Stripe (2021–2024)\n• Led payments infra migration, cutting latency 40%\n• Built real-time fraud detection processing 3M events/day\n\nSkills: TypeScript, Rust, Kubernetes, Postgres"}
                  value={resumeText}
                  onChange={e => setResumeText(e.target.value)}
                />
              </div>
            </div>

            <div className="card p-5 space-y-3">
              <h2 className="font-display text-sm font-semibold text-ink/60 uppercase tracking-widest">Tone</h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {TONES.map(t => (
                  <label key={t.value} className={`cursor-pointer rounded-lg border p-3 transition-colors ${tone === t.value ? "border-signal bg-signalSoft" : "border-line hover:border-signal/40"}`}>
                    <input type="radio" name="tone" value={t.value} checked={tone === t.value} onChange={() => setTone(t.value)} className="sr-only" />
                    <p className="font-medium text-sm">{t.label}</p>
                    <p className="text-xs text-ink/50 mt-0.5">{t.desc}</p>
                  </label>
                ))}
              </div>
            </div>

            <button className="btn-primary w-full py-2.5" onClick={generate} disabled={busy}>
              {busy ? "Generating cover letter…" : "✦ Generate cover letter"}
            </button>
          </div>

          {/* Output */}
          <div className="lg:sticky lg:top-20 h-fit">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-sm font-semibold">Generated letter</h2>
                {generated && (
                  <button onClick={copy} className="btn-ghost py-1 px-2 text-xs">
                    {copied ? "✓ Copied!" : "Copy"}
                  </button>
                )}
              </div>
              {generated ? (
                <div>
                  <textarea
                    className="input min-h-[420px] font-mono text-xs leading-relaxed"
                    value={generated}
                    onChange={e => setGenerated(e.target.value)}
                  />
                  <p className="mt-2 text-xs text-ink/40">Edit directly · Changes are yours to keep</p>
                </div>
              ) : (
                <div className="text-center py-12 text-ink/30">
                  <div className="text-4xl mb-3">✉</div>
                  <p className="text-sm">Fill in the details and click generate</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">Cover Letters</h1>
          <p className="text-sm text-ink/50 mt-0.5">AI-generated, tailored to each company and role</p>
        </div>
        <button onClick={() => setMode("create")} className="btn-primary">+ New cover letter</button>
      </div>

      {/* How it works */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        {[
          { step: "1", title: "Paste the JD", desc: "Drop in the job description and your resume text." },
          { step: "2", title: "Choose your tone", desc: "Professional, executive, startup, bold, or formal." },
          { step: "3", title: "Edit and copy", desc: "AI generates 250–350 words. Edit inline and copy to apply." },
        ].map(s => (
          <div key={s.step} className="card p-4">
            <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-signalSoft text-signal text-xs font-bold mb-2">{s.step}</div>
            <h3 className="font-medium text-sm">{s.title}</h3>
            <p className="text-xs text-ink/50 mt-0.5">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Sample letters */}
      <div>
        <h2 className="font-display text-sm font-semibold text-ink/50 uppercase tracking-widest mb-3">Recent cover letters</h2>
        {SAMPLE_LETTERS.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-4xl mb-3">✉</div>
            <p className="font-semibold">No cover letters yet</p>
            <p className="text-sm text-ink/50 mt-1">Create your first tailored cover letter in 30 seconds.</p>
            <button onClick={() => setMode("create")} className="btn-primary mt-5 inline-flex">Create cover letter</button>
          </div>
        ) : (
          <div className="space-y-3">
            {SAMPLE_LETTERS.map(l => (
              <div key={l.id} className="card p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm">{l.title}</h3>
                      <span className="rounded-full bg-signalSoft px-2 py-0.5 text-xs font-medium text-signal">{l.tone}</span>
                    </div>
                    <p className="text-xs text-ink/50 line-clamp-2 leading-relaxed">"{l.preview}"</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-ink/40">{new Date(l.date).toLocaleDateString()}</p>
                    <button className="text-xs text-signal hover:underline mt-1">View →</button>
                  </div>
                </div>
              </div>
            ))}
            <p className="text-xs text-ink/40 text-center pt-2">
              Connect to your account to save cover letters permanently
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
