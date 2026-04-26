import type { JobListing } from "../models.js";

// ─── Fetch state ──────────────────────────────────────────────────────────────

export interface FetchState {
  last_discovered_at: string; // ISO datetime — cursor for the next incremental fetch
  last_fetched_at: string; // ISO datetime — when the fetch ran
  total_fetched: number; // cumulative count of jobs returned (informational)
}

export interface StateStore {
  get(key: string): Promise<FetchState | null>;
  set(key: string, state: FetchState): Promise<void>;
}

// ─── Job store ────────────────────────────────────────────────────────────────

export interface JobStore {
  // Append-only: jobs already present (matched by id) are silently skipped.
  append(jobs: JobListing[]): Promise<void>;
  // Returns all stored jobs.
  listAll(): Promise<JobListing[]>;
}

// ─── Job status ───────────────────────────────────────────────────────────────

export type JobStatusValue = "not_processed" | "rejected" | "approved";

export interface JobStatus {
  status: JobStatusValue;
  updated_at: string; // ISO datetime
}

export interface StatusStore {
  getStatus(id: string): Promise<JobStatus | null>;
  setStatus(id: string, status: JobStatusValue): Promise<void>;
  // Returns the first job whose status is not_processed (or absent). Reads
  // the status map once so it stays O(1) I/O regardless of how many jobs
  // are passed in — maps cleanly to a single LEFT JOIN query in Postgres.
  findNextUnprocessed(jobs: JobListing[]): Promise<JobListing | null>;
}

// ─── Combined ─────────────────────────────────────────────────────────────────

// Single interface a backing store (JSON files, Postgres, etc.) should implement.
export type DataStore = StateStore & JobStore;
