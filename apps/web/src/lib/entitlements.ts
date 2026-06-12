import { Plan, User } from "@prisma/client";
import { prisma } from "./prisma";

type Metric = "resumesGenerated" | "coverLettersGenerated" | "atsScans" | "autoApplications";

export const PLAN_LIMITS: Record<Plan, Record<Metric, number>> = {
  FREE: { resumesGenerated: 1, coverLettersGenerated: 0, atsScans: 3, autoApplications: 0 },
  PRO: { resumesGenerated: 50, coverLettersGenerated: 50, atsScans: 1000, autoApplications: 0 },
  EXPERT: { resumesGenerated: 200, coverLettersGenerated: 200, atsScans: 5000, autoApplications: 100 },
};

export const PLAN_FEATURES: Record<Plan, Set<string>> = {
  FREE: new Set(["ats_basic"]),
  PRO: new Set([
    "ats_basic", "ats_full", "ai_rewrite", "cover_letter", "templates_pro",
    "jd_matching", "export_pdf", "export_docx", "versioning", "imports", "analytics",
  ]),
  EXPERT: new Set([
    "ats_basic", "ats_full", "ai_rewrite", "cover_letter", "templates_pro",
    "jd_matching", "export_pdf", "export_docx", "versioning", "imports", "analytics",
    "apply_assistant", "job_feed_live", "auto_tailor", "follow_ups", "strategy_engine",
  ]),
};

export class EntitlementError extends Error {
  status = 402;
  constructor(public reason: "feature" | "limit", message: string) {
    super(message);
  }
}

function currentPeriod(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}

export function hasFeature(plan: Plan, feature: string): boolean {
  return PLAN_FEATURES[plan].has(feature);
}

/** Throws EntitlementError (402) if the feature is gated or the monthly cap is hit. */
export async function consume(user: User, feature: string, metric?: Metric): Promise<void> {
  if (!hasFeature(user.plan, feature)) {
    throw new EntitlementError(
      "feature",
      `This feature requires the ${feature.startsWith("apply") || feature.startsWith("auto") ? "Expert" : "Pro"} plan.`
    );
  }
  if (!metric) return;

  // Dev fallback user (no DB row) — skip metering
  if (user.id === "dev-user-local") return;

  try {
    const { start, end } = currentPeriod();
    const period = await prisma.usagePeriod.upsert({
      where: { userId_periodStart: { userId: user.id, periodStart: start } },
      update: {},
      create: { userId: user.id, periodStart: start, periodEnd: end },
    });

    const limit = PLAN_LIMITS[user.plan][metric];
    if ((period as any)[metric] >= limit) {
      throw new EntitlementError("limit", `Monthly limit reached (${limit}). Upgrade to continue.`);
    }
    await prisma.usagePeriod.update({
      where: { id: period.id },
      data: { [metric]: { increment: 1 } },
    });
  } catch (e) {
    if (e instanceof EntitlementError) throw e;
    if (process.env.NODE_ENV === "production") throw e;
    // DB unavailable in dev — skip limit tracking, allow the request
  }
}

export async function recordAiUsage(
  userId: string,
  feature: string,
  model: string,
  inputTokens: number,
  outputTokens: number
) {
  if (userId === "dev-user-local") return; // no DB row in dev fallback mode
  try {
    await prisma.aiUsageEvent.create({
      data: { userId, feature, model, inputTokens, outputTokens },
    });
  } catch (_e) {
    if (process.env.NODE_ENV === "production") throw _e;
    // DB unavailable in dev — silently skip logging
  }
}
