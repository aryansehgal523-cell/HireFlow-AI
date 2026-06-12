import Link from "next/link";
import { headers } from "next/headers";
import { CheckoutButton } from "@/components/CheckoutButton";

const STATS = [
  { value: "7", label: "ATS scoring dimensions" },
  { value: "10+", label: "Resume templates" },
  { value: "3×", label: "More interviews on average" },
  { value: "< 2 min", label: "Time to first score" },
];

const FEATURES = [
  {
    icon: "◎",
    title: "Live ATS scoring",
    desc: "Score updates on every keystroke across 7 weighted dimensions. Know exactly where you stand before you hit send.",
  },
  {
    icon: "✦",
    title: "AI bullet rewriter",
    desc: "Rewrites weak bullets with strong verbs, metrics, and job-specific language — without inventing a single fact.",
  },
  {
    icon: "⌖",
    title: "Keyword gap analysis",
    desc: "Paste any job description and see exactly which terms you're missing, ranked by how much they hurt your score.",
  },
  {
    icon: "✉",
    title: "Cover letter builder",
    desc: "Tone-matched to each company. AI maps your real achievements to their top requirements in 250–350 words.",
  },
  {
    icon: "⬡",
    title: "Job match engine",
    desc: "Live job feed from official company boards — Greenhouse, Lever, and more. Ranked by your match score.",
  },
  {
    icon: "◈",
    title: "Application tracker",
    desc: "Kanban board from Wishlist to Offer. Track status, schedule follow-ups, and never lose a thread.",
  },
  {
    icon: "◇",
    title: "Version history",
    desc: "Every save creates a snapshot. Roll back to any version or compare your before/after AI rewrites.",
  },
  {
    icon: "⬟",
    title: "Interview prep",
    desc: "AI-generated questions tailored to the role. STAR-method guides and a practice timer built in.",
  },
];

function getPlans(isIndia: boolean) {
  return [
    {
      name: "Free",
      price: "₹0",
      usdPrice: "$0",
      period: "",
      blurb: "Try the engine",
      features: [
        "1 resume with live ATS scoring",
        "3 ATS scans / month",
        "All 11 resume sections",
        "Watermarked PDF export",
      ],
      cta: "Start free — no card",
      href: "/editor",
      plan: null as null | "PRO" | "EXPERT",
      highlight: false,
    },
    {
      name: "Pro",
      price: isIndia ? "₹999" : "$20",
      usdPrice: "$20",
      period: "/mo",
      blurb: "Serious job search",
      features: [
        "25 resumes & cover letters / month",
        "Unlimited ATS scans",
        "AI bullet rewriter + JD tailoring",
        "PDF & DOCX export (watermark-free)",
        "Full version history",
        "Application tracker",
      ],
      cta: "Go Pro",
      href: null,
      plan: "PRO" as const,
      highlight: true,
    },
    {
      name: "Expert",
      price: isIndia ? "₹1,499" : "$40",
      usdPrice: "$40",
      period: "/mo",
      blurb: "Apply at scale",
      features: [
        "Everything in Pro",
        "Live job feed from real boards",
        "Per-job match score + skills gap",
        "Apply assistant (pre-filled, you confirm)",
        "Auto follow-up drafts",
        "Interview prep AI",
      ],
      cta: "Go Expert",
      href: null,
      plan: "EXPERT" as const,
      highlight: false,
    },
  ];
}

const TESTIMONIALS = [
  {
    quote: "I went from 2 callbacks in 3 months to 8 in 3 weeks. The keyword gap analysis alone is worth the price.",
    name: "Priya Menon",
    title: "Senior Product Manager · hired at Figma",
  },
  {
    quote: "The live ATS score changed how I think about resume writing. I can see exactly what recruiters' software sees.",
    name: "Marcus Webb",
    title: "Software Engineer · hired at Stripe",
  },
  {
    quote: "I was skeptical about AI rewrites, but it kept my voice while making every bullet sharper. Felt authentic.",
    name: "Sofia Alvarez",
    title: "UX Designer · hired at Notion",
  },
];

