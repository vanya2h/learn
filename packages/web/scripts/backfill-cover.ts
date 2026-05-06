// Backfill `cover` JSON for any CustomCurriculum row that doesn't have one.
// Usage: pnpm --filter web run backfill:cover

import { Prisma } from "@prisma/client-generated";
import { generateGradient } from "../src/lib/gradient.ts";
import { db } from "../src/server/db.ts";

const rows = await db.customCurriculum.findMany({
  where: { cover: { equals: Prisma.AnyNull } },
  select: { id: true },
});

if (rows.length === 0) {
  process.stdout.write("No rows to backfill.\n");
} else {
  process.stdout.write(`Backfilling ${rows.length} row(s)...\n`);
  for (const row of rows) {
    const cover = generateGradient();
    await db.customCurriculum.update({
      where: { id: row.id },
      data: { cover: cover as Prisma.InputJsonValue },
    });
    process.stdout.write(`  ${row.id} → ${cover.shape} (${cover.colors.length} colors)\n`);
  }
  process.stdout.write("Done.\n");
}

await db.$disconnect();
