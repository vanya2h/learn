import { hc } from "hono/client";
import { useCallback } from "react";
import type { AppType } from "../server/app";

const client = hc<AppType>("/");

async function* readSSEStream(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
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
  const streamAI = useCallback(
    async (
      system: string,
      message: string,
      onUpdate: (text: string) => void,
      signal?: AbortSignal,
    ): Promise<string> => {
      const res = await client.api.chat.$post(
        { json: { messages: [{ role: "user", content: message }], system } },
        { init: { signal } },
      );

      if (!res.ok) throw new Error(`API error ${res.status}`);
      if (!res.body) throw new Error("No response body");

      let accumulated = "";
      for await (const delta of readSSEStream(res.body)) {
        accumulated += delta;
        onUpdate(accumulated);
      }
      return accumulated;
    },
    [],
  );

  const askAI = useCallback(
    (system: string, message: string, signal?: AbortSignal): Promise<string> =>
      streamAI(system, message, () => {}, signal),
    [streamAI],
  );

  return { streamAI, askAI };
}
