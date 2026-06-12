"use client";

import { useEffect, useState } from "react";

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
  { id: "wishlist", label: "Wishlist", color: "text-ink/50", bg: "bg-line/50" },
  { id: "applied", label: "Applied", color: "text-amber", bg: "bg-amber/10" },
  { id: "phone", label: "Phone Screen", color: "text-blue-500", bg: "bg-blue-50" },
  { id: "interview", label: "Interview", color: "text-purple-500", bg: "bg-purple-50" },
  { id: "offer", label: "Offer 🎉", color: "text-signal", bg: "bg-signalSoft" },
  { id: "rejected", label: "Rejected", color: "text-red-400", bg: "bg-red-50" },
];

const STATUS_ORDER: Status[] = ["wishlist", "applied", "phone", "interview", "offer", "rejected"];
const NEXT_STATUS: Record<Status, Status | null> = {
  wishlist: "applied",
  applied: "phone",
  phone: "interview",
  interview: "offer",
  offer: null,
  rejected: null,
};

const SEED: Application[] = [
  { id: "1", company: "Stripe", role: "Senior Engineer", date: "2025-11-10", status: "interview", salary: "$200k", url: "https://stripe.com" },
  { id: "2", company: "Vercel", role: "Staff Engineer", date: "2025-11-08", status: "applied", salary: "$220k" },
  { id: "3", company: "Linear", role: "Product Engineer", date: "2025-11-12", status: "phone", salary: "$180k" },
  { id: "4", company: "Figma", role: "Senior PM", date: "2025-11-05", status: "rejected" },
  { id: "5", company: "Notion", role: "Frontend Engineer", date: "2025-11-14", status: "wishlist", salary: "$170k" },
];

function useLocalApps() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("hireflow-tracker");
      setApps(stored ? JSON.parse(stored) : SEED);
    } catch {
      setApps(SEED);
    }
    setLoaded(true);
  }, []);

  const save = (next: Application[]) => {
    setApps(next);
    try { localStorage.setItem("hireflow-tracker", JSON.stringify(next)); } catch {}
  };

  return { apps, save, loaded };
}

export default function Tracker() {
  const { apps, save, loaded } = useLocalApps();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Omit<Application, "id">>({
    company: "", role: "", date: new Date().toISOString().slice(0, 10), status: "wishlist",
    salary: "", notes: "", url: "",
  });
  const [selected, setSelected] = useState<Application | null>(null);

  const totalApps = apps.filter(a => a.status !== "wishlist").length;
  const interviews = apps.filter(a => ["interview", "offer"].includes(a.status)).length;
  const offers = apps.filter(a => a.status === "offer").length;
  const responseRate = totalApps > 0 ? Math.round((interviews / totalApps) * 100) : 0;

  function addApp() {
    if (!form.company || !form.role) return;
    save([...apps, { ...form, id: Date.now().toString() }]);
    setForm({ company: "", role: "", date: new Date().toISOString().slice(0, 10), status: "wishlist", salary: "", notes: "", url: "" });
    setAdding(false);
  }

  function moveApp(id: string, to: Status) {
    save(apps.map(a => a.id === id ? { ...a, status: to } : a));
    if (selected?.id === id) setSelected(s => s ? { ...s, status: to } : s);
  }

  function deleteApp(id: string) {
    save(apps.filter(a => a.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  if (!loaded) return <div className="flex items-center justify-center min-h-[40vh] text-ink/40">Loading tracker…</div>;

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Application Tracker</h1>
          <p className="text-sm text-ink/50 mt-0.5">Saved locally — your data never leaves your browser</p>
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
              <input className="input" placeholder="Stripe" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            </div>
            <div>
              <span className="label">Role *</span>
              <input className="input" placeholder="Software Engineer" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
            </div>
            <div>
              <span className="label">Status</span>
              <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Status }))}>
                {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <span className="label">Date applied</span>
              <input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <span className="label">Salary range</span>
              <input className="input" placeholder="$150k – $180k" value={form.salary ?? ""} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} />
            </div>
            <div>
              <span className="label">Job URL</span>
              <input className="input" placeholder="https://..." value={form.url ?? ""} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <span className="label">Notes</span>
              <input className="input" placeholder="Referred by John · Recruiter: Sarah" value={form.notes ?? ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={addApp}>Add application</button>
            <button className="btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Kanban */}
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
                      onClick={() => setSelected(selected?.id === app.id ? null : app)}
                    >
                      <p className="font-medium text-sm">{app.company}</p>
                      <p className="text-xs text-ink/60 mt-0.5">{app.role}</p>
                      {app.salary && <p className="text-xs text-signal font-mono mt-1">{app.salary}</p>}
                      <p className="text-xs text-ink/30 mt-1">{new Date(app.date).toLocaleDateString()}</p>

                      {selected?.id === app.id && (
                        <div className="mt-3 pt-3 border-t border-line space-y-2" onClick={e => e.stopPropagation()}>
                          {app.notes && <p className="text-xs text-ink/60 italic">{app.notes}</p>}
                          {app.url && (
                            <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-xs text-signal hover:underline block">View job posting →</a>
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
                          <button className="text-xs text-red-400 hover:text-red-600 mt-1" onClick={() => deleteApp(app.id)}>Delete</button>
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

      <p className="mt-4 text-xs text-ink/40 text-center">
        Click any card to expand · Data saved in your browser · Export to CSV coming soon
      </p>
    </div>
  );
}
