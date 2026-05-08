import type { ClientResponse } from "hono/client";
import { hc, parseResponse } from "hono/client";
import { useMemo } from "react";
import { useRootData } from "../../app/hooks/useRootData";
import type { Complexity } from "../data/types";
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

export type StreamOptions = {
  onUpdate?: (text: string) => void;
  signal?: AbortSignal;
};

async function consumeStream(res: ClientResponse<unknown>, opts: StreamOptions): Promise<string> {
  if (!res.ok) await parseResponse(res);
  if (!res.body) throw new Error("No response body");

  let acc = "";
  for await (const delta of readSSEStream(res.body)) {
    acc += delta;
    opts.onUpdate?.(acc);
  }
  return acc;
}

type AssessmentInput = {
  topic: string;
  curriculum: string;
  complexity?: Complexity;
};

type GapsInput = {
  qa: { q: string; a: string }[];
};

type StudyPlanInput = {
  topic: string;
  curriculum: string;
  complexity?: Complexity;
  assessmentContext?: string;
};

type StudyPartInput = {
  topic: string;
  curriculum: string;
  complexity?: Complexity;
  assessmentContext?: string;
  partIdx: number;
  parts: { title: string; description: string }[];
};

type TaskSolutionInput = {
  task: string;
  hint?: string;
};

type HandsOnFeedbackInput = {
  qa: { task: string; answer: string }[];
};

type WriteUpFeedbackInput = {
  topic: string;
  reflection: string;
};

export type ClaudeClient = {
  streamAssessment: (input: AssessmentInput, opts?: StreamOptions) => Promise<string>;
  streamGaps: (input: GapsInput, opts?: StreamOptions) => Promise<string>;
  streamStudyPlan: (input: StudyPlanInput, opts?: StreamOptions) => Promise<string>;
  streamStudyPart: (input: StudyPartInput, opts?: StreamOptions) => Promise<string>;
  streamTaskSolution: (input: TaskSolutionInput, opts?: StreamOptions) => Promise<string>;
  streamHandsOnFeedback: (input: HandsOnFeedbackInput, opts?: StreamOptions) => Promise<string>;
  streamWriteUpFeedback: (input: WriteUpFeedbackInput, opts?: StreamOptions) => Promise<string>;
};

export function useClaude(): ClaudeClient {
  const locale = (useRootData()?.locale ?? "en") as Locale;

  return useMemo<ClaudeClient>(
    () => ({
      streamAssessment: async (input, opts = {}) => {
        const res = await client.api.llm.assessment.$post(
          { json: { ...input, locale } },
          { init: { signal: opts.signal } },
        );
        return consumeStream(res, opts);
      },
      streamGaps: async (input, opts = {}) => {
        const res = await client.api.llm.gaps.$post({ json: { ...input, locale } }, { init: { signal: opts.signal } });
        return consumeStream(res, opts);
      },
      streamStudyPlan: async (input, opts = {}) => {
        const res = await client.api.llm["study-plan"].$post(
          { json: { ...input, locale } },
          { init: { signal: opts.signal } },
        );
        return consumeStream(res, opts);
      },
      streamStudyPart: async (input, opts = {}) => {
        const res = await client.api.llm["study-part"].$post(
          { json: { ...input, locale } },
          { init: { signal: opts.signal } },
        );
        return consumeStream(res, opts);
      },
      streamTaskSolution: async (input, opts = {}) => {
        const res = await client.api.llm["task-solution"].$post(
          { json: { ...input, locale } },
          { init: { signal: opts.signal } },
        );
        return consumeStream(res, opts);
      },
      streamHandsOnFeedback: async (input, opts = {}) => {
        const res = await client.api.llm["hands-on-feedback"].$post(
          { json: { ...input, locale } },
          { init: { signal: opts.signal } },
        );
        return consumeStream(res, opts);
      },
      streamWriteUpFeedback: async (input, opts = {}) => {
        const res = await client.api.llm["write-up-feedback"].$post(
          { json: { ...input, locale } },
          { init: { signal: opts.signal } },
        );
        return consumeStream(res, opts);
      },
    }),
    [locale],
  );
}
