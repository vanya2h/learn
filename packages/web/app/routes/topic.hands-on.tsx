import { Trans, useLingui } from "@lingui/react/macro";
import { useState } from "react";
import { useLoaderData, useNavigate, useParams } from "react-router";
import { Markdown } from "../../src/components/Markdown";
import { TopicActionBar } from "../../src/components/TopicActionBar";
import { TopicContainer } from "../../src/components/TopicContainer";
import { useStreamAI } from "../../src/hooks/useStreamAI";
import { useTopicSession } from "../../src/hooks/useTopicSession";
import { isPhaseReadOnly, parseTopicSessionState, TASK_SOLUTION_SYSTEM } from "../../src/lib/phase";
import { db } from "../../src/server/db";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/topic.hands-on";

import { Card } from "~/components/Card";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";

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
  const state = record ? parseTopicSessionState(record.phaseData) : { phases: {} };
  const readOnly = isPhaseReadOnly(state, "hands-on");

  const handsOn = state.phases["hands-on"];
  if (handsOn) {
    return { material: handsOn.material, partIdx: handsOn.partIdx, savedAnswers: handsOn.answers, readOnly };
  }
  const study = state.phases.study;
  if (study) {
    return { material: study.material, partIdx: study.partIdx, savedAnswers: {} as Record<string, string>, readOnly };
  }
  throw new Response("Not found", { status: 404 });
}

export default function HandsOnPage() {
  const { material, partIdx, savedAnswers, readOnly } = useLoaderData<typeof loader>();
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { stream } = useStreamAI();
  const { saveSession } = useTopicSession(taskId!);
  const { t } = useLingui();

  const [answers, setAnswers] = useState<Record<string, string>>(savedAnswers);
  const [solutions, setSolutions] = useState<Record<number, { text: string; streaming: boolean }>>({});
  const [hintShown, setHintShown] = useState<Record<number, boolean>>({});

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

  function handleHideSolution(idx: number) {
    setSolutions((prev) => {
      const { [idx]: _, ...rest } = prev;
      return rest;
    });
  }

  function toggleHint(idx: number) {
    setHintShown((prev) => ({ ...prev, [idx]: !prev[idx] }));
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
    <>
      <TopicContainer className="py-8 flex flex-col gap-8">
        {part.handsOn.map((taskItem, i) => (
          <div key={i} className="flex flex-col gap-4">
            <Card>
              <h2 className="text-xl font-semibold">
                <Trans>Task {i + 1}</Trans>
              </h2>
              <div className="mt-2">
                <Markdown>{taskItem.task}</Markdown>
              </div>
              <div className="mt-4">
                <Textarea
                  value={answers[i] ?? ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
                  placeholder={t`Your answer, code, or reasoning…`}
                  rows={4}
                  aria-label={t`Text input`}
                  disabled={readOnly}
                />
              </div>
            </Card>

            <div className="flex flex-wrap items-center gap-2">
              {taskItem.hint && (
                <Button variant="secondary" size="xs" onClick={() => toggleHint(i)}>
                  {hintShown[i] ? <Trans>Hide hint</Trans> : <Trans>Show hint</Trans>}
                </Button>
              )}
              {solutions[i] && !solutions[i].streaming ? (
                <Button variant="secondary" size="xs" onClick={() => handleHideSolution(i)}>
                  <Trans>Hide solution</Trans>
                </Button>
              ) : (
                <Button
                  size="xs"
                  disabled={solutions[i]?.streaming}
                  onClick={() => void handleSolution(i, taskItem.task, taskItem.hint)}
                >
                  <Trans>See solution</Trans>
                </Button>
              )}
              {solutions[i]?.streaming && <Spinner />}
            </div>

            {taskItem.hint && hintShown[i] && (
              <Card>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-2">
                  <Trans>Hint</Trans>
                </p>
                <p className="text-foreground">{taskItem.hint}</p>
              </Card>
            )}

            {solutions[i] && (
              <Card>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-2">
                  <Trans>Solution</Trans>
                </p>
                <Markdown isAnimating={solutions[i].streaming}>{solutions[i].text}</Markdown>
              </Card>
            )}
          </div>
        ))}
      </TopicContainer>

      {!readOnly && (
        <TopicActionBar>
          <Button className="ml-auto" disabled={!allAnswered} onClick={() => void handleSubmit()}>
            <Trans>Submit for feedback</Trans>
          </Button>
        </TopicActionBar>
      )}
    </>
  );
}
