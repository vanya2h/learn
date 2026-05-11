import { DetailedError } from "hono/client";

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof DetailedError) {
    const data = err.detail?.data as { error?: string } | undefined;
    return data?.error ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
