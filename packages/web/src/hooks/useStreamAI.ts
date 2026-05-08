import { useCallback, useEffect, useRef, useState } from "react";

export function useStreamAI() {
  const abortRef = useRef<AbortController | null>(null);
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const run = useCallback(async <T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T | null> => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setStreaming(true);

    try {
      const result = await fn(ctrl.signal);
      if (ctrl.signal.aborted) return null;
      setStreaming(false);
      return result;
    } catch (err) {
      if (!ctrl.signal.aborted) console.error(err);
      return null;
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { run, streaming, abort };
}
