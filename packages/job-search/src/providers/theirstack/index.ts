import { createHash } from "crypto";
import https from "https";
import type { JobListing, JobProvider } from "../../models.js";
import type { JobStore, StateStore } from "../../store/types.js";
import {
  DAYS_BACK,
  DESCRIPTION_KEYWORDS,
  EXCLUDED_DESCRIPTION_PATTERNS,
  EXCLUDED_TITLE_PATTERNS,
  JOB_TITLES,
  PAGES_TO_FETCH,
  SENIORITY_LEVELS,
  TECH_SLUGS,
} from "./config.js";

// ─── TheirStack API types ─────────────────────────────────────────────────────

interface SearchPayload {
  limit: number;
  page: number;
  posted_at_max_age_days?: number;
  posted_at_gte?: string;
  discovered_at_gte?: string;
  remote?: boolean;
  job_title_pattern_or?: string[];
  job_description_pattern_or?: string[];
  job_description_pattern_is_case_insensitive?: boolean;
  job_technology_slug_or?: string[];
  job_seniority_or?: string[];
  job_title_pattern_not?: string[];
  job_description_pattern_not?: string[];
  order_by?: Array<{ field: string; desc: boolean }>;
  blur_company_data?: boolean;
  include_total_results?: boolean;
}

interface TheirStackJob {
  job_title?: string;
  description?: string;
  url?: string;
  company?: string;
  country_code?: string;
  location?: string;
  date_posted?: string;
  discovered_at?: string;
  seniority?: string;
  employment_statuses?: string[];
  remote?: boolean;
  salary_string?: string | null;
  min_annual_salary_usd?: number | null;
  max_annual_salary_usd?: number | null;
  technology_slugs?: string[];
}

interface TheirStackResponse {
  data?: TheirStackJob[];
  metadata?: { total_results?: number | null };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(source: string, company: string, title: string): string {
  return createHash("sha1").update(`${source}:${company}:${title}`.toLowerCase()).digest("hex").slice(0, 12);
}

// Hash the "what to match" part of the config — excludes all date params.
// Changing any of these values produces a new key, resetting the cursor.
function buildFilterKey(): string {
  const canonical = {
    titles: [...JOB_TITLES].sort(),
    slugs: [...TECH_SLUGS].sort(),
    seniority: [...SENIORITY_LEVELS].sort(),
    excludedTitles: [...EXCLUDED_TITLE_PATTERNS].sort(),
    excludedDesc: [...EXCLUDED_DESCRIPTION_PATTERNS].sort(),
    keywords: [...DESCRIPTION_KEYWORDS].sort(),
    remote: true,
  };
  return createHash("sha1").update(JSON.stringify(canonical)).digest("hex").slice(0, 16);
}

function post(apiKey: string, body: SearchPayload): Promise<TheirStackResponse> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = https.request(
      {
        hostname: "api.theirstack.com",
        path: "/v1/jobs/search",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          Authorization: `Bearer ${apiKey}`,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk: string) => {
          data += chunk;
        });
        res.on("end", () => {
          if ((res.statusCode ?? 0) >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            return;
          }
          try {
            resolve(JSON.parse(data) as TheirStackResponse);
          } catch {
            reject(new Error(`Invalid JSON: ${data.slice(0, 200)}`));
          }
        });
      },
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

function buildRawText(job: TheirStackJob): string {
  const salary =
    job.min_annual_salary_usd || job.max_annual_salary_usd
      ? `Salary: $${job.min_annual_salary_usd ?? "?"}–$${job.max_annual_salary_usd ?? "?"} USD`
      : (job.salary_string ?? undefined);
  return [
    job.job_title,
    job.company,
    job.location,
    job.country_code,
    job.seniority ? `Seniority: ${job.seniority}` : undefined,
    job.employment_statuses?.length ? `Type: ${job.employment_statuses.join(", ")}` : undefined,
    salary,
    job.date_posted ? `Posted: ${job.date_posted}` : undefined,
    job.description?.slice(0, 700),
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 1000);
}

function toJobListing(job: TheirStackJob): JobListing {
  const source = "theirstack";
  const title = job.job_title ?? "";
  const company = job.company ?? "";
  return {
    id: generateId(source, company, title),
    source,
    url: job.url ?? "",
    title,
    company,
    location: job.location ?? job.country_code,
    remote: job.remote,
    salary:
      job.min_annual_salary_usd || job.max_annual_salary_usd || job.salary_string
        ? {
            min: job.min_annual_salary_usd ?? undefined,
            max: job.max_annual_salary_usd ?? undefined,
            currency: "USD",
            raw: job.salary_string ?? undefined,
          }
        : undefined,
    posted_at: job.date_posted,
    tags: job.technology_slugs,
    raw_text: buildRawText(job),
  };
}

