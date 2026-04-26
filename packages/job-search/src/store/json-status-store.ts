import type { JobListing } from "../models.js";
import { JsonStore } from "./json-store.js";
import type { JobStatus, JobStatusValue, StatusStore } from "./types.js";

type StatusMap = Record<string, JobStatus>;

export class JsonStatusStore extends JsonStore implements StatusStore {
  private readonly FILENAME = "statuses.json";

  async getStatus(id: string): Promise<JobStatus | null> {
    return ((await this.readJson<StatusMap>(this.FILENAME)) ?? {})[id] ?? null;
  }

  async setStatus(id: string, status: JobStatusValue): Promise<void> {
    const map = (await this.readJson<StatusMap>(this.FILENAME)) ?? {};
    map[id] = { status, updated_at: new Date().toISOString() };
    await this.writeJson(this.FILENAME, map);
  }

  async findNextUnprocessed(jobs: JobListing[]): Promise<JobListing | null> {
    const map = (await this.readJson<StatusMap>(this.FILENAME)) ?? {};
    return (
      jobs.find((j) => {
        const s = map[j.id]?.status;
        return !s || s === "not_processed";
      }) ?? null
    );
  }
}
