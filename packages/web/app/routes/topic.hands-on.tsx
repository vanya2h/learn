import { Button } from "@cloudflare/kumo/components/button";
import { InputArea } from "@cloudflare/kumo/components/input";
import { LayerCard } from "@cloudflare/kumo/components/layer-card";
import { Loader } from "@cloudflare/kumo/components/loader";
import { Trans, useLingui } from "@lingui/react/macro";
import { useState } from "react";
import { useLoaderData, useNavigate, useParams } from "react-router";
import { Markdown } from "../../src/components/Markdown";
import { useStreamAI } from "../../src/hooks/useStreamAI";
import { useTopicSession } from "../../src/hooks/useTopicSession";
import { parsePersistedPhase, TASK_SOLUTION_SYSTEM } from "../../src/lib/phase";
import { db } from "../../src/server/db";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/topic.hands-on";

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireSession(request);
  const record = await db.topicSession.findUnique({
    where: {
      userId_taskId: {
        userId: session.user.id,
        taskId: params.taskId,
      },
    },
  });
  const phase = parsePersistedPhase(record?.phaseData);
  if (phase?.name !== "hands-on") throw new Response("Not found", { status: 404 });
  return {
    material: phase.material,
    partIdx: phase.partIdx,
    savedAnswers: phase.answers,
  };
}

export default function HandsOnPage() {
  const { material, partIdx, savedAnswers } = useLoaderData<typeof loader>();
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { stream } = useStreamAI();
  const { saveSession } = useTopicSession(taskId!);
  const { t } = useLingui();

  const [answers, setAnswers] = useState<Record<string, string>>(savedAnswers);
  const [solutions, setSolutions] = useState<Record<number, { text: string; streaming: boolean }>>({});

  const { parts } = material;
  const part = parts[partIdx]!;
  const allAnswered = part.handsOn.every((_, i) => (answers[i] ?? "").trim().length > 0);

  async function handleSolution(idx: number, task: string, hint?: string) {
    setSolutions((prev) => ({
      ...prev,
      [idx]: { text: "", streaming: true },
    }));
    const msg = hint ? `Task: ${task}\nHint: ${hint}` : `Task: ${task}`;
    const result = await stream(
      TASK_SOLUTION_SYSTEM,
      msg,
      (acc) =>
        setSolutions((prev) => ({
          ...prev,
          [idx]: { text: acc, streaming: true },
        })),
      800,
    );
    if (result !== null) {
      setSolutions((prev) => ({
        ...prev,
        [idx]: { ...prev[idx]!, streaming: false },
      }));
    } else {
      setSolutions((prev) => {
        const { [idx]: _, ...rest } = prev;
        return rest;
      });
    }
  }

  async function handleSubmit() {
    await saveSession({
      name: "hands-on",
      material,
      partIdx,
      answers,
    });
    void navigate("../feedback", { relative: "path" });
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex flex-col gap-6">
        {part.handsOn.map((taskItem, i) => (
          <div key={i} className="flex flex-col gap-3">
            <LayerCard className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                <Trans>Task {i + 1}</Trans>
              </p>
              <Markdown>{taskItem.task}</Markdown>
              {taskItem.hint && (
                <p className="mt-2 text-xs text-foreground/40 italic">
                  <Trans>Hint: {taskItem.hint}</Trans>
                </p>
              )}
              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="xs"
                  variant="secondary"
                  disabled={solutions[i]?.streaming}
                  onClick={() => void handleSolution(i, taskItem.task, taskItem.hint)}
                >
                  <Trans>See solution</Trans>
                </Button>
                {solutions[i]?.streaming && <Loader size="sm" />}
              </div>
            </LayerCard>

            {solutions[i] && (
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-2">
                  <Trans>Solution</Trans>
                </p>
                <Markdown isAnimating={solutions[i].streaming}>{solutions[i].text}</Markdown>
              </div>
            )}

            <InputArea
              value={answers[i] ?? ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
              placeholder={t`Your answer, code, or reasoning…`}
              rows={4}
              aria-label={t`Text input`}
              className="w-full"
            />
          </div>
        ))}

        <div>
          <Button variant="primary" disabled={!allAnswered} onClick={() => void handleSubmit()}>
            <Trans>Submit for feedback →</Trans>
          </Button>
        </div>
      </div>
    </div>
  );
}
