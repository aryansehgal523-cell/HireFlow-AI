"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { AuthGate } from "@/components/AuthGate";

const CATEGORIES = [
  { id: "behavioral",  label: "Behavioral (STAR)", color: "text-signal",      bg: "bg-signalSoft"  },
  { id: "technical",   label: "Technical",          color: "text-blue-600",   bg: "bg-blue-50"     },
  { id: "leadership",  label: "Leadership",          color: "text-purple-600", bg: "bg-purple-50"   },
  { id: "culture",     label: "Culture Fit",         color: "text-amber",      bg: "bg-amber/10"    },
  { id: "situational", label: "Situational",         color: "text-pink-600",   bg: "bg-pink-50"     },
];

const BASE_QUESTIONS: Record<string, { q: string; hint: string }[]> = {
  behavioral: [
    { q: "Tell me about a time you dealt with a difficult stakeholder.", hint: "Focus on empathy, active listening, and the outcome you achieved together." },
    { q: "Describe a project where you had to meet an impossible deadline.", hint: "Show how you prioritized, communicated scope changes, and delivered value despite constraints." },
    { q: "Tell me about a time you failed. What did you learn?", hint: "Own the failure fully. Demonstrate self-awareness and the concrete change you made afterward." },
    { q: "Give an example of when you had to influence without authority.", hint: "Highlight how you built consensus, used data, or found shared goals to move others." },
    { q: "Describe the most impactful project you've worked on.", hint: "Lead with the business impact (numbers!), your specific role, and what you'd do differently." },
    { q: "Tell me about a time you disagreed with your manager's decision.", hint: "Show you can voice disagreement professionally, then commit fully to the final call." },
    { q: "Describe a time you had to learn something completely new on the job.", hint: "Demonstrate learning velocity — how fast you ramped and the result it produced." },
    { q: "Tell me about a time you had to deliver critical feedback.", hint: "Show emotional intelligence, specific vs general feedback, and a positive relationship outcome." },
  ],
  technical: [
    { q: "Walk me through how you'd design a URL shortener like bit.ly.", hint: "Cover load balancing, hashing strategy, database choice, and how you'd scale to billions of URLs." },
    { q: "How would you debug a production issue with p99 latency spikes?", hint: "Start from the symptoms — trace, metrics, logs. Show a systematic root-cause methodology." },
    { q: "Explain the tradeoffs between SQL and NoSQL databases.", hint: "Cover consistency models, schema flexibility, query patterns, and when you'd choose each." },
    { q: "How does a CDN work, and when would you use one?", hint: "Explain caching, PoPs, cache invalidation strategy, and dynamic vs static content tradeoffs." },
    { q: "Describe how you'd approach migrating a monolith to microservices.", hint: "Strangler fig pattern, seam identification, data consistency, and how to avoid the distributed monolith trap." },
    { q: "What's the difference between optimistic and pessimistic concurrency?", hint: "Explain with examples, mention OCC with version fields and when each approach is appropriate." },
    { q: "How would you implement a rate limiter?", hint: "Cover token bucket vs sliding window, Redis-backed distributed state, and failure behavior." },
  ],
  leadership: [
    { q: "How do you set goals for your team?", hint: "OKRs or similar — show how you cascade strategy to individual ownership and measure outcomes." },
    { q: "Tell me about a time you had to let someone go.", hint: "Focus on fair process, support given before the decision, and the team dynamic afterward." },
    { q: "How do you handle underperformance on your team?", hint: "Show a coaching-first approach: clear expectations, early feedback, documented PIPs, and compassion." },
    { q: "How do you build psychological safety on your team?", hint: "Concrete practices — blameless post-mortems, celebrating well-intentioned failures, modeling vulnerability." },
    { q: "What's your approach to one-on-ones?", hint: "Employee-agenda-first, growth-focused, consistent cadence. Show you actually listen and follow through." },
    { q: "How do you prioritize when everything is urgent?", hint: "Frameworks are fine, but show judgment: impact × confidence ÷ effort, plus stakeholder communication." },
  ],
  culture: [
    { q: "What kind of environment helps you do your best work?", hint: "Be honest. Match to what you know of their culture — remote, pace, autonomy, feedback frequency." },
    { q: "Where do you see yourself in 5 years?", hint: "Show ambition without over-promising. Tie growth to adding value at this company." },
    { q: "What's a non-obvious opinion you hold strongly?", hint: "Shows intellectual courage. Pick something genuine and defend it with evidence, not just assertion." },
    { q: "How do you stay current in your field?", hint: "Mention specific sources, projects, or communities — not just 'I read blog posts'." },
    { q: "What do you look for when joining a new team?", hint: "Show self-awareness: culture, growth, autonomy, mission. Be specific about what actually matters to you." },
  ],
  situational: [
    { q: "You're 2 days from a major launch and find a critical bug. What do you do?", hint: "Show risk assessment, escalation instinct, stakeholder communication, and options thinking." },
    { q: "Two senior engineers can't agree on the right architecture. What do you do?", hint: "Facilitate — frame the tradeoffs, bring in data or a third opinion, set a decision deadline." },
    { q: "Your top engineer just got a competing offer. How do you respond?", hint: "Counter-offer considerations, what matters to them beyond money, retention vs forced departure." },
    { q: "You inherit a codebase with no tests and mounting tech debt. How do you approach it?", hint: "Boy scout rule, test coverage for new work, dedicated debt sprints, stakeholder buy-in strategy." },
  ],
};

