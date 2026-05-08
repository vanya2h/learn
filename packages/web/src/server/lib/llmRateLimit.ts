import { db } from "../db";

export const LLM_RATE_LIMIT_TOKENS = 10_000;
export const LLM_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export type LlmRateLimitStatus = {
  used: number;
  limit: number;
  remaining: number;
  resetAt: Date;
};

export async function getLlmUsageStatus(userId: string): Promise<LlmRateLimitStatus> {
  const since = new Date(Date.now() - LLM_RATE_LIMIT_WINDOW_MS);
  const rows = await db.llmUsage.findMany({
    where: { userId, createdAt: { gte: since } },
    select: { totalTokens: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const used = rows.reduce((sum, r) => sum + r.totalTokens, 0);
  const oldest = rows[0]?.createdAt ?? new Date();
  return {
    used,
    limit: LLM_RATE_LIMIT_TOKENS,
    remaining: Math.max(0, LLM_RATE_LIMIT_TOKENS - used),
    resetAt: new Date(oldest.getTime() + LLM_RATE_LIMIT_WINDOW_MS),
  };
}

export async function recordLlmUsage(userId: string, totalTokens: number): Promise<void> {
  if (totalTokens <= 0) return;
  await db.llmUsage.create({ data: { userId, totalTokens } });
}
