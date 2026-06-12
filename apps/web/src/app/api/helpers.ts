import { NextResponse } from "next/server";
import { ZodSchema } from "zod";
import { AuthError } from "@/lib/auth";
import { EntitlementError } from "@/lib/entitlements";
import { AiConfigError } from "@/lib/ai";

export function handleError(e: unknown): NextResponse {
  if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
  if (e instanceof EntitlementError)
    return NextResponse.json({ error: e.message, upgrade: true }, { status: 402 });
  if (e instanceof AiConfigError)
    return NextResponse.json({ error: e.message }, { status: 503 });
  console.error(e);
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}

export async function parseBody<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw Object.assign(new Error("Invalid request body"), { zod: parsed.error });
  }
  return parsed.data;
}