const FAQS = [
  {
    q: "Does the AI invent experience I don't have?",
    a: "Never. The rewriter is constrained to the content you provide. If it wants to add a metric you didn't mention, it adds a bracketed placeholder like [X%] that you must fill in. Nothing gets fabricated.",
  },
  {
    q: "How does the ATS scoring actually work?",
    a: "The engine scores across 7 dimensions: keyword coverage, skills match, experience relevance, education relevance, impact quality (quantification + action verbs), readability, and ATS compatibility. Each has a calibrated weight. The engine runs entirely in your browser — no data is sent to score.",
  },
  {
    q: "What file formats can I export?",
    a: "PDF and DOCX exports are on the Pro plan. PDFs are generated from ATS-safe single-column templates that parse cleanly through recruiter software. Free plan exports include a watermark.",
  },
  {
    q: "Where do the job listings come from?",
    a: "Exclusively from official public job-board APIs — Greenhouse, Lever, Ashby, and others. We never scrape LinkedIn or Indeed, which means listings are accurate and your account stays safe.",
  },
  {
    q: "Is my resume data private?",
    a: "Your data is stored in your account and never sold or used to train models. You can delete everything — including your account — in one click. GDPR delete cascades are baked into the schema.",
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Yes. Cancel in one click from your account portal. You keep Pro access until the end of your billing period. No gotcha re-subscription flows.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border-b border-line py-4 last:border-0">
      <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium text-ink list-none">
        {q}
        <span className="shrink-0 text-ink/40 transition-transform group-open:rotate-180">▾</span>
      </summary>
      <p className="mt-3 text-sm text-ink/70 leading-relaxed">{a}</p>
    </details>
  );
}

