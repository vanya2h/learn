import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { TheirStackProvider } from "./providers/theirstack/index.js";
import { JsonJobStore } from "./store/json-job-store.js";
import { JsonStateStore } from "./store/json-state-store.js";

const IS_COUNT = process.argv.includes("--count");
const API_KEY = process.env.THEIRSTACK_API_KEY;

if (!API_KEY) {
  process.stderr.write("Error: THEIRSTACK_API_KEY env var is not set.\n");
  process.exit(1);
}

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "../.data");
const stateStore = new JsonStateStore(dataDir);
const jobStore = new JsonJobStore(dataDir);
const provider = new TheirStackProvider(API_KEY, stateStore, jobStore);

try {
  if (IS_COUNT) {
    const total = await provider.count();
    process.stdout.write(JSON.stringify({ total_results: total }) + "\n");
  } else {
    const jobs = await provider.fetch();
    process.stdout.write(JSON.stringify(jobs, null, 2) + "\n");
  }
} catch (err) {
  process.stderr.write(`Fatal: ${(err as Error).message}\n`);
  process.exit(1);
}
