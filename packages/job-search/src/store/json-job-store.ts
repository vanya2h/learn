import type { JobListing } from "../models.js";
import { JsonStore } from "./json-store.js";
import type { JobStore } from "./types.js";

const FILENAME = "jobs.json";

export class JsonJobStore extends JsonStore implements JobStore {
  async append(jobs: JobListing[]): Promise<void> {
    const existing = (await this.readJson<JobListing[]>(FILENAME)) ?? [];
    const existingIds = new Set(existing.map((j) => j.id));
    const fresh = jobs.filter((j) => !existingIds.has(j.id));
    if (fresh.length === 0) return;
    await this.writeJson(FILENAME, [...existing, ...fresh]);
  }

  async listAll(): Promise<JobListing[]> {
    return (await this.readJson<JobListing[]>(FILENAME)) ?? [];
  }
}
