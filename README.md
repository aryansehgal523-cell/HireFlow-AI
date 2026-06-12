# HireFlow AI

**From Resume to Interview — Fully Optimized.**

AI-powered resume builder, real ATS scoring engine, tailored cover letters, and a job-match feed built on official job-board APIs.

## What's real in this codebase (Phase 1)

| System | Status |
|---|---|
| ATS scoring engine (`packages/ats-engine`) | ✅ Working + unit-tested. Keyword extraction with a skills dictionary, weighted JD coverage, lexical semantic similarity, impact-quality analysis (quantification, action verbs, weak-phrase detection), readability, formatting checks. Pure TypeScript — runs server-side *and* client-side for live scoring while typing. |
| Resume editor with **live** ATS score | ✅ `/editor` — score, breakdown, missing keywords, suggestions update on every keystroke |
| AI pipelines (`src/lib/ai.ts`) | ✅ Provider-agnostic (Anthropic + OpenAI), bullet rewrite chain (truth-preserving — never invents metrics), cover letter chain with tone control, embeddings, defensive JSON parsing |
| Resume CRUD + automatic version snapshots | ✅ `/api/resumes` |
| Cover letter generation + persistence | ✅ `/api/ai/cover-letter` |
| Entitlements & metering | ✅ Plan gates + monthly usage caps enforced on every paid route (`src/lib/entitlements.ts`) |
| Stripe billing | ✅ Checkout with 7-day trial, customer portal, webhook → plan sync |
| Job ingestion | ✅ Greenhouse + Lever **official public board APIs**, skill extraction on ingest, cron-protected sync endpoint |
| Database schema | ✅ Full Prisma schema: users, subscriptions, usage metering, master profile, resumes/versions, jobs/matches, applications/events/follow-ups, automation runs, AI usage, referrals, coupons, feature flags, audit log. pgvector-ready. |
| Infra | ✅ docker-compose (Postgres+pgvector, Redis), GitHub Actions CI, security headers |

## A note on "auto-apply"

LinkedIn Easy Apply automation and LinkedIn/Indeed scraping violate those platforms' terms of service and get user accounts banned. This product intentionally ships a **semi-automated apply assistant** instead (Expert plan): jobs come from official APIs, resumes/cover letters are auto-tailored per job, application forms are pre-filled, and **the human confirms each submission**. The `AutomationRun` model and `NEEDS_HUMAN` state exist for exactly this flow.

## Quick start

```bash
# 1. Infra
docker compose up -d

# 2. Install
npm install

# 3. Env
cp .env.example apps/web/.env
# add ANTHROPIC_API_KEY for AI features; Stripe keys for billing

# 4. Database
npm run db:migrate

# 5. Build engine + run
npm run build -w packages/ats-engine
npm run dev
```

Open http://localhost:3000/editor — the live ATS score works with zero API keys. Without Clerk keys, a deterministic dev user is used so every flow is testable locally.

```bash
# Run the ATS engine test suite
npm test
```

## Architecture

```
hireflow/
├── packages/
│   └── ats-engine/          # Pure-TS scoring engine (isomorphic, tested)
│       ├── src/keywords.ts  #   extraction, skills dictionary, similarity
│       ├── src/index.ts     #   7-factor weighted scoring
│       └── test/            #   node:test suite
└── apps/web/                # Next.js 14 App Router (frontend + API)
    ├── prisma/schema.prisma # Full data model (pgvector)
    └── src/
        ├── lib/             # prisma, auth, ai, stripe, jobs, entitlements
        └── app/
            ├── api/         # ats, ai, resumes, jobs, stripe routes
            ├── editor/      # live-scoring resume editor
            └── dashboard/
```

**Request flow for a paid feature:** route → `requireUser()` → `consume(user, feature, metric)` (402 with `upgrade:true` if gated/capped — the UI turns this into an upgrade prompt) → AI chain → `recordAiUsage()` → persist.

**Plan sync:** Stripe webhooks are the single source of truth. `syncSubscription()` maps price → plan and updates `User.plan` transactionally.

## Roadmap (build order for remaining phases)

2. **Auth production wiring** — install `@clerk/nextjs`, flip the marked block in `src/lib/auth.ts`, add middleware + sign-in pages, webhook to sync Clerk users.
3. **Exports** — PDF via `@react-pdf/renderer` (ATS-safe single-column templates), DOCX via `docx` npm; S3 storage with presigned URLs; watermark layer for FREE plan.
4. **Imports & master profile** — resume PDF parsing (pdf-parse + AI structuring into `ResumeContent`), GitHub API import, LinkedIn *data-export upload* (not scraping).
5. **Job matching v2** — pgvector embeddings on jobs + resumes, `JobMatch` computation worker (BullMQ on Redis), match feed UI with per-job tailoring.
6. **Apply assistant (Expert)** — Playwright-driven pre-fill with human confirmation, `AutomationRun` step streaming over WebSockets.
7. **Application tracker, follow-up drafts, interview prep, analytics dashboard, admin panel, referral/coupon UI, i18n, PWA.**

## Production checklist

- [ ] Clerk production instance + middleware
- [ ] Stripe live prices set in env; webhook endpoint registered
- [ ] `CRON_SECRET` rotated; job sync scheduled (Vercel Cron or GH Actions)
- [ ] Postgres with pgvector (Neon/Supabase/RDS), connection pooling (pgbouncer/Prisma Accelerate)
- [ ] Rate limiting at the edge (Vercel WAF / upstash-ratelimit on AI routes)
- [ ] Sentry + structured logs
- [ ] Backups + GDPR delete flow (cascades are already in the schema)
