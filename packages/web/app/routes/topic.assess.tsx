import { Trans, useLingui } from "@lingui/react/macro";
import { useEffect, useRef, useState } from "react";
import { useLoaderData, useNavigate, useParams, useRouteLoaderData } from "react-router";
import { PageBody } from "../../src/components/layout/PageBody";
import { PageContent } from "../../src/components/layout/PageContent";
import { ReadingColumn } from "../../src/components/layout/ReadingColumn";
import { TopicActionBar } from "../../src/components/TopicActionBar";
import { useTopicSession } from "../../src/hooks/useTopicSession";
import { useClaude } from "../../src/lib/claude";
import { parseJSON } from "../../src/lib/json";
import { isPhaseReadOnly, parseTopicSessionState } from "../../src/lib/phase";
import { db } from "../../src/server/db";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/topic.assess";
import type { loader as layoutLoader } from "./topic-layout";

import { Card } from "~/components/Card";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireSession(request);
  const record = await db.topicSession.findUnique({
    where: { userId_taskId: { userId: session.user.id, taskId: params.taskId } },
  });
  const state = record ? parseTopicSessionState(record.phaseData) : { phases: {} };
  const phase = state.phases.assessing;
  const readOnly = isPhaseReadOnly(state, "assessing");
  if (phase) {
    return { questions: phase.questions, answers: phase.answers, readOnly };
  }
  return { questions: null, answers: {} as Record<string, string>, readOnly: false };
}

export default function AssessPage() {
  const { questions: savedQuestions, answers: savedAnswers, readOnly } = useLoaderData<typeof loader>();
  const layoutData = useRouteLoaderData<typeof layoutLoader>("routes/topic-layout");
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { streamAssessment } = useClaude();
  const { saveSession } = useTopicSession(taskId!);
  const { t } = useLingui();
  const abortRef = useRef<AbortController | null>(null);

  const [questions, setQuestions] = useState<string[] | null>(savedQuestions);
  const [questionsStream, setQuestionsStream] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>(savedAnswers);
  const [loading, setLoading] = useState(false);

  const task = layoutData?.task;
  const curriculumName = layoutData?.curriculumName;
  const complexity = layoutData?.complexity;

  async function generateQuestions() {
    if (!task) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setQuestions(null);
    setQuestionsStream([]);
    setAnswers({});
    try {
      const text = await streamAssessment(
        { topic: task.title, curriculum: curriculumName ?? "", complexity },
        {
          signal: ctrl.signal,
          onUpdate: (acc) => {
            if (ctrl.signal.aborted) return;
            try {
              const { questions: qs } = parseJSON<{ questions?: string[] }>(acc);
              if (Array.isArray(qs)) setQuestionsStream(qs.filter((q): q is string => typeof q === "string"));
            } catch {
              // partial stream not yet parseable
            }
          },
        },
      );
      if (ctrl.signal.aborted) return;
      const { questions: qs } = parseJSON<{ questions: string[] }>(text);
      setQuestions(qs);
      void saveSession({ name: "assessing", questions: qs, answers: {} });
    } finally {
      if (!abortRef.current?.signal.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!savedQuestions) void generateQuestions();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAnswerChange(idx: number, text: string) {
    setAnswers((prev) => ({ ...prev, [idx]: text }));
  }

  async function handleSubmit() {
    if (!questions) return;
    await saveSession({ name: "assessing", questions, answers });
    void navigate("../gaps", { relative: "path" });
  }

  const isLoading = loading || !questions;
  const allAnswered = !!questions && questions.every((_, i) => (answers[i] ?? "").trim().length > 0);

  return (
    <PageBody>
      <PageContent>
        <ReadingColumn>
          <Card.List>
            <Card.Entry className="flex items-baseline justify-between gap-4">
              <div className="flex flex-col gap-2">
                <Card.Heading>
                  <Trans>Quick Assessment</Trans>
                </Card.Heading>
                <Card.SubHeading>
                  <Trans>Answer each question in 2–4 sentences. Honest answers get more useful material.</Trans>
                </Card.SubHeading>
              </div>
              {!readOnly && (
                <Button variant="secondary" size="sm" onClick={() => void generateQuestions()} disabled={loading}>
                  <Trans>Regenerate</Trans>
                </Button>
              )}
            </Card.Entry>

            {isLoading && (
              <Card.Entry className="flex flex-row items-center gap-2 text-foreground/40">
                <Spinner />
                <p className="text-sm">
                  <Trans>Preparing assessment questions…</Trans>
                </p>
              </Card.Entry>
            )}

            {isLoading &&
              questionsStream.map((q, i) => (
                <Card.Entry key={i} className="text-sm text-foreground">
                  {i + 1}. {q}
                </Card.Entry>
              ))}

            {!isLoading &&
              questions?.map((q, i) => (
                <Card.Entry className="gap-4" key={i}>
                  <p className="text-sm font-medium text-foreground">
                    {i + 1}. {q}
                  </p>
                  <Textarea
                    value={answers[i] ?? ""}
                    onChange={(e) => handleAnswerChange(i, e.target.value)}
                    placeholder={t`Your answer…`}
                    rows={3}
                    aria-label={t`Text input`}
                    disabled={readOnly}
                  />
                </Card.Entry>
              ))}
          </Card.List>
        </ReadingColumn>
      </PageContent>

      {!readOnly && (
        <TopicActionBar>
          <Button className="ml-auto" disabled={!allAnswered} onClick={() => void handleSubmit()}>
            <Trans>Submit answers</Trans>
          </Button>
        </TopicActionBar>
      )}
    </PageBody>
  );
}
