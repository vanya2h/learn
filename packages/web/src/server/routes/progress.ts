import { zValidator } from "@hono/zod-validator";
import { format } from "date-fns";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db";
import type { AuthEnv } from "../middleware/requireAuth";

function today() {
  return format(new Date(), "yyyy-MM-dd");
}

export const progressRoute = new Hono<AuthEnv>()
  // ─── GET /progress ───────────────────────────────────────────────────────────
  .get("/progress", async (c) => {
    const userId = c.var.user.id;

    const [completions, activities, specializations, startedAt] = await Promise.all([
      db.taskCompletion.findMany({ where: { userId } }),
      db.dailyActivity.findMany({ where: { userId } }),
      db.specialization.findMany({ where: { userId } }),
      db.appSetting.findUnique({ where: { key_userId: { key: "startedAt", userId } } }),
    ]);

    return c.json({
      completedTaskIds: Object.fromEntries(completions.map((t) => [t.taskId, t.completedAt.toISOString()])),
      activity: Object.fromEntries(
        activities.map((a) => [a.date, { date: a.date, taskIds: a.taskIds, minutes: a.minutes }]),
      ),
      specializations: Object.fromEntries(specializations.map((s) => [s.curriculumId, s.branch])),
      startedAt: startedAt?.value ?? new Date().toISOString(),
    });
  })

  // ─── POST /progress/tasks/:taskId/toggle ─────────────────────────────────────
  .post("/progress/tasks/:taskId/toggle", zValidator("param", z.object({ taskId: z.string().min(1) })), async (c) => {
    const userId = c.var.user.id;
    const { taskId } = c.req.valid("param");
    const date = today();

    const existing = await db.taskCompletion.findUnique({
      where: { taskId_userId: { taskId, userId } },
    });

    if (existing) {
      // Un-complete: delete completion + remove from today's activity
      const [, activity] = await db.$transaction([
        db.taskCompletion.delete({ where: { taskId_userId: { taskId, userId } } }),
        db.dailyActivity.findUnique({ where: { date_userId: { date, userId } } }),
      ]);

      if (activity) {
        await db.dailyActivity.update({
          where: { date_userId: { date, userId } },
          data: { taskIds: activity.taskIds.filter((id) => id !== taskId) },
        });
      }

      return c.json({ completed: false });
    }

    // Complete: create completion + upsert today's activity
    const [completion] = await db.$transaction([
      db.taskCompletion.create({ data: { taskId, userId, completedAt: new Date() } }),
      db.dailyActivity.upsert({
        where: { date_userId: { date, userId } },
        update: { taskIds: { push: taskId } },
        create: { date, userId, taskIds: [taskId], minutes: 0 },
      }),
    ]);

    return c.json({ completed: true, completedAt: completion.completedAt.toISOString() });
  })

  // ─── POST /progress/activity/log-minutes ─────────────────────────────────────
  .post(
    "/progress/activity/log-minutes",
    zValidator("json", z.object({ minutes: z.number().int().min(1) })),
    async (c) => {
      const userId = c.var.user.id;
      const { minutes } = c.req.valid("json");
      const date = today();

      const activity = await db.dailyActivity.upsert({
        where: { date_userId: { date, userId } },
        update: { minutes: { increment: minutes } },
        create: { date, userId, taskIds: [], minutes },
      });

      return c.json({ date: activity.date, minutes: activity.minutes });
    },
  )

  // ─── PUT /progress/specializations/:curriculumId ──────────────────────────────
  .put(
    "/progress/specializations/:curriculumId",
    zValidator("param", z.object({ curriculumId: z.string().min(1) })),
    zValidator("json", z.object({ branch: z.string().min(1) })),
    async (c) => {
      const userId = c.var.user.id;
      const { curriculumId } = c.req.valid("param");
      const { branch } = c.req.valid("json");

      await db.specialization.upsert({
        where: { curriculumId_userId: { curriculumId, userId } },
        update: { branch },
        create: { curriculumId, userId, branch },
      });

      return c.json({ curriculumId, branch });
    },
  )

  // ─── DELETE /progress/specializations/:curriculumId ──────────────────────────
  .delete(
    "/progress/specializations/:curriculumId",
    zValidator("param", z.object({ curriculumId: z.string().min(1) })),
    async (c) => {
      const userId = c.var.user.id;
      const { curriculumId } = c.req.valid("param");

      await db.specialization.deleteMany({ where: { curriculumId, userId } });

      return c.json({ curriculumId, branch: null });
    },
  )

  // ─── PUT /progress/settings/started-at ───────────────────────────────────────
  .put("/progress/settings/started-at", zValidator("json", z.object({ startedAt: z.string() })), async (c) => {
    const userId = c.var.user.id;
    const { startedAt } = c.req.valid("json");

    await db.appSetting.upsert({
      where: { key_userId: { key: "startedAt", userId } },
      update: { value: startedAt },
      create: { key: "startedAt", userId, value: startedAt },
    });

    return c.json({ startedAt });
  });
