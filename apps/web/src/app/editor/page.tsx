"use client";

import { useMemo, useState } from "react";
import { scoreResume, type ResumeContent } from "@hireflow/ats-engine";
import { ExportButtons } from "@/components/ExportButtons";
import { ResumeImport } from "@/components/ResumeImport";

type Cert = { name: string; issuer?: string; date?: string; url?: string };
type Lang = { language: string; proficiency?: string };
type Volunteer = { organization: string; role: string; location?: string; start?: string; end?: string; bullets: string[] };
type Award = { title: string; issuer?: string; date?: string; description?: string };
type Publication = { title: string; publisher?: string; date?: string; url?: string };

const PROFICIENCY_OPTIONS = ["Native", "Fluent", "Advanced", "Intermediate", "Basic"];
const LINK_PRESETS = ["LinkedIn", "GitHub", "Portfolio", "Website", "Twitter/X", "Dribbble", "Behance"];
const TEMPLATES = [
  { key: "MINIMAL_ATS", label: "Clean ATS" },
  { key: "HARVARD", label: "Harvard Classic" },
  { key: "GOOGLE_XYZ", label: "Google XYZ" },
  { key: "FAANG_ENGINEER", label: "Tech Engineer" },
  { key: "EXECUTIVE", label: "Executive" },
  { key: "FRESHER", label: "New Graduate" },
  { key: "DESIGNER", label: "Creative" },
  { key: "MBA", label: "MBA" },
];

const EMPTY_EXP = { company: "", title: "", location: "", start: "", end: null as null, bullets: [""] };
const EMPTY_EDU = { school: "", degree: "", field: "", start: "", end: "", gpa: "", honors: "" };
const EMPTY_PROJ = { name: "", url: "", start: "", end: "", bullets: [""] };
const EMPTY_VOL: Volunteer = { organization: "", role: "", location: "", start: "", end: "", bullets: [""] };

const STARTER: ResumeContent = {
  basics: { name: "", email: "", phone: "", location: "", headline: "", links: [] },
  summary: "",
  experience: [{ ...EMPTY_EXP }],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  volunteer: [],
  awards: [],
  publications: [],
};

