/**
 * Sets the status of a job in the registry.
 *
 * Usage: tsx src/scripts/set-status.ts <approved|rejected> <id>
 *   or via package.json shortcuts:
 *     pnpm approve -- <id>
 *     pnpm reject  -- <id>
 */
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { JsonStatusStore } from "../store/json-status-store.js";
import type { JobStatusValue } from "../store/types.js";

const [, , statusArg, id] = process.argv;
const VALID: JobStatusValue[] = ["approved", "rejected"];

if (!statusArg || !id || !(VALID as string[]).includes(statusArg)) {
  process.stderr.write(`Usage: set-status <${VALID.join("|")}> <id>\n`);
  process.exit(1);
}

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "../../.data");
const store = new JsonStatusStore(dataDir);

await store.setStatus(id, statusArg as JobStatusValue);
process.stderr.write(`[job-search] ${id} → ${statusArg}\n`);
