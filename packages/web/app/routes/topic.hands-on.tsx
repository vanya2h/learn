import { Button } from "@cloudflare/kumo/components/button";
import { InputArea } from "@cloudflare/kumo/components/input";
import { LayerCard } from "@cloudflare/kumo/components/layer-card";
import { Loader } from "@cloudflare/kumo/components/loader";
import { useRef, useState } from "react";
import { useLoaderData, useNavigate, useParams } from "react-router";
import { Markdown } from "../../src/components/Markdown";
import { useTopicSession } from "../../src/hooks/useTopicSession";
import { useClaude } from "../../src/lib/claude";
import type { PersistedPhase } from "../../src/lib/phase";
import { TASK_SOLUTION_SYSTEM } from "../../src/lib/phase";
import { db } from "../../src/server/db";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/topic.hands-on";

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireSession(request);
  const record = await db.topicSession.findUnique({
    where: { userId_taskId: { userId: session.user.id, taskId: params.taskId } },
  });
  const phase = record?.phaseData as PersistedPhase | null;
  if (phase?.name !== "hands-on") throw new Response("Not found", { status: 404 });
  return { material: phase.material, partIdx: phase.partIdx, savedAnswers: phase.answers };
}

export default function HandsOnPage() {
  const { material, partIdx, savedAnswers } = useLoaderData<typeof loader>();
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { streamAI } = useClaude();
  const { saveSession } = useTopicSession(taskId!);
  const solutionAbortRef = useRef<AbortController | null>(null);

  const [answers, setAnswers] = useState<Record<number, string>>(savedAnswers);
  const [solutions, setSolutions] = useState<Record<number, { text: string; streaming: boolean }>>({});

  const { parts } = material;
  const part = parts[partIdx]!;
  const allAnswered = part.handsOn.every((_, i) => (answers[i] ?? "").trim().length > 0);

  async function handleSolution(idx: number, task: string, hint?: string) {
    solutionAbortRef.current?.abort();
    const ctrl = new AbortController();
    solutionAbortRef.current = ctrl;
    setSolutions((prev) => ({ ...prev, [idx]: { text: "", streaming: true } }));
    const msg = hint ? `Task: ${task}\nHint: ${hint}` : `Task: ${task}`;
    try {
      await streamAI(
        TASK_SOLUTION_SYSTEM,
        msg,
        (acc) => {
          if (!ctrl.signal.aborted) setSolutions((prev) => ({ ...prev, [idx]: { text: acc, streaming: true } }));
        },
        800,
        ctrl.signal,
      );
      if (!ctrl.signal.aborted) {
        setSolutions((prev) => ({ ...prev, [idx]: { ...prev[idx]!, streaming: false } }));
      }
    } catch {
      if (!ctrl.signal.aborted) {
        setSolutions((prev) => {
          const { [idx]: _, ...rest } = prev;
          return rest;
        });
      }
    }
  }

  async function handleSubmit() {
    await saveSession({ name: "hands-on", material, partIdx, answers });
    void navigate("../feedback", { relative: "path" });
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex flex-col gap-6">
        {part.handsOn.map((t, i) => (
          <div key={i} className="flex flex-col gap-3">
            <LayerCard className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Task {i + 1}</p>
              <Markdown>{t.task}</Markdown>
              {t.hint && <p className="mt-2 text-xs text-foreground/40 italic">Hint: {t.hint}</p>}
              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="xs"
                  variant="secondary"
                  disabled={solutions[i]?.streaming}
                  onClick={() => void handleSolution(i, t.task, t.hint)}
                >
                  See solution
                </Button>
                {solutions[i]?.streaming && <Loader size="sm" />}
              </div>
            </LayerCard>

            {solutions[i] && (
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-2">
                  Solution
                </p>
                <Markdown isAnimating={solutions[i].streaming}>{solutions[i].text}</Markdown>
              </div>
            )}

            <InputArea
              value={answers[i] ?? ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
              placeholder="Your answer, code, or reasoning…"
              rows={4}
              aria-label="Text input"
              className="w-full"
            />
          </div>
        ))}

        <div>
          <Button variant="primary" disabled={!allAnswered} onClick={() => void handleSubmit()}>
            Submit for feedback →
          </Button>
        </div>
      </div>
    </div>
  );
}
