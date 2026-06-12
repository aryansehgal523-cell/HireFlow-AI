"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  remote: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  source: string;
  url: string;
  extractedSkills: string[];
  postedAt: string | null;
  description: string;
}

function fmt(n: number | null) {
  if (!n) return "";
  return `$${(n / 1000).toFixed(0)}k`;
}

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "1 day ago";
  if (d < 30) return `${d} days ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [query, setQuery] = useState("");
  const [onlyRemote, setOnlyRemote] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState("");

  const loadJobs = useCallback(async (q?: string, remote?: boolean) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (remote) params.set("remote", "1");
      const res = await fetch(`/api/jobs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs ?? []);
      }
    } catch (_e) {}
    setLoading(false);
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg("");
    try {
      const res = await fetch("/api/jobs/sync");
      const data = await res.json();
      setSyncMsg(`Synced ${data.synced} jobs`);
      await loadJobs(query, onlyRemote);
    } catch (_e) {
      setSyncMsg("Sync failed");
    }
    setSyncing(false);
  };

  const handleSearch = (q: string, remote: boolean) => {
    setQuery(q);
    setOnlyRemote(remote);
    loadJobs(q, remote);
  };

  const toggleSave = (id: string) => setSaved(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold">Job Board</h1>
          <p className="text-sm text-ink/50 mt-0.5">
            Live jobs from Greenhouse &amp; Lever · Sorted by recency
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="btn-ghost text-sm py-2 px-4 disabled:opacity-60 shrink-0"
        >
          {syncing ? "Syncing…" : "⟳ Refresh jobs"}
        </button>
      </div>

      {syncMsg && (
        <div className="rounded-md bg-signalSoft px-4 py-2 text-sm text-signal mb-4">{syncMsg}</div>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          className="input flex-1 min-w-48"
          placeholder="Search by title, company, or skill…"
          value={query}
          onChange={e => handleSearch(e.target.value, onlyRemote)}
        />
        <label className="flex items-center gap-2 cursor-pointer btn-ghost text-sm">
          <input
            type="checkbox"
            checked={onlyRemote}
            onChange={e => handleSearch(query, e.target.checked)}
            className="h-3.5 w-3.5 accent-signal"
          />
          Remote only
        </label>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-ink/10 rounded w-1/3 mb-3" />
              <div className="h-3 bg-ink/10 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-semibold text-lg mb-1">No jobs yet</p>
          <p className="text-sm text-ink/50 mb-4">Click "Refresh jobs" to pull live listings from Greenhouse and Lever.</p>
          <button onClick={handleSync} disabled={syncing} className="btn-primary py-2 px-6">
            {syncing ? "Syncing…" : "Load live jobs"}
          </button>
        </div>
      ) : (
        <>
          <p className="text-xs text-ink/40 mb-3">{jobs.length} jobs · sorted by date</p>
          <div className="space-y-3">
            {jobs.map(job => {
              const isSaved = saved.has(job.id);
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
                          {job.location && <><span>·</span><span>{job.location}</span></>}
                          {(job.salaryMin || job.salaryMax) && (
                            <><span>·</span><span className="font-mono text-xs font-medium">{fmt(job.salaryMin)}–{fmt(job.salaryMax)}</span></>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleSave(job.id)}
                        className={`text-lg transition-colors shrink-0 ${isSaved ? "text-signal" : "text-ink/20 hover:text-ink/50"}`}
                      >
                        {isSaved ? "♥" : "♡"}
                      </button>
                    </div>

                    {job.extractedSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {job.extractedSkills.slice(0, 6).map(s => (
                          <span key={s} className="rounded-full border border-line px-2 py-0.5 text-xs text-ink/60">{s}</span>
                        ))}
                      </div>
                    )}

                    {isOpen && job.description && (
                      <p className="mt-3 text-sm text-ink/70 leading-relaxed border-t border-line pt-3 whitespace-pre-line line-clamp-10">
                        {job.description.slice(0, 600)}{job.description.length > 600 ? "…" : ""}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-line">
                      <div className="flex items-center gap-3 text-xs text-ink/40">
                        <span>{timeAgo(job.postedAt)}</span>
                        <span>·</span>
                        <span>via {job.source}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setExpanded(isOpen ? null : job.id)} className="text-xs text-ink/50 hover:text-ink transition-colors">
                          {isOpen ? "Less" : "Details"}
                        </button>
                        <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs py-1 px-2">
                          Apply ↗
                        </a>
                        <Link href={`/editor?job=${job.id}`} className="btn-ghost text-xs py-1 px-2 text-signal">
                          Tailor resume
                        </Link>
                        <Link
                          href={`/cover-letters?job=${job.id}&company=${encodeURIComponent(job.company)}&role=${encodeURIComponent(job.title)}`}
                          className="btn-ghost text-xs py-1 px-2"
                        >
                          Cover letter
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
