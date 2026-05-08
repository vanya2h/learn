import { Trans, useLingui } from "@lingui/react/macro";
import { useState } from "react";
import { useLoaderData, useNavigate, useParams } from "react-router";
import { PageBody } from "../../src/components/layout/PageBody";
import { PageContent } from "../../src/components/layout/PageContent";
import { ReadingColumn } from "../../src/components/layout/ReadingColumn";
import { Markdown } from "../../src/components/Markdown";
import { TopicActionBar } from "../../src/components/TopicActionBar";
import { useStreamAI } from "../../src/hooks/useStreamAI";
import { useTopicSession } from "../../src/hooks/useTopicSession";
import { useClaude } from "../../src/lib/claude";
import { isPhaseReadOnly, parseTopicSessionState } from "../../src/lib/phase";
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
  const { run } = useStreamAI();
  const { streamTaskSolution } = useClaude();
  const { saveSession } = useTopicSession(taskId!);
  const { t } = useLingui();

  const [answers, setAnswers] = useState<Record<string, string>>(savedAnswers);
  const [solutions, setSolutions] = useState<Record<number, { text: string; streaming: boolean }>>({});
  const [solutionShown, setSolutionShown] = useState<Record<number, boolean>>({});
  const [hintShown, setHintShown] = useState<Record<number, boolean>>({});

  const { parts } = material;
  const part = parts[partIdx]!;
  const allAnswered = part.handsOn.every((_, i) => (answers[i] ?? "").trim().length > 0);

  async function handleSolution(idx: number, task: string, hint?: string) {
    if (solutions[idx] && !solutions[idx].streaming) {
      setSolutionShown((prev) => ({ ...prev, [idx]: true }));
      return;
    }
    setSolutionShown((prev) => ({ ...prev, [idx]: true }));
    setSolutions((prev) => ({
      ...prev,
      [idx]: { text: "", streaming: true },
    }));
    const result = await run((signal) =>
      streamTaskSolution(
        { task, hint },
        {
          signal,
          onUpdate: (acc) =>
            setSolutions((prev) => ({
              ...prev,
              [idx]: { text: acc, streaming: true },
            })),
        },
      ),
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
      setSolutionShown((prev) => ({ ...prev, [idx]: false }));
    }
  }

  function handleHideSolution(idx: number) {
    setSolutionShown((prev) => ({ ...prev, [idx]: false }));
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
    <PageBody>
      <PageContent>
        <ReadingColumn className="flex flex-col gap-8">
          {part.handsOn.map((taskItem, i) => (
            <Card.List key={i}>
              <Card.Entry>
                <Card.Heading>
                  <Trans>Task {i + 1}</Trans>
                </Card.Heading>
              </Card.Entry>
              <Card.Entry>
                <Markdown>{taskItem.task}</Markdown>
              </Card.Entry>

              <Card.Entry>
                <Textarea
                  value={answers[i] ?? ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
                  placeholder={t`Your answer, code, or reasoning…`}
                  rows={4}
                  aria-label={t`Text input`}
                  disabled={readOnly}
                />
              </Card.Entry>

              <Card.Entry className="flex flex-row flex-wrap items-center gap-2">
                {taskItem.hint && (
                  <Button variant="secondary" size="xs" onClick={() => toggleHint(i)}>
                    {hintShown[i] ? <Trans>Hide hint</Trans> : <Trans>Show hint</Trans>}
                  </Button>
                )}
                {solutionShown[i] && !solutions[i]?.streaming ? (
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
              </Card.Entry>

              {taskItem.hint && hintShown[i] && (
                <Card.Entry className="gap-2">
                  <Card.Heading>
                    <Trans>Hint</Trans>
                  </Card.Heading>
                  <Card.SubHeading>{taskItem.hint}</Card.SubHeading>
                </Card.Entry>
              )}

              {solutionShown[i] && solutions[i] && (
                <Card.Entry className="gap-2">
                  <Card.Heading>
                    <Trans>Solution</Trans>
                  </Card.Heading>
                  <Markdown isAnimating={solutions[i].streaming}>{solutions[i].text}</Markdown>
                </Card.Entry>
              )}
            </Card.List>
          ))}
        </ReadingColumn>
      </PageContent>

      {!readOnly && (
        <TopicActionBar>
          <Button className="ml-auto" disabled={!allAnswered} onClick={() => void handleSubmit()}>
            <Trans>Submit for feedback</Trans>
          </Button>
        </TopicActionBar>
      )}
    </PageBody>
  );
}
