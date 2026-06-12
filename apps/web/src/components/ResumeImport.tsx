"use client";

import { useRef, useState } from "react";

interface Props {
  onImport: (resume: Record<string, unknown>) => void;
}

export function ResumeImport({ onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "uploading" | "parsing" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const processFile = async (file: File) => {
    setState("uploading");
    setError("");

    const form = new FormData();
    form.append("file", file);

    try {
      setState("parsing");
      const res = await fetch("/api/resume/import", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Import failed");
        setState("error");
        return;
      }

      setState("done");
      onImport(data.resume);
    } catch (_e) {
      setError("Upload failed — check your connection and try again");
      setState("error");
    }
  };

  const handleFile = (file: File | null | undefined) => {
    if (!file) return;
    processFile(file);
  };

  const busy = state === "uploading" || state === "parsing";

  return (
    <div className="mb-6">
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        onClick={() => !busy && inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors cursor-pointer
          ${dragOver ? "border-signal bg-signalSoft/40" : "border-line hover:border-signal/50 hover:bg-signalSoft/20"}
          ${busy ? "pointer-events-none opacity-70" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={e => handleFile(e.target.files?.[0])}
        />

        {state === "parsing" ? (
          <>
            <div className="h-8 w-8 rounded-full border-2 border-signal border-t-transparent animate-spin" />
            <p className="text-sm font-medium text-ink">AI is reading your resume…</p>
            <p className="text-xs text-ink/50">This takes 5–10 seconds</p>
          </>
        ) : state === "done" ? (
          <>
            <span className="text-2xl text-signal">✓</span>
            <p className="text-sm font-medium text-ink">Resume imported successfully</p>
            <p className="text-xs text-ink/50">Click to import a different file</p>
          </>
        ) : (
          <>
            <span className="text-2xl text-ink/30">⬆</span>
            <div>
              <p className="text-sm font-medium text-ink">
                Drop your resume here or <span className="text-signal">browse</span>
              </p>
              <p className="text-xs text-ink/50 mt-0.5">PDF, DOCX, or TXT · max 5 MB · AI auto-fills all fields</p>
            </div>
          </>
        )}
      </div>

      {state === "error" && (
        <p className="mt-2 text-xs text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
