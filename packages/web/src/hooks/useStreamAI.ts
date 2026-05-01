import { useCallback, useEffect, useRef, useState } from "react";
import { useClaude } from "../lib/claude";

export function useStreamAI() {
  const { streamAI } = useClaude();
  const abortRef = useRef<AbortController | null>(null);
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const stream = useCallback(
    async (
      system: string,
      message: string,
      onUpdate: (text: string) => void,
      maxTokens: number,
    ): Promise<string | null> => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setStreaming(true);

      try {
        const result = await streamAI(
          system,
          message,
          (acc) => {
            if (!ctrl.signal.aborted) onUpdate(acc);
          },
          maxTokens,
          ctrl.signal,
        );
        if (ctrl.signal.aborted) return null;
        setStreaming(false);
        return result;
      } catch (err) {
        if (!ctrl.signal.aborted) console.error(err);
        return null;
      }
    },
    [streamAI],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { stream, streaming, abort };
}