const CATEGORY_TIPS: Record<string, string[]> = {
  behavioral: [
    "Prepare 6–8 core stories that flex across multiple questions.",
    "Lead with the result — recruiters skim for impact first.",
    "Every story needs a number. If you don't have one, estimate.",
    "Keep each answer under 2 minutes unless asked to elaborate.",
  ],
  technical: [
    "Think out loud — interviewers evaluate your problem-solving process.",
    "Clarify constraints before diving in. Ask about scale, traffic, latency.",
    "Offer multiple solutions with explicit tradeoffs before picking one.",
    "Mention real tools you've used, not just textbook concepts.",
  ],
  leadership: [
    "Use numbers: team size, scope, timeline, business impact.",
    "Show a range — strategy AND hands-on moments.",
    "Demonstrate that you've given hard feedback and handled conflict.",
    "Mention failures you've overseen, not just successes.",
  ],
  culture: [
    "Research the company's engineering blog and recent launches.",
    "Reference specific people, features, or decisions you admire.",
    "Be honest about environment preferences — mismatches cost everyone.",
    "Have a genuine question about the team's biggest current challenge.",
  ],
  situational: [
    "Walk through your reasoning — show the decision tree.",
    "Acknowledge uncertainty and how you'd gather more information.",
    "Show stakeholder awareness — who's affected and how do you communicate?",
    "End with what you'd do differently, not just what you'd do.",
  ],
};

const TIMER_OPTIONS = [60, 120, 180, 300];

