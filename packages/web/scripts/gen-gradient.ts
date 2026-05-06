// Generate randomized parameters for the GrainGradient cover.
// Usage:
//   pnpm --filter web run gen:gradient            # one gradient
//   pnpm --filter web run gen:gradient -- --count=8  # array of N

import { generateGradient } from "../src/lib/gradient.ts";

const countArg = process.argv.find((a) => a.startsWith("--count="))?.split("=")[1];
const count = countArg ? Math.max(1, Number(countArg)) : 1;
const out = count === 1 ? generateGradient() : Array.from({ length: count }, generateGradient);
process.stdout.write(JSON.stringify(out, null, 2) + "\n");
