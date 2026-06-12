import { prisma } from "./prisma";
import { JobSource } from "@prisma/client";
import { randomUUID } from "crypto";

async function fetchGreenhouseJobs(board: string) {
  const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`);
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({ jobs: [] }));
  const name = board.charAt(0).toUpperCase() + board.slice(1);
  return (data.jobs ?? []).slice(0, 100).map((j: any) => ({
    source: JobSource.GREENHOUSE,
    externalId: String(j.id),
    title: j.title ?? "Untitled",
    company: name,
    location: j.location?.name ?? null,
    remote: (j.location?.name ?? "").toLowerCase().includes("remote"),
    url: j.absolute_url ?? "",
    description: (j.content ?? "").replace(/<[^>]*>/g, "").slice(0, 5000),
    extractedSkills: [] as string[],
    postedAt: j.updated_at ? new Date(j.updated_at) : new Date(),
    isActive: true,
  }));
}

async function fetchLeverJobs(company: string) {
  const res = await fetch(`https://api.lever.co/v0/postings/${company}?mode=json`);
  if (!res.ok) return [];
  const data = await res.json().catch(() => []);
  const name = company.charAt(0).toUpperCase() + company.slice(1);
  return (Array.isArray(data) ? data : []).slice(0, 100).map((j: any) => ({
    source: JobSource.LEVER,
    externalId: String(j.id),
    title: j.text ?? "Untitled",
    company: name,
    location: j.categories?.location ?? null,
    remote: (j.categories?.location ?? "").toLowerCase().includes("remote") || (j.tags ?? []).some((t: string) => t.toLowerCase().includes("remote")),
    url: j.hostedUrl ?? "",
    description: (j.descriptionPlain ?? j.description ?? "").replace(/<[^>]*>/g, "").slice(0, 5000),
    extractedSkills: (j.tags ?? []).slice(0, 20) as string[],
    postedAt: j.createdAt ? new Date(j.createdAt) : new Date(),
    isActive: true,
  }));
}

export async function syncConfiguredBoards() {
  const greenhouse = (process.env.GREENHOUSE_BOARDS ?? "").split(",").map(s => s.trim()).filter(Boolean);
  const lever = (process.env.LEVER_COMPANIES ?? "").split(",").map(s => s.trim()).filter(Boolean);
  let synced = 0, failed = 0;

  const upsertJob = async (job: any) => {
    try {
      await prisma.job.upsert({
        where: { source_externalId: { source: job.source, externalId: job.externalId } },
        update: { title: job.title, location: job.location, remote: job.remote, url: job.url, description: job.description, extractedSkills: job.extractedSkills, postedAt: job.postedAt, isActive: true },
        create: { id: randomUUID(), ...job },
      });
      synced++;
    } catch (_e) { failed++; }
  };

  for (const board of greenhouse) {
    try { const jobs = await fetchGreenhouseJobs(board); await Promise.all(jobs.map(upsertJob)); }
    catch (_e) { failed++; }
  }
  for (const company of lever) {
    try { const jobs = await fetchLeverJobs(company); await Promise.all(jobs.map(upsertJob)); }
    catch (_e) { failed++; }
  }

  return { synced, failed };
}
