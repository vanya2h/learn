import Anthropic from "@anthropic-ai/sdk";
import type { Locale } from "../../lib/i18n";
import { localizeSystem } from "../../lib/i18n";
import { getLlmUsageStatus, recordLlmUsage } from "./llmRateLimit";
import type { ProfileContext } from "./profileContext";
import { appendProfileToSystem } from "./profileContext";

type StreamLLMOptions = {
  userId: string;
  system: string;
  userMessage: string;
  locale?: Locale;
  maxTokens: number;
  profile?: ProfileContext | null;
  onComplete?: (fullText: string) => Promise<void> | void;
};

export async function streamLLM(opts: StreamLLMOptions): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const status = await getLlmUsageStatus(opts.userId);
  if (status.remaining <= 0) {
    const minutes = Math.max(1, Math.ceil((status.resetAt.getTime() - Date.now()) / 60_000));
    return new Response(
      JSON.stringify({
        error: `Rate limit exceeded. You've used ${status.used} of ${status.limit} tokens this hour. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const anthropic = new Anthropic({ apiKey });
  const localized = opts.locale ? localizeSystem(opts.locale, opts.system) : opts.system;
  const finalSystem = appendProfileToSystem(localized, opts.profile ?? null);
  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: opts.maxTokens,
    system: finalSystem,
    messages: [{ role: "user", content: opts.userMessage }],
  });

  let accumulated = "";

  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            accumulated += event.delta.text;
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(event.delta.text)}\n\n`));
          }
        }
        try {
          const final = await stream.finalMessage();
          const total = (final.usage.input_tokens ?? 0) + (final.usage.output_tokens ?? 0);
          await recordLlmUsage(opts.userId, total);
        } catch (err) {
          console.error("[llm] failed to record usage:", err);
        }
        if (opts.onComplete) await opts.onComplete(accumulated);
        controller.close();
      } catch (err) {
        console.error("[llm] stream error:", err);
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
}
