"use client";

import { useState } from "react";
import Link from "next/link";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  salaryMin?: number;
  salaryMax?: number;
  matchScore?: number;
  skills: string[];
  posted: string;
  type: string;
  source: string;
  description: string;
}

const MOCK_JOBS: Job[] = [
  {
    id: "1", title: "Senior Software Engineer", company: "Stripe", location: "San Francisco, CA",
    remote: true, salaryMin: 180000, salaryMax: 240000, matchScore: 87,
    skills: ["TypeScript", "React", "Go", "Kubernetes"],
    posted: "2 days ago", type: "Full-time", source: "Greenhouse",
    description: "Join our payments infrastructure team to build the financial systems that power the internet economy.",
  },
  {
    id: "2", title: "Staff Frontend Engineer", company: "Vercel", location: "Remote",
    remote: true, salaryMin: 200000, salaryMax: 260000, matchScore: 82,
    skills: ["React", "Next.js", "TypeScript", "WebAssembly"],
    posted: "1 day ago", type: "Full-time", source: "Lever",
    description: "Help build the frontend infrastructure for millions of developers who deploy on Vercel every day.",
  },
  {
    id: "3", title: "Product Manager — Growth", company: "Figma", location: "San Francisco, CA",
    remote: false, salaryMin: 170000, salaryMax: 210000, matchScore: 71,
    skills: ["Product strategy", "SQL", "A/B testing", "User research"],
    posted: "3 days ago", type: "Full-time", source: "Greenhouse",
    description: "Lead growth initiatives for Figma's collaboration platform used by 4M+ designers worldwide.",
  },
  {
    id: "4", title: "Senior Backend Engineer", company: "Linear", location: "Remote",
    remote: true, salaryMin: 160000, salaryMax: 200000, matchScore: 79,
    skills: ["TypeScript", "Node.js", "PostgreSQL", "Redis"],
    posted: "5 days ago", type: "Full-time", source: "Lever",
    description: "Build the high-performance sync engine that keeps Linear fast for thousands of teams.",
  },
  {
    id: "5", title: "ML Engineer — LLM", company: "Anthropic", location: "San Francisco, CA",
    remote: false, salaryMin: 250000, salaryMax: 350000, matchScore: 58,
    skills: ["Python", "PyTorch", "CUDA", "RLHF"],
    posted: "1 week ago", type: "Full-time", source: "Lever",
    description: "Work on safety-focused large language models at the frontier of AI research.",
  },
  {
    id: "6", title: "DevRel Engineer", company: "Supabase", location: "Remote",
    remote: true, salaryMin: 130000, salaryMax: 160000, matchScore: 65,
    skills: ["PostgreSQL", "TypeScript", "React", "Technical writing"],
    posted: "4 days ago", type: "Full-time", source: "Greenhouse",
    description: "Help developers build great apps on Supabase by creating demos, docs, and community content.",
  },
];

function fmt(n?: number) {
  if (!n) return "";
  return n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`;
}

export default function Jobs() {
  const [query, setQuery] = useState("");
  const [onlyRemote, setOnlyRemote] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = MOCK_JOBS.filter(j => {
    const q = query.toLowerCase();
    const match = !q || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.skills.some(s => s.toLowerCase().includes(q));
    return match && (!onlyRemote || j.remote);
  }).sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));

  const toggleSave = (id: string) => {
    setSaved(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">Job Board</h1>
        <p className="text-sm text-ink/50 mt-0.5">
          From official job-board APIs (Greenhouse, Lever, Ashby) · Match scores based on your profile
        </p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          className="input flex-1 min-w-48"
          placeholder="Search by title, company, or skill…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <label className="flex items-center gap-2 cursor-pointer btn-ghost text-sm">
          <input
            type="checkbox"
            checked={onlyRemote}
            onChange={e => setOnlyRemote(e.target.checked)}
            className="h-3.5 w-3.5 accent-signal"
          />
          Remote only
        </label>
      </div>

      {/* Notice */}
      <div className="rounded-md bg-signalSoft px-4 py-3 text-sm text-signal mb-6 flex items-start gap-2">
        <span className="mt-0.5 shrink-0">ℹ</span>
        <span>
          <strong>Demo mode</strong> — showing sample jobs. Connect your Anthropic API key and set up the database to load live jobs from real company boards.
        </span>
      </div>

      {/* Results */}
      <p className="text-xs text-ink/40 mb-3">{filtered.length} jobs · sorted by match score</p>
      <div className="space-y-3">
        {filtered.map(job => {
          const isSaved = saved.has(job.id);
          const score = job.matchScore ?? 0;
          const scoreColor = score >= 80 ? "text-signal" : score >= 65 ? "text-amber" : "text-red-400";
          const isOpen = expanded === job.id;

          return (
            <div key={job.id} className="card hover:shadow-sm transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <h3 className="font-display text-base font-semibold">{job.title}</h3>
                      {job.remote && (
                        <span className="rounded-full bg-signalSoft px-2 py-0.5 text-xs font-medium text-signal">Remote</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-ink/60 flex-wrap">
                      <span className="font-medium text-ink">{job.company}</span>
                      <span>·</span>
                      <span>{job.location}</span>
                      {(job.salaryMin || job.salaryMax) && (
                        <>
                          <span>·</span>
                          <span className="font-mono text-xs font-medium">
                            {fmt(job.salaryMin)}–{fmt(job.salaryMax)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {job.matchScore !== undefined && (
                      <div className="text-right">
                        <p className={`font-mono text-lg font-bold ${scoreColor}`}>{score}%</p>
                        <p className="text-xs text-ink/40">match</p>
                      </div>
                    )}
                    <button
                      onClick={() => toggleSave(job.id)}
                      className={`text-lg transition-colors ${isSaved ? "text-signal" : "text-ink/20 hover:text-ink/50"}`}
                      title={isSaved ? "Unsave" : "Save job"}
                    >
                      {isSaved ? "♥" : "♡"}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {job.skills.map(s => (
                    <span key={s} className="rounded-full border border-line px-2 py-0.5 text-xs text-ink/60">{s}</span>
                  ))}
                </div>

                {isOpen && (
                  <p className="mt-3 text-sm text-ink/70 leading-relaxed border-t border-line pt-3">{job.description}</p>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-line">
                  <div className="flex items-center gap-3 text-xs text-ink/40">
                    <span>{job.posted}</span>
                    <span>·</span>
                    <span>{job.type}</span>
                    <span>·</span>
                    <span>via {job.source}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setExpanded(isOpen ? null : job.id)}
                      className="text-xs text-ink/50 hover:text-ink transition-colors"
                    >
                      {isOpen ? "Less" : "Details"}
                    </button>
                    <Link href={`/editor?job=${job.id}`} className="btn-ghost text-xs py-1 px-2 text-signal">
                      Tailor resume
                    </Link>
                    <Link href={`/cover-letters?job=${job.id}&company=${encodeURIComponent(job.company)}&role=${encodeURIComponent(job.title)}`} className="btn-ghost text-xs py-1 px-2">
                      Cover letter
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card p-10 text-center">
          <p className="font-semibold">No jobs match your search</p>
          <p className="text-sm text-ink/50 mt-1">Try a different keyword or clear the remote filter.</p>
        </div>
      )}
    </div>
  );
}