function dedup(jobs: TheirStackJob[]): TheirStackJob[] {
  const seen = new Set<string>();
  return jobs.filter((j) => {
    const key = `${j.company ?? ""}|${j.job_title ?? ""}`.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export class TheirStackProvider implements JobProvider {
  readonly name = "theirstack";

  constructor(
    private readonly apiKey: string,
    private readonly stateStore?: StateStore,
    private readonly jobStore?: JobStore,
  ) {}

  private basePayload(overrides: Partial<SearchPayload> = {}): SearchPayload {
    return {
      limit: 25,
      page: 0,
      posted_at_max_age_days: DAYS_BACK,
      remote: true,
      job_title_pattern_or: JOB_TITLES,
      job_description_pattern_or: DESCRIPTION_KEYWORDS,
      job_description_pattern_is_case_insensitive: true,
      job_technology_slug_or: TECH_SLUGS,
      job_seniority_or: SENIORITY_LEVELS,
      job_title_pattern_not: EXCLUDED_TITLE_PATTERNS,
      job_description_pattern_not: EXCLUDED_DESCRIPTION_PATTERNS,
      order_by: [{ field: "discovered_at", desc: true }],
      include_total_results: true,
      ...overrides,
    };
  }

  private async fetchPage(
    page: number,
    dateFilter: Pick<SearchPayload, "posted_at_gte" | "discovered_at_gte">,
  ): Promise<TheirStackJob[]> {
    process.stderr.write(`  Fetching page ${page} (limit 25)…\n`);
    const result = await post(this.apiKey, this.basePayload({ page, ...dateFilter }));
    const jobs = result.data ?? [];
    process.stderr.write(`  → ${jobs.length} listings\n`);
    return jobs;
  }

  async fetch(): Promise<JobListing[]> {
    const filterKey = buildFilterKey();
    const state = (await this.stateStore?.get(filterKey)) ?? null;

    // posted_at_max_age_days is always sent via basePayload (mandatory API filter).
    // For incremental runs, additionally filter by discovered_at_gte to narrow to new listings.
    const dateFilter: Pick<SearchPayload, "discovered_at_gte"> = state
      ? { discovered_at_gte: state.last_discovered_at }
      : {};

    if (state) {
      process.stderr.write(`Incremental fetch — new since ${state.last_discovered_at}\n`);
    } else {
      process.stderr.write(`First run — fetching last ${DAYS_BACK} days\n`);
    }

    const all: TheirStackJob[] = [];
    for (let page = 0; page < PAGES_TO_FETCH; page++) {
      const batch = await this.fetchPage(page, dateFilter);
      all.push(...batch);
      if (batch.length < 25) break;
    }

    const unique = dedup(all);

    // On incremental runs, strip the boundary job we already processed last time.
    // The API uses >=, so the job exactly at last_discovered_at may be re-returned.
    const cursor = state?.last_discovered_at;
    const fresh = cursor ? unique.filter((j) => j.discovered_at && j.discovered_at > cursor) : unique;

    process.stderr.write(`Total unique: ${unique.length} | New: ${fresh.length}\n`);

    const listings = fresh.map(toJobListing);

    if (listings.length > 0) {
      // Persist new jobs first (append-only, deduped by id).
      await this.jobStore?.append(listings);

      // Advance the cursor to the highest discovered_at in this batch.
      const maxDiscoveredAt = fresh
        .map((j) => j.discovered_at)
        .filter((d): d is string => !!d)
        .sort()
        .at(-1);

      if (maxDiscoveredAt) {
        await this.stateStore?.set(filterKey, {
          last_discovered_at: maxDiscoveredAt,
          last_fetched_at: new Date().toISOString(),
          total_fetched: (state?.total_fetched ?? 0) + listings.length,
        });
      }
    }

    return listings;
  }

  async count(): Promise<number> {
    process.stderr.write("Free count mode — no credits consumed.\n");
    const filterKey = buildFilterKey();
    const state = (await this.stateStore?.get(filterKey)) ?? null;

    const dateFilter: Pick<SearchPayload, "discovered_at_gte"> = state
      ? { discovered_at_gte: state.last_discovered_at }
      : {};

    const result = await post(this.apiKey, this.basePayload({ limit: 1, blur_company_data: true, ...dateFilter }));
    const total = result.metadata?.total_results ?? 0;
    process.stderr.write(`New jobs matching filters: ${total}\n`);
    return total;
  }
}
