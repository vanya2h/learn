import { Trans, useLingui } from "@lingui/react/macro";
import { useEffect, useRef, useState } from "react";
import { useLoaderData, useNavigate, useParams, useRouteLoaderData } from "react-router";
import { LoadingState } from "../../src/components/LoadingState";
import { TopicActionBar } from "../../src/components/TopicActionBar";
import { TopicContainer } from "../../src/components/TopicContainer";
import { useTopicSession } from "../../src/hooks/useTopicSession";
import { useClaude } from "../../src/lib/claude";
import { parseJSON } from "../../src/lib/json";
import { ASSESSMENT_SYSTEM, isPhaseReadOnly, parseTopicSessionState } from "../../src/lib/phase";
import { db } from "../../src/server/db";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/topic.assess";
import type { loader as layoutLoader } from "./topic-layout";

import { Card } from "~/components/Card";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";

const TOKENS_ASSESSMENT = 300;

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
  const { askAI } = useClaude();
  const { saveSession } = useTopicSession(taskId!);
  const { t } = useLingui();
  const abortRef = useRef<AbortController | null>(null);

  const [questions, setQuestions] = useState<string[] | null>(savedQuestions);
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
    setAnswers({});
    try {
      const text = await askAI(
        ASSESSMENT_SYSTEM,
        `Topic: "${task.title}"\nCurriculum: ${curriculumName}${complexity ? `\nComplexity: ${complexity}` : ""}`,
        TOKENS_ASSESSMENT,
        ctrl.signal,
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

  if (loading || !questions) {
    return (
      <LoadingState>
        <Trans>Preparing assessment questions…</Trans>
      </LoadingState>
    );
  }

  const allAnswered = questions.every((_, i) => (answers[i] ?? "").trim().length > 0);

  return (
    <>
      <TopicContainer className="py-8 flex flex-col gap-4">
        <Card>
          <div className="flex items-center justify-between gap-6">
            <h2 className="text-2xl font-semibold text-foreground">
              <Trans>Quick Assessment</Trans>
            </h2>
            {!readOnly && (
              <Button variant="secondary" size="sm" onClick={() => void generateQuestions()} disabled={loading}>
                <Trans>Regenerate</Trans>
              </Button>
            )}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            <Trans>Answer each question in 2–4 sentences. Honest answers get more useful material.</Trans>
          </p>
        </Card>

        <Card>
          <div className="flex flex-col gap-6">
            {questions.map((q, i) => (
              <div key={i}>
                <p className="text-sm font-medium text-foreground mb-2">
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
              </div>
            ))}
          </div>
        </Card>
      </TopicContainer>

      {!readOnly && (
        <TopicActionBar>
          <Button className="ml-auto" disabled={!allAnswered} onClick={() => void handleSubmit()}>
            <Trans>Submit answers</Trans>
          </Button>
        </TopicActionBar>
      )}
    </>
  );
}
