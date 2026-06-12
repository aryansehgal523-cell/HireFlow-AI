import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { consume, recordAiUsage } from "@/lib/entitlements";
import { chat, bulletRewritePrompt, parseJsonArray } from "@/lib/ai";
import { handleError, parseBody } from "../../helpers";

const schema = z.object({
  bullets: z.array(z.string().min(3).max(500)).min(1).max(12),
  role: z.string().min(2).max(120),
  jobDescription: z.string().max(20000).optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    await consume(user, "ai_rewrite");
    const { bullets, role, jobDescription } = await parseBody(req, schema);
    const p = bulletRewritePrompt(bullets, role, jobDescription);
    const result = await chat("resume_rewrite", p.system, p.user);
    await recordAiUsage(user.id, "resume_rewrite", result.model, result.inputTokens, result.outputTokens);
    return NextResponse.json({ bullets: parseJsonArray(result.text) });
  } catch (e) {
    return handleError(e);
  }
}
