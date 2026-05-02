import { hc, parseResponse } from "hono/client";
import { useCallback } from "react";
import { useRootData } from "../../app/hooks/useRootData";
import type { AppType } from "../server/app";
import type { Locale } from "./i18n";

const client = hc<AppType>("/");

export async function* readSSEStream(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          yield JSON.parse(line.slice(6)) as string;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export function useClaude() {
  const locale = (useRootData()?.locale ?? "en") as Locale;

  const streamAI = useCallback(
    async (
      system: string,
      message: string,
      onUpdate: (text: string) => void,
      maxTokens: number,
      signal?: AbortSignal,
    ): Promise<string> => {
      const res = await client.api.chat.$post(
        { json: { messages: [{ role: "user", content: message }], system, maxTokens, locale } },
        { init: { signal } },
      );

      if (!res.ok) await parseResponse(res);
      if (!res.body) throw new Error("No response body");

      let accumulated = "";
      for await (const delta of readSSEStream(res.body)) {
        accumulated += delta;
        onUpdate(accumulated);
      }
      return accumulated;
    },
    [locale],
  );

  const askAI = useCallback(
    (system: string, message: string, maxTokens: number, signal?: AbortSignal): Promise<string> =>
      streamAI(system, message, () => {}, maxTokens, signal),
    [streamAI],
  );

  return { streamAI, askAI };
}
