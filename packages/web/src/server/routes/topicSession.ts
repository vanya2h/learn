import { zValidator } from "@hono/zod-validator";
import type { Prisma } from "@prisma/client-generated";
import { Hono } from "hono";
import { z } from "zod";
import { PersistedPhaseSchema } from "../../lib/phase";
import { db } from "../db";
import type { AuthEnv } from "../middleware/requireAuth";

const paramSchema = z.object({ taskId: z.string().min(1) });

export const topicSessionRoute = new Hono<AuthEnv>()
  .get("/topic-sessions/:taskId", zValidator("param", paramSchema), async (c) => {
    const userId = c.var.user.id;
    const { taskId } = c.req.valid("param");

    const session = await db.topicSession.findUnique({
      where: { userId_taskId: { userId, taskId } },
    });

    return c.json({ phaseData: session?.phaseData ?? null });
  })

  .put(
    "/topic-sessions/:taskId",
    zValidator("param", paramSchema),
    zValidator("json", z.object({ phaseData: PersistedPhaseSchema })),
    async (c) => {
      const userId = c.var.user.id;
      const { taskId } = c.req.valid("param");
      const { phaseData } = c.req.valid("json");

      const data = phaseData as unknown as Prisma.InputJsonValue;
      await db.topicSession.upsert({
        where: { userId_taskId: { userId, taskId } },
        update: { phaseData: data },
        create: { userId, taskId, phaseData: data },
      });

      return c.json({ ok: true });
    },
  )

  .delete("/topic-sessions/:taskId", zValidator("param", paramSchema), async (c) => {
    const userId = c.var.user.id;
    const { taskId } = c.req.valid("param");

    await db.topicSession.deleteMany({ where: { userId, taskId } });

    return c.json({ ok: true });
  });
