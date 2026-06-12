"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { AuthGate } from "@/components/AuthGate";

type Status = "wishlist" | "applied" | "phone" | "interview" | "offer" | "rejected";

interface Application {
  id: string;
  company: string;
  role: string;
  date: string;
  status: Status;
  salary?: string;
  notes?: string;
  url?: string;
}

const COLUMNS: { id: Status; label: string; color: string; bg: string }[] = [
  { id: "wishlist",  label: "Wishlist",     color: "text-ink/50",      bg: "bg-line/50"     },
  { id: "applied",   label: "Applied",      color: "text-amber",       bg: "bg-amber/10"    },
  { id: "phone",     label: "Phone Screen", color: "text-blue-500",    bg: "bg-blue-50"     },
  { id: "interview", label: "Interview",    color: "text-purple-500",  bg: "bg-purple-50"   },
  { id: "offer",     label: "Offer 🎉",     color: "text-signal",      bg: "bg-signalSoft"  },
  { id: "rejected",  label: "Rejected",     color: "text-red-400",     bg: "bg-red-50"      },
];

const NEXT_STATUS: Record<Status, Status | null> = {
  wishlist: "applied", applied: "phone", phone: "interview",
  interview: "offer", offer: null, rejected: null,
};

export default function Tracker() {
  const { isLoaded, isSignedIn, user } = useUser();

  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Omit<Application, "id">>({
    company: "", role: "", date: new Date().toISOString().slice(0, 10),
    status: "wishlist", salary: "", notes: "", url: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/applications");
      if (res.ok) {
        const data = await res.json();
        setApps(data.applications ?? []);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isSignedIn) load();
  }, [isSignedIn, load]);

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <AuthGate
        title="Track every application in one place"
        description="Sign in to start tracking your job applications. Your data syncs across all devices and is personalized to your job search."
        features={[
          "Kanban board: Wishlist → Applied → Phone → Interview → Offer",
          "Response rate and interview stats at a glance",
          "Notes, salary, and follow-up reminders per application",
          "Synced to your account — never lose your data",
        ]}
        returnPath="/tracker"
      />
    );
  }

  const totalApps = apps.filter(a => a.status !== "wishlist").length;
  const interviews = apps.filter(a => ["interview", "offer"].includes(a.status)).length;
  const offers = apps.filter(a => a.status === "offer").length;
  const responseRate = totalApps > 0 ? Math.round((interviews / totalApps) * 100) : 0;

  async function addApp() {
    if (!form.company || !form.role || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, notes: form.notes }),
      });
      if (res.ok) {
        await load();
        setForm({ company: "", role: "", date: new Date().toISOString().slice(0, 10), status: "wishlist", salary: "", notes: "", url: "" });
        setAdding(false);
      }
    } catch {}
    setSaving(false);
  }

  async function moveApp(id: string, to: Status) {
    setApps(prev => prev.map(a => a.id === id ? { ...a, status: to } : a));
    await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: to }),
    }).catch(() => load());
  }

  async function deleteApp(id: string) {
    setApps(prev => prev.filter(a => a.id !== id));
    if (selected === id) setSelected(null);
    await fetch(`/api/applications/${id}`, { method: "DELETE" }).catch(() => load());
  }

  const firstName = user.firstName ?? user.emailAddresses?.[0]?.emailAddress?.split("@")[0] ?? "there";

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Application Tracker</h1>
          <p className="text-sm text-ink/50 mt-0.5">
            {loading ? "Loading your applications…" : apps.length === 0
              ? `Welcome, ${firstName} — add your first application below`
              : `${apps.length} applications tracked · synced to your account`
            }
          </p>
        </div>
        <button onClick={() => setAdding(true)} className="btn-primary">+ Add application</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        {[
          { label: "Applied", value: totalApps },
          { label: "Interviews", value: interviews },
          { label: "Offers", value: offers },
          { label: "Response rate", value: `${responseRate}%` },
        ].map(s => (
          <div key={s.label} className="card p-3 text-center">
            <p className="font-mono text-2xl font-bold text-ink">{s.value}</p>
            <p className="text-xs text-ink/50 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Add form */}
      {adding && (
        <div className="card p-5 mb-6 space-y-3">
          <h2 className="font-display text-base font-semibold">Add application</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <span className="label">Company *</span>
              <input className="input" placeholder="Stripe" value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            </div>
            <div>
              <span className="label">Role *</span>
              <input className="input" placeholder="Software Engineer" value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
            </div>
            <div>
              <span className="label">Status</span>
              <select className="input" value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as Status }))}>
                {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <span className="label">Date</span>
              <input className="input" type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <span className="label">Salary range</span>
              <input className="input" placeholder="$150k – $180k" value={form.salary ?? ""}
                onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} />
            </div>
            <div>
              <span className="label">Job URL</span>
              <input className="input" placeholder="https://..." value={form.url ?? ""}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <span className="label">Notes</span>
              <input className="input" placeholder="Referred by John · Recruiter: Sarah"
                value={form.notes ?? ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={addApp} disabled={saving}>
              {saving ? "Saving…" : "Add application"}
            </button>
            <button className="btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map(col => (
            <div key={col.id} className="w-60 shrink-0">
              <div className={`rounded-t-lg px-3 py-2 animate-pulse ${col.bg}`}>
                <div className="h-3 w-20 bg-ink/20 rounded" />
              </div>
              <div className="rounded-b-lg border border-line border-t-0 bg-paper/50 p-2 min-h-[200px]">
                <div className="h-16 bg-ink/5 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-3xl mb-3">📋</p>
          <p className="font-display font-semibold text-lg mb-1">No applications yet, {firstName}</p>
          <p className="text-sm text-ink/50 mb-5">Add your first application above to start tracking your job search journey.</p>
          <button onClick={() => setAdding(true)} className="btn-primary">+ Add first application</button>
        </div>
      ) : (
        /* Kanban */
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {COLUMNS.map(col => {
              const colApps = apps.filter(a => a.status === col.id);
              return (
                <div key={col.id} className="w-60 shrink-0">
                  <div className={`flex items-center justify-between rounded-t-lg px-3 py-2 ${col.bg}`}>
                    <span className={`text-xs font-semibold uppercase tracking-wide ${col.color}`}>{col.label}</span>
                    <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-xs font-mono font-semibold">{colApps.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[200px] rounded-b-lg border border-line border-t-0 bg-paper/50 p-2">
                    {colApps.map(app => (
                      <div
                        key={app.id}
                        className="card bg-white p-3 cursor-pointer hover:shadow-sm transition-shadow"
                        onClick={() => setSelected(selected === app.id ? null : app.id)}
                      >
                        <p className="font-medium text-sm">{app.company}</p>
                        <p className="text-xs text-ink/60 mt-0.5">{app.role}</p>
                        {app.salary && <p className="text-xs text-signal font-mono mt-1">{app.salary}</p>}
                        <p className="text-xs text-ink/30 mt-1">
                          {new Date(app.date + "T00:00:00").toLocaleDateString()}
                        </p>

                        {selected === app.id && (
                          <div className="mt-3 pt-3 border-t border-line space-y-2" onClick={e => e.stopPropagation()}>
                            {app.notes && <p className="text-xs text-ink/60 italic">{app.notes}</p>}
                            {app.url && (
                              <a href={app.url} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-signal hover:underline block">
                                View job posting →
                              </a>
                            )}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {NEXT_STATUS[app.status] && (
                                <button
                                  className="btn-ghost text-xs py-1 px-2 text-signal"
                                  onClick={() => moveApp(app.id, NEXT_STATUS[app.status]!)}
                                >
                                  Move to {COLUMNS.find(c => c.id === NEXT_STATUS[app.status])?.label}
                                </button>
                              )}
                              <select
                                className="input text-xs py-0.5 w-auto"
                                value={app.status}
                                onChange={e => moveApp(app.id, e.target.value as Status)}
                              >
                                {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                              </select>
                            </div>
                            <button
                              className="text-xs text-red-400 hover:text-red-600 mt-1"
                              onClick={() => deleteApp(app.id)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {colApps.length === 0 && (
                      <div className="flex items-center justify-center h-16 text-xs text-ink/25">Empty</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-ink/40 text-center">
        Click any card to expand · All changes auto-save to your account
      </p>
    </div>
  );
}