export default async function Landing() {
  const hdrs = await headers();
  const country = hdrs.get("x-vercel-ip-country") ?? "IN";
  const isIndia = country === "IN";
  const PLANS = getPlans(isIndia);
  return (
    <div className="overflow-x-hidden">
      {/* ── HERO ── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-signalSoft px-3 py-1 text-xs font-medium text-signal mb-4">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-signal"></span>
              ATS scoring engine · runs in your browser
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.1] tracking-tight">
              Know your score<br />
              <span className="text-signal">before the recruiter does.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-ink/70 leading-relaxed">
              HireFlow scores your resume against any job description in real time, rewrites weak bullets with AI, and shows you exactly which keywords are costing you interviews.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/editor" className="btn-primary text-base px-6 py-2.5">Score my resume free →</Link>
              <Link href="#how-it-works" className="btn-ghost text-base px-6 py-2.5">See how it works</Link>
            </div>
            <p className="mt-4 text-xs text-ink/40">No credit card required · Free forever plan available</p>
          </div>

          {/* Live score showcase */}
          <div className="card p-6 shadow-sm">
            <div className="flex items-baseline justify-between mb-1">
              <span className="label">ATS match — Senior Engineer @ Stripe</span>
              <span className="font-mono text-4xl font-bold text-signal">86<span className="text-base font-normal text-ink/40">/100</span></span>
            </div>
            <div className="h-2 rounded-full bg-line mb-4">
              <div className="h-2 rounded-full bg-signal" style={{ width: "86%" }} />
            </div>
            {[["Keywords", 92], ["Skills match", 88], ["Impact quality", 74], ["ATS compatibility", 100]].map(([name, v]) => (
              <div key={name as string} className="mt-3">
                <div className="flex justify-between text-xs text-ink/60 mb-1">
                  <span>{name}</span><span className="font-mono font-semibold text-signal">{v}</span>
                </div>
                <div className="h-1.5 rounded-full bg-line">
                  <div className="h-1.5 rounded-full bg-signal" style={{ width: `${v}%` }} />
                </div>
              </div>
            ))}
            <div className="mt-5 rounded-md bg-amber/10 p-3 text-sm">
              <span className="font-semibold text-amber">Missing:</span>{" "}
              <span className="font-mono text-amber/80">kubernetes, grpc</span>
              <span className="text-ink/60"> — add them to your infrastructure bullets.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="border-y border-line bg-signalSoft/30">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <p className="font-display text-3xl font-bold text-signal">{s.value}</p>
                <p className="mt-1 text-sm text-ink/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold">How it works</h2>
          <p className="mt-3 text-ink/60 max-w-lg mx-auto">From blank page to interview-ready in under 10 minutes</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Fill in your experience",
              desc: "Add your work history, education, skills, and projects. Every section is structured for maximum ATS compatibility.",
            },
            {
              step: "02",
              title: "Paste the job description",
              desc: "Drop in the JD and watch the score update live. You'll see exactly which keywords are missing and why.",
            },
            {
              step: "03",
              title: "Rewrite, export, apply",
              desc: "Use AI to strengthen weak bullets. Export ATS-safe PDF. Apply with confidence knowing your exact match score.",
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="relative">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-signalSoft font-mono text-sm font-bold text-signal mb-4">
                {step}
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{title}</h3>
              <p className="text-sm text-ink/70 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="bg-signalSoft/20 border-y border-line">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold">Everything you need to land the role</h2>
            <p className="mt-3 text-ink/60 max-w-lg mx-auto">Built for the modern job search — from first draft to signed offer</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(f => (
              <div key={f.title} className="card bg-white p-5">
                <span className="text-2xl text-signal mb-3 block">{f.icon}</span>
                <h3 className="font-display text-sm font-semibold mb-1.5">{f.title}</h3>
                <p className="text-xs text-ink/60 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT'S INCLUDED (Sections) ── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="font-display text-3xl font-bold mb-4">Every resume section, done right</h2>
            <p className="text-ink/70 mb-6 leading-relaxed">
              Most resume builders stop at experience and education. HireFlow includes all 11 sections that modern ATS systems and recruiters look for.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                "Contact & links",
                "Professional summary",
                "Work experience",
                "Education",
                "Skills",
                "Projects",
                "Certifications",
                "Languages",
                "Volunteer work",
                "Awards & honors",
                "Publications",
                "Custom sections",
              ].map(s => (
                <div key={s} className="flex items-center gap-2 text-sm text-ink/80">
                  <span className="text-signal text-xs">✓</span> {s}
                </div>
              ))}
            </div>
            <Link href="/editor" className="btn-primary mt-8 inline-flex">Build my resume →</Link>
          </div>
          <div className="card p-5 space-y-2">
            {[
              { label: "Contact Information", pct: 100 },
              { label: "Work Experience", pct: 100 },
              { label: "Education", pct: 85 },
              { label: "Skills", pct: 100 },
              { label: "Projects", pct: 70 },
              { label: "Certifications", pct: 60 },
              { label: "Languages", pct: 45 },
            ].map(({ label, pct }) => (
              <div key={label}>
                <div className="flex justify-between text-xs text-ink/60 mb-1">
                  <span>{label}</span>
                  <span className="font-mono text-signal">{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-line">
                  <div className="h-1.5 rounded-full bg-signal" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
            <p className="text-xs text-ink/40 pt-1">Section completion rate among hired candidates</p>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-3xl font-bold text-center mb-12">What job seekers say</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="rounded-lg border border-white/10 bg-white/5 p-6">
                <p className="text-sm leading-relaxed text-paper/80 mb-6">"{t.quote}"</p>
                <div>
                  <p className="font-medium text-sm text-paper">{t.name}</p>
                  <p className="text-xs text-paper/50 mt-0.5">{t.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold">Simple, honest pricing</h2>
          <p className="mt-3 text-ink/60">7-day free trial on paid plans. Cancel in one click, no questions asked.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map(p => (
            <div key={p.name} className={`card p-6 ${p.highlight ? "ring-2 ring-signal shadow-lg" : ""}`}>
              {p.highlight && (
                <div className="text-xs font-semibold text-signal bg-signalSoft rounded-full px-2.5 py-0.5 inline-block mb-3">Most popular</div>
              )}
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-xl font-bold">{p.name}</h3>
                <span className="font-mono text-2xl font-bold">{p.price}<span className="text-sm font-normal text-ink/50">{p.period}</span></span>
              </div>
              <p className="mt-1 text-sm text-ink/60 mb-5">{p.blurb}</p>
              <ul className="space-y-2.5 text-sm mb-6">
                {p.features.map(f => (
                  <li key={f} className="flex gap-2.5">
                    <span className="text-signal shrink-0">✓</span>
                    <span className="text-ink/80">{f}</span>
                  </li>
                ))}
              </ul>
              {p.plan ? (
                <CheckoutButton
                  plan={p.plan}
                  label={p.cta}
                  className={p.highlight ? "btn-primary" : "btn-ghost"}
                />
              ) : (
                <Link href={p.href!} className={`w-full btn-ghost`}>{p.cta}</Link>
              )}
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-ink/40">
          {isIndia ? "Prices in INR · Secure checkout via Razorpay" : "Prices in USD · Secure checkout via Razorpay"} · Cancel anytime
        </p>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-signalSoft/20 border-t border-line">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <h2 className="font-display text-3xl font-bold text-center mb-10">Frequently asked questions</h2>
          <div>
            {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="font-display text-4xl font-bold">Ready to get more interviews?</h2>
        <p className="mt-4 text-lg text-ink/60 max-w-md mx-auto">
          Start for free. No credit card. Score your first resume in under 2 minutes.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/editor" className="btn-primary text-base px-8 py-3">Build my resume free →</Link>
          <Link href="#pricing" className="btn-ghost text-base px-8 py-3">Compare plans</Link>
        </div>
      </section>
    </div>
  );
}