interface SectionHeaderProps {
  id: string;
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
}
function SectionHeader({ title, subtitle, open, onToggle }: SectionHeaderProps) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-signalSoft/40 transition-colors"
      onClick={onToggle}
    >
      <div>
        <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
        {subtitle && <p className="text-xs text-ink/50 mt-0.5">{subtitle}</p>}
      </div>
      <span className={`text-ink/40 text-sm transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▾</span>
    </button>
  );
}

export default function Editor() {
  const [resume, setResume] = useState<ResumeContent>(STARTER);
  const [jd, setJd] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [template, setTemplate] = useState("MINIMAL_ATS");
  const [open, setOpen] = useState<Set<string>>(
    new Set(["contact", "summary", "experience", "education", "skills"])
  );

  const ats = useMemo(() => scoreResume(resume, jd || undefined), [resume, jd]);

  const toggle = (id: string) =>
    setOpen(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const set = (patch: Partial<ResumeContent>) => setResume(r => ({ ...r, ...patch }));
  const setBasics = (patch: Partial<typeof resume.basics>) =>
    set({ basics: { ...resume.basics, ...patch } });

  // Experience helpers
  const setExp = (i: number, patch: Partial<typeof resume.experience[0]>) =>
    set({ experience: resume.experience.map((e, j) => j === i ? { ...e, ...patch } : e) });
  const addExp = () => set({ experience: [...resume.experience, { ...EMPTY_EXP }] });
  const removeExp = (i: number) => set({ experience: resume.experience.filter((_, j) => j !== i) });

  // Education helpers
  const setEdu = (i: number, patch: Partial<typeof resume.education[0]>) =>
    set({ education: resume.education.map((e, j) => j === i ? { ...e, ...patch } : e) });
  const addEdu = () => set({ education: [...resume.education, { ...EMPTY_EDU }] });
  const removeEdu = (i: number) => set({ education: resume.education.filter((_, j) => j !== i) });

  // Projects helpers
  const setProj = (i: number, patch: Partial<NonNullable<typeof resume.projects>[0]>) =>
    set({ projects: (resume.projects ?? []).map((p, j) => j === i ? { ...p, ...patch } : p) });
  const addProj = () => set({ projects: [...(resume.projects ?? []), { ...EMPTY_PROJ }] });
  const removeProj = (i: number) =>
    set({ projects: (resume.projects ?? []).filter((_, j) => j !== i) });

  // Cert helpers
  const setCert = (i: number, patch: Partial<Cert>) =>
    set({ certifications: (resume.certifications ?? []).map((c, j) => j === i ? { ...c, ...patch } : c) });
  const addCert = () => set({ certifications: [...(resume.certifications ?? []), { name: "" }] });
  const removeCert = (i: number) =>
    set({ certifications: (resume.certifications ?? []).filter((_, j) => j !== i) });

  // Language helpers
  const setLang = (i: number, patch: Partial<Lang>) =>
    set({ languages: (resume.languages ?? []).map((l, j) => j === i ? { ...l, ...patch } : l) });
  const addLang = () =>
    set({ languages: [...(resume.languages ?? []), { language: "", proficiency: "Intermediate" }] });
  const removeLang = (i: number) =>
    set({ languages: (resume.languages ?? []).filter((_, j) => j !== i) });

  // Volunteer helpers
  const setVol = (i: number, patch: Partial<Volunteer>) =>
    set({ volunteer: (resume.volunteer ?? []).map((v, j) => j === i ? { ...v, ...patch } : v) });
  const addVol = () => set({ volunteer: [...(resume.volunteer ?? []), { ...EMPTY_VOL }] });
  const removeVol = (i: number) =>
    set({ volunteer: (resume.volunteer ?? []).filter((_, j) => j !== i) });

  // Award helpers
  const setAward = (i: number, patch: Partial<Award>) =>
    set({ awards: (resume.awards ?? []).map((a, j) => j === i ? { ...a, ...patch } : a) });
  const addAward = () => set({ awards: [...(resume.awards ?? []), { title: "" }] });
  const removeAward = (i: number) =>
    set({ awards: (resume.awards ?? []).filter((_, j) => j !== i) });

  // Publication helpers
  const setPub = (i: number, patch: Partial<Publication>) =>
    set({ publications: (resume.publications ?? []).map((p, j) => j === i ? { ...p, ...patch } : p) });
  const addPub = () => set({ publications: [...(resume.publications ?? []), { title: "" }] });
  const removePub = (i: number) =>
    set({ publications: (resume.publications ?? []).filter((_, j) => j !== i) });

  // Link helpers
  const setLink = (i: number, patch: { label?: string; url?: string }) =>
    setBasics({ links: (resume.basics.links ?? []).map((l, j) => j === i ? { ...l, ...patch } : l) });
  const addLink = () =>
    setBasics({ links: [...(resume.basics.links ?? []), { label: "LinkedIn", url: "" }] });
  const removeLink = (i: number) =>
    setBasics({ links: (resume.basics.links ?? []).filter((_, j) => j !== i) });

  async function aiRewrite(section: "experience" | "projects", i: number) {
    const entry = (section === "experience" ? resume.experience : (resume.projects ?? []))[i] as any;
    const bullets = (entry.bullets as string[]).filter(b => b.trim().length > 2);
    if (!bullets.length) return setNotice({ type: "err", msg: "Write at least one bullet first." });
    const key = `rewrite-${section}-${i}`;
    setBusy(key);
    setNotice(null);
    try {
      const res = await fetch("/api/ai/rewrite-bullets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bullets, role: entry.title || entry.name || "professional", jobDescription: jd || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Rewrite failed");
      if (section === "experience") setExp(i, { bullets: data.bullets });
      else setProj(i, { bullets: data.bullets });
      setNotice({ type: "ok", msg: "Bullets rewritten with AI." });
    } catch (e: any) {
      setNotice({ type: "err", msg: e.message });
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    setBusy("save");
    setNotice(null);
    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: resume.basics.name ? `${resume.basics.name} — resume` : "Untitled resume",
          content: resume,
          template,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setNotice({ type: "ok", msg: "Saved to your dashboard!" });
    } catch (e: any) {
      setNotice({ type: "err", msg: e.message });
    } finally {
      setBusy(null);
    }
  }

  function handleImport(parsed: Record<string, unknown>) {
    const p = parsed as any;
    setResume(prev => ({
      basics: {
        name: p.basics?.name ?? prev.basics.name,
        email: p.basics?.email ?? prev.basics.email,
        phone: p.basics?.phone ?? prev.basics.phone,
        location: p.basics?.location ?? prev.basics.location,
        headline: p.basics?.headline ?? prev.basics.headline,
        links: [
          ...(p.basics?.linkedin ? [{ label: "LinkedIn", url: p.basics.linkedin }] : []),
          ...(p.basics?.github ? [{ label: "GitHub", url: p.basics.github }] : []),
          ...(p.basics?.website ? [{ label: "Website", url: p.basics.website }] : []),
          ...(prev.basics.links ?? []).filter(l =>
            !["LinkedIn", "GitHub", "Website"].includes(l.label)
          ),
        ],
      },
      summary: p.summary || prev.summary,
      experience: Array.isArray(p.experience) && p.experience.length
        ? p.experience.map((e: any) => ({
            company: e.company ?? "",
            title: e.title ?? "",
            location: e.location ?? "",
            start: e.start ?? "",
            end: e.end ?? null,
            bullets: Array.isArray(e.bullets) ? e.bullets : [],
          }))
        : prev.experience,
      education: Array.isArray(p.education) && p.education.length
        ? p.education.map((e: any) => ({
            school: e.school ?? "",
            degree: e.degree ?? "",
            field: e.field ?? "",
            start: e.start ?? "",
            end: e.end ?? "",
            gpa: e.gpa ?? "",
          }))
        : prev.education,
      skills: Array.isArray(p.skills) && p.skills.length ? p.skills : prev.skills,
      projects: Array.isArray(p.projects) && p.projects.length
        ? p.projects.map((pr: any) => ({
            name: pr.name ?? "",
            url: pr.url ?? "",
            start: pr.start ?? "",
            end: pr.end ?? "",
            bullets: Array.isArray(pr.bullets) ? pr.bullets : [],
          }))
        : prev.projects,
      certifications: Array.isArray(p.certifications) && p.certifications.length
        ? p.certifications
        : prev.certifications,
      languages: Array.isArray(p.languages) && p.languages.length
        ? p.languages
        : prev.languages,
      volunteer: prev.volunteer,
      awards: Array.isArray(p.awards) && p.awards.length ? p.awards : prev.awards,
      publications: prev.publications,
    }));
    setNotice({ type: "ok", msg: "Resume imported — review and edit any fields below." });
    setOpen(new Set(["contact", "summary", "experience", "education", "skills", "projects"]));
  }

  const score = ats.overall;
  const scoreColor = score >= 80 ? "text-signal" : score >= 60 ? "text-amber" : "text-red-500";
  const barColor = score >= 80 ? "bg-signal" : score >= 60 ? "bg-amber" : "bg-red-400";
  const scoreLabel =
    score >= 80 ? "Strong — ready to apply" :
    score >= 65 ? "Good — a few tweaks will help" :
    score >= 50 ? "Fair — needs improvement" :
    "Weak — significant work needed";

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr,340px]">
      {/* ── LEFT: Editor ── */}
      <div className="space-y-3">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">Resume Builder</h1>
            <p className="text-xs text-ink/50 mt-0.5">Score updates live as you type</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="input w-auto text-xs py-1.5"
              value={template}
              onChange={e => setTemplate(e.target.value)}
            >
              {TEMPLATES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
            <button className="btn-primary py-1.5 text-sm" onClick={save} disabled={busy !== null}>
              {busy === "save" ? "Saving…" : "Save resume"}
            </button>
          </div>
        </div>

        {notice && (
          <div className={`rounded-md px-4 py-2 text-sm font-medium ${notice.type === "ok" ? "bg-signalSoft text-signal" : "bg-red-50 text-red-600"}`}>
            {notice.msg}
          </div>
        )}

        <ResumeImport onImport={handleImport} />

        {/* ── Contact ── */}
        <div className="card overflow-hidden">
          <SectionHeader id="contact" title="Contact Information" subtitle="Name, email, phone, location, and social links" open={open.has("contact")} onToggle={() => toggle("contact")} />
          {open.has("contact") && (
            <div className="border-t border-line px-5 pb-5 pt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <span className="label">Full name *</span>
                  <input className="input" placeholder="Alex Johnson" value={resume.basics.name} onChange={e => setBasics({ name: e.target.value })} />
                </div>
                <div>
                  <span className="label">Headline / title</span>
                  <input className="input" placeholder="Senior Software Engineer" value={resume.basics.headline ?? ""} onChange={e => setBasics({ headline: e.target.value })} />
                </div>
                <div>
                  <span className="label">Email *</span>
                  <input className="input" type="email" placeholder="alex@example.com" value={resume.basics.email ?? ""} onChange={e => setBasics({ email: e.target.value })} />
                </div>
                <div>
                  <span className="label">Phone</span>
                  <input className="input" placeholder="+1 (555) 123-4567" value={resume.basics.phone ?? ""} onChange={e => setBasics({ phone: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <span className="label">Location</span>
                  <input className="input" placeholder="San Francisco, CA · Open to Remote" value={resume.basics.location ?? ""} onChange={e => setBasics({ location: e.target.value })} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="label mb-0">Links & profiles</span>
                  <button className="btn-ghost py-1 px-2 text-xs" onClick={addLink}>+ Add link</button>
                </div>
                <div className="space-y-2">
                  {(resume.basics.links ?? []).map((link, i) => (
                    <div key={i} className="flex gap-2">
                      <select
                        className="input w-32 text-xs"
                        value={LINK_PRESETS.includes(link.label) ? link.label : "Custom"}
                        onChange={e => setLink(i, { label: e.target.value === "Custom" ? "" : e.target.value })}
                      >
                        {LINK_PRESETS.map(p => <option key={p}>{p}</option>)}
                        <option value="Custom">Custom</option>
                      </select>
                      {!LINK_PRESETS.includes(link.label) && (
                        <input className="input w-24 text-xs" placeholder="Label" value={link.label} onChange={e => setLink(i, { label: e.target.value })} />
                      )}
                      <input className="input flex-1 text-xs" placeholder="https://..." value={link.url} onChange={e => setLink(i, { url: e.target.value })} />
                      <button className="text-amber hover:text-red-500 px-1 text-sm" onClick={() => removeLink(i)}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Summary ── */}
        <div className="card overflow-hidden">
          <SectionHeader id="summary" title="Professional Summary" subtitle="2–3 sentences about your strongest value proposition" open={open.has("summary")} onToggle={() => toggle("summary")} />
          {open.has("summary") && (
            <div className="border-t border-line px-5 pb-5 pt-4">
              <textarea
                className="input min-h-[90px]"
                placeholder="Results-driven engineer with 8 years building scalable distributed systems. Shipped features used by millions at Stripe and Vercel. Passionate about developer tooling, performance, and clean abstractions."
                value={resume.summary ?? ""}
                onChange={e => set({ summary: e.target.value })}
              />
              <p className="mt-1 text-xs text-ink/40">{(resume.summary ?? "").split(/\s+/).filter(Boolean).length} words · aim for 30–60</p>
            </div>
          )}
        </div>

        {/* ── Experience ── */}
        <div className="card overflow-hidden">
          <SectionHeader id="experience" title="Work Experience" subtitle="List roles in reverse chronological order" open={open.has("experience")} onToggle={() => toggle("experience")} />
          {open.has("experience") && (
            <div className="border-t border-line px-5 pb-5 pt-4 space-y-4">
              {resume.experience.map((exp, i) => (
                <div key={i} className="rounded-lg border border-line bg-paper/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-signal uppercase tracking-widest">Position {i + 1}</span>
                    {resume.experience.length > 1 && (
                      <button className="text-xs text-amber hover:text-red-600 transition-colors" onClick={() => removeExp(i)}>Remove</button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <span className="label">Job title *</span>
                      <input className="input" placeholder="Software Engineer" value={exp.title} onChange={e => setExp(i, { title: e.target.value })} />
                    </div>
                    <div>
                      <span className="label">Company *</span>
                      <input className="input" placeholder="Stripe" value={exp.company} onChange={e => setExp(i, { company: e.target.value })} />
                    </div>
                    <div>
                      <span className="label">Location</span>
                      <input className="input" placeholder="San Francisco, CA" value={exp.location ?? ""} onChange={e => setExp(i, { location: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="label">Start</span>
                        <input className="input" placeholder="2021-06" value={exp.start ?? ""} onChange={e => setExp(i, { start: e.target.value })} />
                      </div>
                      <div>
                        <span className="label">End</span>
                        <input className="input" placeholder="Present" value={exp.end ?? ""} onChange={e => setExp(i, { end: e.target.value || null })} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="label">Achievements — one per line, lead with action verbs</span>
                    <textarea
                      className="input min-h-[110px] font-mono text-xs leading-relaxed"
                      placeholder={"Led migration from monolith to microservices, reducing deploy time by 60%\nBuilt real-time analytics pipeline processing 2M events/day\nMentored 4 junior engineers, 3 received promotions within 18 months"}
                      value={exp.bullets.join("\n")}
                      onChange={e => setExp(i, { bullets: e.target.value.split("\n") })}
                    />
                  </div>
                  <button
                    className="btn-ghost text-xs text-signal py-1.5"
                    onClick={() => aiRewrite("experience", i)}
                    disabled={busy !== null}
                  >
                    {busy === `rewrite-experience-${i}` ? "✦ Rewriting with AI…" : "✦ AI rewrite bullets"}
                  </button>
                </div>
              ))}
              <button className="btn-ghost text-sm w-full" onClick={addExp}>+ Add position</button>
            </div>
          )}
        </div>

        {/* ── Education ── */}
        <div className="card overflow-hidden">
          <SectionHeader id="education" title="Education" subtitle="Degrees, diplomas, certifications, bootcamps" open={open.has("education")} onToggle={() => toggle("education")} />
          {open.has("education") && (
            <div className="border-t border-line px-5 pb-5 pt-4 space-y-4">
              {resume.education.length === 0 && (
                <p className="text-sm text-ink/40 text-center py-2">No education added yet.</p>
              )}
              {resume.education.map((edu, i) => (
                <div key={i} className="rounded-lg border border-line bg-paper/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-signal uppercase tracking-widest">Education {i + 1}</span>
                    <button className="text-xs text-amber hover:text-red-600 transition-colors" onClick={() => removeEdu(i)}>Remove</button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <span className="label">School / University *</span>
                      <input className="input" placeholder="Stanford University" value={edu.school} onChange={e => setEdu(i, { school: e.target.value })} />
                    </div>
                    <div>
                      <span className="label">Degree</span>
                      <input className="input" placeholder="B.S. / M.S. / Ph.D." value={edu.degree ?? ""} onChange={e => setEdu(i, { degree: e.target.value })} />
                    </div>
                    <div>
                      <span className="label">Field of study</span>
                      <input className="input" placeholder="Computer Science" value={edu.field ?? ""} onChange={e => setEdu(i, { field: e.target.value })} />
                    </div>
                    <div>
                      <span className="label">Start year</span>
                      <input className="input" placeholder="2018-09" value={edu.start ?? ""} onChange={e => setEdu(i, { start: e.target.value })} />
                    </div>
                    <div>
                      <span className="label">Graduation / expected</span>
                      <input className="input" placeholder="2022-06" value={edu.end ?? ""} onChange={e => setEdu(i, { end: e.target.value })} />
                    </div>
                    <div>
                      <span className="label">GPA (optional)</span>
                      <input className="input" placeholder="3.9 / 4.0" value={edu.gpa ?? ""} onChange={e => setEdu(i, { gpa: e.target.value })} />
                    </div>
                    <div>
                      <span className="label">Honors / activities</span>
                      <input className="input" placeholder="Magna Cum Laude, Dean's List" value={(edu as any).honors ?? ""} onChange={e => setEdu(i, { ...(edu as any), honors: e.target.value })} />
                    </div>
                  </div>
                </div>
              ))}
              <button className="btn-ghost text-sm w-full" onClick={addEdu}>+ Add education</button>
            </div>
          )}
        </div>

        {/* ── Skills ── */}
        <div className="card overflow-hidden">
          <SectionHeader id="skills" title="Skills" subtitle="Technical skills, tools, frameworks, and competencies" open={open.has("skills")} onToggle={() => toggle("skills")} />
          {open.has("skills") && (
            <div className="border-t border-line px-5 pb-5 pt-4 space-y-3">
              <div>
                <span className="label">Skills — comma separated</span>
                <textarea
                  className="input min-h-[60px]"
                  placeholder="TypeScript, React, Node.js, PostgreSQL, AWS, Docker, Kubernetes, Python, GraphQL"
                  value={resume.skills.join(", ")}
                  onChange={e => set({ skills: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                />
              </div>
              {resume.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {resume.skills.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-full bg-signalSoft px-2.5 py-0.5 text-xs font-medium text-signal">
                      {s}
                      <button onClick={() => set({ skills: resume.skills.filter((_, j) => j !== i) })} className="hover:opacity-60 leading-none">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Projects ── */}
        <div className="card overflow-hidden">
          <SectionHeader id="projects" title="Projects" subtitle="Side projects, open-source contributions, and personal work" open={open.has("projects")} onToggle={() => toggle("projects")} />
          {open.has("projects") && (
            <div className="border-t border-line px-5 pb-5 pt-4 space-y-4">
              {(resume.projects ?? []).length === 0 && (
                <p className="text-sm text-ink/40 text-center py-2">No projects added yet.</p>
              )}
              {(resume.projects ?? []).map((proj, i) => (
                <div key={i} className="rounded-lg border border-line bg-paper/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-signal uppercase tracking-widest">Project {i + 1}</span>
                    <button className="text-xs text-amber hover:text-red-600 transition-colors" onClick={() => removeProj(i)}>Remove</button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <span className="label">Project name *</span>
                      <input className="input" placeholder="HireFlow AI" value={proj.name} onChange={e => setProj(i, { name: e.target.value })} />
                    </div>
                    <div>
                      <span className="label">URL</span>
                      <input className="input" placeholder="https://github.com/you/project" value={proj.url ?? ""} onChange={e => setProj(i, { url: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <span className="label">Description — one bullet per line</span>
                    <textarea
                      className="input min-h-[80px] font-mono text-xs leading-relaxed"
                      placeholder={"Built AI-powered resume optimizer with live ATS scoring\nUsed by 10,000+ job seekers, reduced time-to-apply by 70%\nStack: Next.js, TypeScript, PostgreSQL, Claude API"}
                      value={proj.bullets.join("\n")}
                      onChange={e => setProj(i, { bullets: e.target.value.split("\n") })}
                    />
                  </div>
                  <button
                    className="btn-ghost text-xs text-signal py-1.5"
                    onClick={() => aiRewrite("projects", i)}
                    disabled={busy !== null}
                  >
                    {busy === `rewrite-projects-${i}` ? "✦ Rewriting…" : "✦ AI rewrite bullets"}
                  </button>
                </div>
              ))}
              <button className="btn-ghost text-sm w-full" onClick={addProj}>+ Add project</button>
            </div>
          )}
        </div>

        {/* ── Certifications ── */}
        <div className="card overflow-hidden">
          <SectionHeader id="certifications" title="Certifications & Licenses" subtitle="Professional credentials and credentials" open={open.has("certifications")} onToggle={() => toggle("certifications")} />
          {open.has("certifications") && (
            <div className="border-t border-line px-5 pb-5 pt-4 space-y-3">
              {(resume.certifications ?? []).length === 0 && (
                <p className="text-sm text-ink/40 text-center py-2">No certifications added yet.</p>
              )}
              {(resume.certifications ?? []).map((cert, i) => (
                <div key={i} className="rounded-lg border border-line p-3 grid gap-2 sm:grid-cols-2">
                  <div className="sm:col-span-2 flex gap-2 items-center">
                    <input className="input flex-1" placeholder="AWS Solutions Architect — Professional" value={cert.name} onChange={e => setCert(i, { name: e.target.value })} />
                    <button className="text-amber hover:text-red-500 text-sm px-1 shrink-0" onClick={() => removeCert(i)}>✕</button>
                  </div>
                  <div>
                    <span className="label">Issuing org</span>
                    <input className="input" placeholder="Amazon Web Services" value={cert.issuer ?? ""} onChange={e => setCert(i, { issuer: e.target.value })} />
                  </div>
                  <div>
                    <span className="label">Date issued</span>
                    <input className="input" placeholder="2024-03" value={cert.date ?? ""} onChange={e => setCert(i, { date: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <span className="label">Credential URL</span>
                    <input className="input" placeholder="https://credly.com/..." value={cert.url ?? ""} onChange={e => setCert(i, { url: e.target.value })} />
                  </div>
                </div>
              ))}
              <button className="btn-ghost text-sm w-full" onClick={addCert}>+ Add certification</button>
            </div>
          )}
        </div>

        {/* ── Languages ── */}
        <div className="card overflow-hidden">
          <SectionHeader id="languages" title="Languages" subtitle="Human languages and proficiency levels" open={open.has("languages")} onToggle={() => toggle("languages")} />
          {open.has("languages") && (
            <div className="border-t border-line px-5 pb-5 pt-4 space-y-3">
              {(resume.languages ?? []).length === 0 && (
                <p className="text-sm text-ink/40 text-center py-2">No languages added yet.</p>
              )}
              {(resume.languages ?? []).map((lang, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input className="input flex-1" placeholder="Language name" value={lang.language} onChange={e => setLang(i, { language: e.target.value })} />
                  <select className="input w-36" value={lang.proficiency ?? "Intermediate"} onChange={e => setLang(i, { proficiency: e.target.value })}>
                    {PROFICIENCY_OPTIONS.map(p => <option key={p}>{p}</option>)}
                  </select>
                  <button className="text-amber hover:text-red-500 text-sm px-1 shrink-0" onClick={() => removeLang(i)}>✕</button>
                </div>
              ))}
              <button className="btn-ghost text-sm w-full" onClick={addLang}>+ Add language</button>
            </div>
          )}
        </div>

        {/* ── Volunteer ── */}
        <div className="card overflow-hidden">
          <SectionHeader id="volunteer" title="Volunteer Experience" subtitle="Community work, nonprofits, and cause-driven roles" open={open.has("volunteer")} onToggle={() => toggle("volunteer")} />
          {open.has("volunteer") && (
            <div className="border-t border-line px-5 pb-5 pt-4 space-y-4">
              {(resume.volunteer ?? []).length === 0 && (
                <p className="text-sm text-ink/40 text-center py-2">No volunteer experience added yet.</p>
              )}
              {(resume.volunteer ?? []).map((vol, i) => (
                <div key={i} className="rounded-lg border border-line bg-paper/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-signal uppercase tracking-widest">Volunteer {i + 1}</span>
                    <button className="text-xs text-amber hover:text-red-600 transition-colors" onClick={() => removeVol(i)}>Remove</button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <span className="label">Organization *</span>
                      <input className="input" placeholder="Red Cross" value={vol.organization} onChange={e => setVol(i, { organization: e.target.value })} />
                    </div>
                    <div>
                      <span className="label">Role *</span>
                      <input className="input" placeholder="Volunteer Coordinator" value={vol.role} onChange={e => setVol(i, { role: e.target.value })} />
                    </div>
                    <div>
                      <span className="label">Start</span>
                      <input className="input" placeholder="2020-01" value={vol.start ?? ""} onChange={e => setVol(i, { start: e.target.value })} />
                    </div>
                    <div>
                      <span className="label">End</span>
                      <input className="input" placeholder="Present" value={vol.end ?? ""} onChange={e => setVol(i, { end: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <span className="label">Impact — one bullet per line</span>
                    <textarea
                      className="input min-h-[70px] font-mono text-xs leading-relaxed"
                      placeholder={"Coordinated 50+ volunteers for annual fundraiser raising $25,000\nOrganized tech workshops for 200+ underserved youth"}
                      value={vol.bullets.join("\n")}
                      onChange={e => setVol(i, { bullets: e.target.value.split("\n") })}
                    />
                  </div>
                </div>
              ))}
              <button className="btn-ghost text-sm w-full" onClick={addVol}>+ Add volunteer experience</button>
            </div>
          )}
        </div>

        {/* ── Awards ── */}
        <div className="card overflow-hidden">
          <SectionHeader id="awards" title="Awards & Honors" subtitle="Recognition, scholarships, and achievements" open={open.has("awards")} onToggle={() => toggle("awards")} />
          {open.has("awards") && (
            <div className="border-t border-line px-5 pb-5 pt-4 space-y-3">
              {(resume.awards ?? []).length === 0 && (
                <p className="text-sm text-ink/40 text-center py-2">No awards added yet.</p>
              )}
              {(resume.awards ?? []).map((award, i) => (
                <div key={i} className="rounded-lg border border-line p-3 grid gap-2 sm:grid-cols-2">
                  <div className="sm:col-span-2 flex gap-2 items-center">
                    <input className="input flex-1" placeholder="Award name *" value={award.title} onChange={e => setAward(i, { title: e.target.value })} />
                    <button className="text-amber hover:text-red-500 text-sm px-1 shrink-0" onClick={() => removeAward(i)}>✕</button>
                  </div>
                  <div>
                    <span className="label">Issuer</span>
                    <input className="input" placeholder="Google, MIT, etc." value={award.issuer ?? ""} onChange={e => setAward(i, { issuer: e.target.value })} />
                  </div>
                  <div>
                    <span className="label">Date</span>
                    <input className="input" placeholder="2023-05" value={award.date ?? ""} onChange={e => setAward(i, { date: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <span className="label">Description</span>
                    <input className="input" placeholder="Brief description of the award" value={award.description ?? ""} onChange={e => setAward(i, { description: e.target.value })} />
                  </div>
                </div>
              ))}
              <button className="btn-ghost text-sm w-full" onClick={addAward}>+ Add award</button>
            </div>
          )}
        </div>

        {/* ── Publications ── */}
        <div className="card overflow-hidden">
          <SectionHeader id="publications" title="Publications & Research" subtitle="Papers, articles, blog posts, and patents" open={open.has("publications")} onToggle={() => toggle("publications")} />
          {open.has("publications") && (
            <div className="border-t border-line px-5 pb-5 pt-4 space-y-3">
              {(resume.publications ?? []).length === 0 && (
                <p className="text-sm text-ink/40 text-center py-2">No publications added yet.</p>
              )}
              {(resume.publications ?? []).map((pub, i) => (
                <div key={i} className="rounded-lg border border-line p-3 grid gap-2 sm:grid-cols-2">
                  <div className="sm:col-span-2 flex gap-2 items-center">
                    <input className="input flex-1" placeholder="Publication title *" value={pub.title} onChange={e => setPub(i, { title: e.target.value })} />
                    <button className="text-amber hover:text-red-500 text-sm px-1 shrink-0" onClick={() => removePub(i)}>✕</button>
                  </div>
                  <div>
                    <span className="label">Publisher / journal</span>
                    <input className="input" placeholder="IEEE, Nature, Medium..." value={pub.publisher ?? ""} onChange={e => setPub(i, { publisher: e.target.value })} />
                  </div>
                  <div>
                    <span className="label">Date</span>
                    <input className="input" placeholder="2024-01" value={pub.date ?? ""} onChange={e => setPub(i, { date: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <span className="label">URL</span>
                    <input className="input" placeholder="https://..." value={pub.url ?? ""} onChange={e => setPub(i, { url: e.target.value })} />
                  </div>
                </div>
              ))}
              <button className="btn-ghost text-sm w-full" onClick={addPub}>+ Add publication</button>
            </div>
          )}
        </div>

        {/* ── Target JD ── */}
        <div className="card overflow-hidden">
          <SectionHeader id="jd" title="Target Job Description" subtitle="Paste JD to unlock job-specific ATS scoring and keyword gaps" open={open.has("jd")} onToggle={() => toggle("jd")} />
          {open.has("jd") && (
            <div className="border-t border-line px-5 pb-5 pt-4 space-y-3">
              <textarea
                className="input min-h-[160px] font-mono text-xs leading-relaxed"
                placeholder={"Paste the full job description here to:\n• Get a real-time job-specific ATS score\n• See exactly which keywords you're missing\n• Enable AI to tailor your bullets to this role\n• Identify skills gaps before you apply"}
                value={jd}
                onChange={e => setJd(e.target.value)}
              />
              {jd && (
                <p className="text-xs text-signal font-medium">
                  ✓ {jd.split(/\s+/).filter(Boolean).length} words parsed — ATS score is now job-specific
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pb-8">
          <button className="btn-primary" onClick={save} disabled={busy !== null}>
            {busy === "save" ? "Saving…" : "Save resume"}
          </button>
          <a href="/dashboard" className="btn-ghost">View dashboard →</a>
          {notice && (
            <span className={`text-sm ${notice.type === "ok" ? "text-signal" : "text-amber"}`}>{notice.msg}</span>
          )}
        </div>
      </div>

      {/* ── RIGHT: Live ATS panel ── */}
      <aside className="lg:sticky lg:top-20 h-fit space-y-4">
        <div className="card p-5">
          <div className="flex items-baseline justify-between mb-3">
            <span className="label mb-0">Live ATS score</span>
            <span className={`font-mono text-4xl font-bold ${scoreColor}`}>
              {score}<span className="text-base font-normal text-ink/40">/100</span>
            </span>
          </div>

          <div className="h-2 rounded-full bg-line mb-2">
            <div className={`h-2 rounded-full transition-all duration-300 ${barColor}`} style={{ width: `${score}%` }} />
          </div>
          <div className={`text-center text-xs font-medium rounded-md py-1.5 mb-4 ${
            score >= 80 ? "bg-signalSoft text-signal" :
            score >= 65 ? "bg-amber/10 text-amber" :
            "bg-red-50 text-red-600"
          }`}>{scoreLabel}</div>

          <div className="space-y-2.5">
            {Object.entries(ats.breakdown).map(([k, v]) => (
              <div key={k}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-ink/60 capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</span>
                  <span className={`font-mono font-semibold ${v.score >= 70 ? "text-signal" : "text-amber"}`}>{v.score}</span>
                </div>
                <div className="h-1.5 rounded-full bg-line">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${v.score >= 70 ? "bg-signal" : v.score >= 50 ? "bg-amber" : "bg-red-400"}`}
                    style={{ width: `${v.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {ats.missingKeywords.length > 0 && (
            <div className="mt-4 rounded-md bg-amber/10 p-3">
              <p className="text-xs font-semibold text-amber mb-2">Missing keywords ({ats.missingKeywords.length})</p>
              <div className="flex flex-wrap gap-1">
                {ats.missingKeywords.slice(0, 12).map(k => (
                  <span key={k} className="rounded bg-amber/20 px-1.5 py-0.5 font-mono text-xs text-amber">{k}</span>
                ))}
              </div>
            </div>
          )}

          {ats.suggestions.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-ink/60">Suggestions</p>
              {ats.suggestions.slice(0, 5).map((s, i) => (
                <div key={i} className="flex gap-2 text-xs text-ink/60">
                  <span className="text-signal shrink-0 mt-0.5">→</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          )}

          {!jd && (
            <p className="mt-4 text-center text-xs text-ink/40">
              Add a job description to get a<br />job-specific score and keyword gaps
            </p>
          )}
        </div>

        <div className="card p-4">
          <p className="text-xs font-semibold text-ink/70 mb-2.5">4 quick wins</p>
          <ul className="space-y-2 text-xs text-ink/60">
            {[
              "Add numbers to bullets — %, $, users, or time saved",
              "Start every bullet with a strong past-tense verb",
              "Paste the job description to find missing keywords",
              "Use AI rewrite on your weakest bullets",
            ].map((tip, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-signal font-semibold shrink-0">{i + 1}</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-4">
          <p className="text-xs font-semibold text-ink/70 mb-2.5">Section completion</p>
          {[
            { id: "contact", label: "Contact", done: !!(resume.basics.name && resume.basics.email) },
            { id: "summary", label: "Summary", done: (resume.summary ?? "").length > 50 },
            { id: "experience", label: "Experience", done: resume.experience.some(e => e.company && e.title) },
            { id: "education", label: "Education", done: resume.education.some(e => e.school) },
            { id: "skills", label: "Skills", done: resume.skills.length >= 3 },
            { id: "projects", label: "Projects", done: (resume.projects ?? []).some(p => p.name) },
          ].map(({ id, label, done }) => (
            <div key={id} className="flex items-center justify-between py-1 text-xs">
              <span className={done ? "text-ink/70" : "text-ink/40"}>{label}</span>
              <span className={done ? "text-signal" : "text-line"}>{"●"}</span>
            </div>
          ))}
        </div>

        {/* ── EXPORT ── */}
        <div className="card p-4 mt-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-ink/40 mb-3">Export resume</h3>
          <ExportButtons resume={resume} filename={resume.basics.name || "resume"} />
        </div>
      </aside>
    </div>
  );
}
