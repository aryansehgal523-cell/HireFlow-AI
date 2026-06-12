// AI pipeline layer. Provider-agnostic over Anthropic and OpenAI via fetch —
// no SDK lock-in, easy to swap models per feature in MODEL_ROUTING.

type Provider = "anthropic" | "openai";

interface ChatResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

const MODEL_ROUTING: Record<string, { provider: Provider; model: string }> = {
  resume_rewrite: { provider: "anthropic", model: "claude-sonnet-4-6" },
  cover_letter: { provider: "anthropic", model: "claude-sonnet-4-6" },
  ats_suggestions: { provider: "anthropic", model: "claude-haiku-4-5-20251001" },
  job_match_summary: { provider: "anthropic", model: "claude-haiku-4-5-20251001" },
};

export async function chat(
  feature: keyof typeof MODEL_ROUTING,
  system: string,
  user: string,
  maxTokens = 1500
): Promise<ChatResult> {
  const route = MODEL_ROUTING[feature];

  if (route.provider === "anthropic") {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new AiConfigError("ANTHROPIC_API_KEY is not set.");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: route.model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return {
      text: data.content?.map((b: any) => b.text ?? "").join("") ?? "",
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
      model: route.model,
    };
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new AiConfigError("OPENAI_API_KEY is not set.");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: route.model,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return {
    text: data.choices?.[0]?.message?.content ?? "",
    inputTokens: data.usage?.prompt_tokens ?? 0,
    outputTokens: data.usage?.completion_tokens ?? 0,
    model: route.model,
  };
}

export async function embed(text: string): Promise<number[]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new AiConfigError("OPENAI_API_KEY is required for embeddings.");
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text.slice(0, 8000) }),
  });
  if (!res.ok) throw new Error(`OpenAI embeddings ${res.status}`);
  const data = await res.json();
  return data.data[0].embedding;
}

export class AiConfigError extends Error {
  status = 503;
}

// ---------- Prompt chains ----------

export function bulletRewritePrompt(bullets: string[], role: string, jd?: string) {
  return {
    system: `You are an expert resume writer who has reviewed thousands of resumes as a hiring manager.
Rewrite resume bullets to be powerful, quantified, and ATS-friendly.
Rules:
- Start each bullet with a strong past-tense action verb.
- Keep every fact truthful to the original bullet; never invent metrics. If a bullet lacks a metric, add a bracketed placeholder like [X%] the user must fill in.
- 12–28 words per bullet. No first person. No periods of fluff.
- Naturally include relevant terminology from the job description when it is truthful.
Return ONLY a JSON array of strings, one rewritten bullet per input bullet, same order. No markdown fences.`,
    user: `Role: ${role}\n${jd ? `Target job description:\n${jd.slice(0, 4000)}\n` : ""}Bullets to rewrite:\n${bullets
      .map((b, i) => `${i + 1}. ${b}`)
      .join("\n")}`,
  };
}

export function coverLetterPrompt(opts: {
  resumeText: string;
  jd: string;
  company: string;
  tone: string;
}) {
  return {
    system: `You write cover letters that get interviews. Voice: ${opts.tone}.
Rules:
- 250–350 words, 3–4 paragraphs, no address block, start with "Dear Hiring Manager," unless a name is given.
- Open with a specific, non-generic hook tied to the company or role.
- Map 2–3 concrete achievements from the resume to the job's top requirements; use real details from the resume only.
- Sound like a confident human professional: vary sentence length, no clichés ("I am writing to express"), no buzzword stacking.
- Close with a direct, low-friction call to action.
Return only the letter text.`,
    user: `Company: ${opts.company}\n\nJob description:\n${opts.jd.slice(0, 4000)}\n\nCandidate resume:\n${opts.resumeText.slice(0, 4000)}`,
  };
}

/** Parse a JSON array out of a model response defensively. */
export function parseJsonArray(text: string): string[] {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("Model did not return a JSON array.");
  const arr = JSON.parse(cleaned.slice(start, end + 1));
  if (!Array.isArray(arr) || !arr.every((x) => typeof x === "string")) {
    throw new Error("Model returned malformed array.");
  }
  return arr;
}
