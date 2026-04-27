import { fetchServerSentEvents, useChat } from "@tanstack/ai-react";
import { useCallback, useMemo, useRef } from "react";

export function useClaude() {
  const systemRef = useRef("");
  const onUpdateRef = useRef<((text: string) => void) | null>(null);
  const accRef = useRef("");

  /* eslint-disable react-hooks/refs, react-hooks/preserve-manual-memoization */
  // Options fn is called lazily at request time (not during render) — ref access is safe.
  const connection = useMemo(
    () => fetchServerSentEvents("/api/chat", () => ({ body: { system: systemRef.current } })),
    [],
  );
  /* eslint-enable react-hooks/refs, react-hooks/preserve-manual-memoization */

  const { sendMessage, clear, stop } = useChat({
    connection,
    onChunk: (chunk) => {
      if (chunk.type === "TEXT_MESSAGE_CONTENT") {
        const delta = (chunk as { delta?: string }).delta ?? "";
        accRef.current += delta;
        onUpdateRef.current?.(accRef.current);
      }
    },
  });

  const streamAI = useCallback(
    async (
      system: string,
      message: string,
      onUpdate: (text: string) => void,
      signal?: AbortSignal,
    ): Promise<string> => {
      systemRef.current = system;
      onUpdateRef.current = onUpdate;
      accRef.current = "";
      clear();

      signal?.addEventListener("abort", () => stop(), { once: true });

      await sendMessage(message);
      onUpdateRef.current = null;
      return accRef.current;
    },
    [sendMessage, clear, stop],
  );

  const askAI = useCallback(
    (system: string, message: string, signal?: AbortSignal): Promise<string> =>
      streamAI(system, message, () => {}, signal),
    [streamAI],
  );

  return { streamAI, askAI };
}
