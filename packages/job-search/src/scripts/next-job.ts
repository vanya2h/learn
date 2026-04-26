/**
 * Outputs the next unprocessed job as JSON, or `null` if none remain.
 * Designed to be called once per review turn — minimal stdout payload.
 *
 * Usage: tsx src/scripts/next-job.ts
 */
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { JsonJobStore } from "../store/json-job-store.js";
import { JsonStatusStore } from "../store/json-status-store.js";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "../../.data");

const jobStore = new JsonJobStore(dataDir);
const statusStore = new JsonStatusStore(dataDir);

const allJobs = await jobStore.listAll();
const next = await statusStore.findNextUnprocessed(allJobs);

process.stdout.write(JSON.stringify(next, null, 2) + "\n");
