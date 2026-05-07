import Anthropic from "@anthropic-ai/sdk";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { LOCALES, localizeSystem } from "../../lib/i18n";
import { appendProfileToSystem, getProfileContext } from "../lib/profileContext";
import type { AuthEnv } from "../middleware/requireAuth";

const chatSchema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })),
  system: z.string().optional(),
  maxTokens: z.number().int().min(1).max(8000),
  locale: z.enum(LOCALES).optional(),
});

export const chatRoute = new Hono<AuthEnv>().post("/chat", zValidator("json", chatSchema), async (c) => {
  const { messages, system, maxTokens, locale } = c.req.valid("json");
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[chat] ANTHROPIC_API_KEY is not set");
    return c.json({ error: "ANTHROPIC_API_KEY is not set" }, 500);
  }
  const anthropic = new Anthropic({ apiKey });

  const localizedSystem = system && locale ? localizeSystem(locale, system) : system;
  const profile = await getProfileContext(c.var.user.id);
  const finalSystem = localizedSystem ? appendProfileToSystem(localizedSystem, profile) : localizedSystem;

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: maxTokens,
    system: finalSystem,
    messages,
  });

  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(event.delta.text)}\n\n`));
          }
        }
        controller.close();
      } catch (err) {
        console.error("[chat] stream error:", err);
        controller.error(err);
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});
