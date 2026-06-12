// Job ingestion from OFFICIAL public APIs only.
// Greenhouse and Lever expose public, documented job-board endpoints per company.
// LinkedIn/Indeed scraping is deliberately excluded (terms-of-service violation).

import { prisma } from "./prisma";
import { extractSkills } from "@hireflow/ats-engine";
import { JobSource } from "@prisma/client";

interface NormalizedJob {
  source: JobSource;
  externalId: string;
  title: string;
  company: string;
  location?: string;
  remote: boolean;
  url: string;
  description: string;
  postedAt?: Date;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchGreenhouse(boardToken: string): Promise<NormalizedJob[]> {
  const res = await fetch(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs?content=true`,
    { next: { revalidate: 0 } }
  );
  if (!res.ok) throw new Error(`Greenhouse ${boardToken}: ${res.status}`);
  const data = await res.json();
  return (data.jobs ?? []).map((j: any) => ({
    source: "GREENHOUSE" as JobSource,
    externalId: String(j.id),
    title: j.title,
    company: boardToken,
    location: j.location?.name,
    remote: /remote/i.test(j.location?.name ?? ""),
    url: j.absolute_url,
    description: stripHtml(j.content ?? ""),
    postedAt: j.updated_at ? new Date(j.updated_at) : undefined,
  }));
}

export async function fetchLever(company: string): Promise<NormalizedJob[]> {
  const res = await fetch(
    `https://api.lever.co/v0/postings/${encodeURIComponent(company)}?mode=json`,
    { next: { revalidate: 0 } }
  );
  if (!res.ok) throw new Error(`Lever ${company}: ${res.status}`);
  const data = await res.json();
  return (data ?? []).map((j: any) => ({
    source: "LEVER" as JobSource,
    externalId: j.id,
    title: j.text,
    company,
    location: j.categories?.location,
    remote: /remote/i.test(`${j.categories?.location ?? ""} ${j.workplaceType ?? ""}`),
    url: j.hostedUrl,
    description: stripHtml(j.descriptionPlain ?? j.description ?? ""),
    postedAt: j.createdAt ? new Date(j.createdAt) : undefined,
  }));
}

export async function upsertJobs(jobs: NormalizedJob[]): Promise<number> {
  let count = 0;
  for (const j of jobs) {
    await prisma.job.upsert({
      where: { source_externalId: { source: j.source, externalId: j.externalId } },
      update: { isActive: true, description: j.description, title: j.title },
      create: {
        ...j,
        extractedSkills: extractSkills(`${j.title}\n${j.description}`),
      },
    });
    count++;
  }
  return count;
}

/** Sync a configured list of company boards. Driven by env or admin panel. */
export async function syncConfiguredBoards(): Promise<{ synced: number }> {
  const greenhouse = (process.env.GREENHOUSE_BOARDS ?? "stripe,vercel").split(",").filter(Boolean);
  const lever = (process.env.LEVER_COMPANIES ?? "").split(",").filter(Boolean);
  let synced = 0;
  for (const board of greenhouse) {
    try {
      synced += await upsertJobs(await fetchGreenhouse(board.trim()));
    } catch (e) {
      console.error("greenhouse sync failed", board, e);
    }
  }
  for (const c of lever) {
    try {
      synced += await upsertJobs(await fetchLever(c.trim()));
    } catch (e) {
      console.error("lever sync failed", c, e);
    }
  }
  return { synced };
}