export default function InterviewPrep() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [companies, setCompanies] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [category, setCategory] = useState("behavioral");
  const [qIdx, setQIdx] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [answer, setAnswer] = useState("");
  const [timer, setTimer] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load user's tracked companies
  const loadCompanies = useCallback(async () => {
    try {
      const res = await fetch("/api/applications");
      if (res.ok) {
        const data = await res.json();
        const unique = [...new Set<string>(
          (data.applications ?? [])
            .filter((a: { status: string }) => a.status !== "rejected")
            .map((a: { company: string }) => a.company)
            .filter(Boolean)
        )];
        setCompanies(unique);
        if (unique.length > 0) setSelectedCompany(unique[0]);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (isSignedIn) loadCompanies();
  }, [isSignedIn, loadCompanies]);

  // Build questions — inject personalized culture question when company selected
  const questions = (() => {
    const base = BASE_QUESTIONS[category] ?? [];
    if (category === "culture" && selectedCompany) {
      return [
        { q: `Why do you want to work at ${selectedCompany} specifically?`, hint: `Be specific to ${selectedCompany} — product decisions, engineering culture, mission, recent launches. Generic answers bomb.` },
        ...base.filter(q => !q.q.startsWith("Why do you want to work")),
      ];
    }
    return base;
  })();

  const current = questions[qIdx];

  useEffect(() => {
    setQIdx(0);
    setShowHint(false);
    setShowAnswer(false);
    setAnswer("");
    stopTimer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, selectedCompany]);

  function startTimer(secs: number) {
    stopTimer();
    setTimer(secs);
    setElapsed(0);
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setElapsed(e => {
        if (e + 1 >= secs) { stopTimer(); return secs; }
        return e + 1;
      });
    }, 1000);
  }

  function stopTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    intervalRef.current = null;
  }

  function next() {
    setQIdx(i => (i + 1) % questions.length);
    setShowHint(false); setShowAnswer(false); setAnswer("");
    stopTimer(); setElapsed(0); setTimer(null);
  }

  function prev() {
    setQIdx(i => (i - 1 + questions.length) % questions.length);
    setShowHint(false); setShowAnswer(false); setAnswer("");
    stopTimer(); setElapsed(0); setTimer(null);
  }

  const timerPct = timer ? Math.round((elapsed / timer) * 100) : 0;
  const timerColor = timerPct >= 90 ? "bg-red-400" : timerPct >= 70 ? "bg-amber" : "bg-signal";
  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <AuthGate
        title="Personalized interview prep"
        description="Sign in to get interview questions tailored to the companies you're applying to, with STAR-method guidance and a practice timer."
        features={[
          "Questions personalized to your tracked companies",
          "Culture-fit questions specific to each company",
          "STAR method hints for every behavioral question",
          "Practice timer with visual progress bar",
          "Behavioral, Technical, Leadership, Situational — 30+ questions",
        ]}
        returnPath="/interview"
      />
    );
  }

  const firstName = user.firstName ?? user.emailAddresses?.[0]?.emailAddress?.split("@")[0] ?? "there";

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Interview Prep</h1>
        <p className="text-sm text-ink/50 mt-0.5">
          Practice with a timer · STAR-method hints · {Object.values(BASE_QUESTIONS).flat().length}+ questions across 5 categories
        </p>
      </div>

      {/* Personalized company selector */}
      {companies.length > 0 && (
        <div className="card p-4 mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-ink/70">
            <span className="text-signal">◎</span>
            Practicing for:
          </div>
          <div className="flex flex-wrap gap-2">
            {companies.map(c => (
              <button
                key={c}
                onClick={() => { setSelectedCompany(c); setCategory("culture"); }}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${selectedCompany === c && category === "culture"
                  ? "bg-signal text-white border-signal"
                  : "border-line text-ink/60 hover:border-signal/50 hover:text-signal"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          {selectedCompany && (
            <p className="text-xs text-ink/40 w-full">
              Culture-fit questions are now tailored to {selectedCompany} — based on your application tracker
            </p>
          )}
        </div>
      )}

      {companies.length === 0 && (
        <div className="rounded-lg border border-line bg-signalSoft/30 px-4 py-3 text-sm text-ink/60 mb-6 flex items-center gap-2">
          <span>💡</span>
          <span>
            Add companies in your <a href="/tracker" className="text-signal underline">Application Tracker</a> to get culture-fit questions personalized to each company.
          </span>
        </div>
      )}

      {/* STAR guide */}
      <div className="card p-5 mb-6">
        <h2 className="font-display text-sm font-semibold text-ink/50 uppercase tracking-widest mb-3">STAR Method</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { letter: "S", word: "Situation", desc: "Set the context. Where, when, and who." },
            { letter: "T", word: "Task", desc: "What was your responsibility or goal?" },
            { letter: "A", word: "Action", desc: "What specific steps did YOU take?" },
            { letter: "R", word: "Result", desc: "Measurable outcome. Numbers where possible." },
          ].map(s => (
            <div key={s.letter} className="flex gap-2.5">
              <div className="h-7 w-7 rounded-full bg-signalSoft text-signal flex items-center justify-center font-bold text-sm shrink-0">{s.letter}</div>
              <div>
                <p className="font-semibold text-xs">{s.word}</p>
                <p className="text-xs text-ink/50 mt-0.5 leading-snug">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[200px,1fr]">
        {/* Category nav */}
        <div className="space-y-1">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`w-full text-left rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${category === c.id ? `${c.bg} ${c.color}` : "hover:bg-signalSoft/30 text-ink/60"}`}
            >
              {c.label}
              <span className="ml-1 text-xs opacity-50">({BASE_QUESTIONS[c.id]?.length ?? 0}{c.id === "culture" && selectedCompany ? "+1" : ""})</span>
            </button>
          ))}
        </div>

        {/* Question card */}
        <div className="space-y-4">
          {/* Progress */}
          <div className="flex items-center justify-between text-xs text-ink/40">
            <span>Question {qIdx + 1} of {questions.length}</span>
            <div className="flex gap-1">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setQIdx(i); setShowHint(false); setShowAnswer(false); }}
                  className={`h-1.5 w-5 rounded-full transition-colors ${i === qIdx ? "bg-signal" : i < qIdx ? "bg-signal/30" : "bg-line"}`}
                />
              ))}
            </div>
          </div>

          {/* Question */}
          <div className="card p-6">
            {current?.q.includes(selectedCompany) && selectedCompany && (
              <div className="inline-flex items-center gap-1 rounded-full bg-signal/10 px-2 py-0.5 text-xs text-signal font-medium mb-3">
                ◎ Personalized for {selectedCompany}
              </div>
            )}
            <p className="font-display text-lg font-semibold leading-snug">{current?.q}</p>

            {showHint && (
              <div className="mt-4 rounded-md bg-signalSoft p-3 text-sm text-signal">
                <span className="font-semibold">Hint: </span>{current?.hint}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => setShowHint(!showHint)} className="btn-ghost text-xs py-1.5">
                {showHint ? "Hide hint" : "Show hint"}
              </button>
              <button onClick={prev} className="btn-ghost text-xs py-1.5">← Prev</button>
              <button onClick={next} className="btn-primary text-xs py-1.5">Next →</button>
            </div>
          </div>

          {/* Timer */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-ink/60 uppercase tracking-wide">Practice timer</p>
              {timer && (
                <span className={`font-mono text-lg font-bold ${timerPct >= 90 ? "text-red-500" : "text-ink"}`}>
                  {fmtTime(timer - elapsed)}
                </span>
              )}
            </div>
            {timer && (
              <div className="h-2 rounded-full bg-line mb-3">
                <div className={`h-2 rounded-full transition-all ${timerColor}`} style={{ width: `${timerPct}%` }} />
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {TIMER_OPTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => startTimer(s)}
                  className={`btn-ghost text-xs py-1.5 px-3 ${running && timer === s ? "bg-signalSoft text-signal" : ""}`}
                >
                  {fmtTime(s)}
                </button>
              ))}
              {running && <button onClick={stopTimer} className="btn-ghost text-xs py-1.5 px-3 text-amber">Stop</button>}
            </div>
          </div>

          {/* Answer scratchpad */}
          <div className="card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-ink/60 uppercase tracking-wide">
                Your answer, {firstName} (scratchpad)
              </p>
              <button onClick={() => setShowAnswer(!showAnswer)} className="text-xs text-ink/40 hover:text-ink">
                {showAnswer ? "Hide" : "Show"}
              </button>
            </div>
            {showAnswer && (
              <textarea
                className="input min-h-[140px] text-sm"
                placeholder="Write your STAR answer here to practice. This is private — never saved or sent anywhere."
                value={answer}
                onChange={e => setAnswer(e.target.value)}
              />
            )}
          </div>

          {/* Tips */}
          <div className="card p-4">
            <p className="text-xs font-semibold text-ink/60 uppercase tracking-wide mb-3">Pro tips for {CATEGORIES.find(c => c.id === category)?.label}</p>
            <ul className="space-y-2 text-xs text-ink/60">
              {(CATEGORY_TIPS[category] ?? []).map((t, i) => (
                <li key={i} className="flex gap-2"><span className="text-signal">→</span>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
