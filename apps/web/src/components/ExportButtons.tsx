"use client";

import { useState } from "react";
import type { ResumeContent } from "@hireflow/ats-engine";

interface Props {
  resume: ResumeContent;
  filename?: string;
}

type Format = "pdf" | "docx";

async function downloadExport(resume: ResumeContent, format: Format, filename: string) {
  const res = await fetch(`/api/export/${format}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume, filename }),
  });

  if (res.status === 401) { window.location.href = "/sign-in"; return; }
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.error ?? `Export failed (${res.status})`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename || "resume"}.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportButtons({ resume, filename }: Props) {
  const [busy, setBusy] = useState<Format | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handle(format: Format) {
    setBusy(format);
    setError(null);
    try {
      await downloadExport(resume, format, filename ?? resume.basics?.name ?? "resume");
    } catch (e: any) {
      setError(e.message ?? "Export failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          onClick={() => handle("pdf")}
          disabled={busy !== null}
          className="flex-1 btn-primary py-2 text-sm font-semibold disabled:opacity-60"
        >
          {busy === "pdf" ? "Generating…" : "⬇ Export PDF"}
        </button>
        <button
          onClick={() => handle("docx")}
          disabled={busy !== null}
          className="flex-1 btn-ghost py-2 text-sm font-semibold disabled:opacity-60"
        >
          {busy === "docx" ? "Generating…" : "⬇ Export DOCX"}
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}
      <p className="text-xs text-ink/40 text-center">
        Free plan exports include a watermark · <a href="/#pricing" className="text-signal hover:underline">Upgrade to Pro</a> for clean files
      </p>
    </div>
  );
}
