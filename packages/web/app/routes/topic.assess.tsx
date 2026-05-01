import { Button } from "@cloudflare/kumo/components/button";
import { InputArea } from "@cloudflare/kumo/components/input";
import { Loader } from "@cloudflare/kumo/components/loader";
import { Text } from "@cloudflare/kumo/components/text";
import { useEffect, useRef, useState } from "react";
import { useLoaderData, useNavigate, useParams, useRouteLoaderData } from "react-router";
import { useTopicSession } from "../../src/hooks/useTopicSession";
import { useClaude } from "../../src/lib/claude";
import { parseJSON } from "../../src/lib/json";
import { ASSESSMENT_SYSTEM, parsePersistedPhase } from "../../src/lib/phase";
import { db } from "../../src/server/db";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/topic.assess";
import type { loader as layoutLoader } from "./topic-layout";

const TOKENS_ASSESSMENT = 300;

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireSession(request);
  const record = await db.topicSession.findUnique({
    where: { userId_taskId: { userId: session.user.id, taskId: params.taskId } },
  });
  const phase = parsePersistedPhase(record?.phaseData);
  if (phase?.name === "assessing") {
    return { questions: phase.questions, answers: phase.answers };
  }
  return { questions: null, answers: {} as Record<string, string> };
}

export default function AssessPage() {
  const { questions: savedQuestions, answers: savedAnswers } = useLoaderData<typeof loader>();
  const layoutData = useRouteLoaderData<typeof layoutLoader>("routes/topic-layout");
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { askAI } = useClaude();
  const { saveSession } = useTopicSession(taskId!);
  const abortRef = useRef<AbortController | null>(null);

  const [questions, setQuestions] = useState<string[] | null>(savedQuestions);
  const [answers, setAnswers] = useState<Record<string, string>>(savedAnswers);
  const [loading, setLoading] = useState(false);

  const task = layoutData?.task;
  const curriculumName = layoutData?.curriculumName;

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
        `Topic: "${task.title}"\nCurriculum: ${curriculumName}`,
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader size="sm" />
        <p className="text-sm text-muted-foreground">Preparing assessment questions…</p>
      </div>
    );
  }

  const allAnswered = questions.every((_, i) => (answers[i] ?? "").trim().length > 0);

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-1">
        <Text variant="heading2" as="h2">
          Quick Assessment
        </Text>
        <Button size="xs" variant="secondary" onClick={() => void generateQuestions()} disabled={loading}>
          Regenerate
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mb-8">
        Answer each question in 2–4 sentences. Honest answers get more useful material.
      </p>
      <div className="flex flex-col gap-6">
        {questions.map((q, i) => (
          <div key={i}>
            <p className="text-sm font-medium text-foreground mb-2">
              {i + 1}. {q}
            </p>
            <InputArea
              value={answers[i] ?? ""}
              onChange={(e) => handleAnswerChange(i, e.target.value)}
              placeholder="Your answer…"
              rows={3}
              aria-label="Text input"
              className="w-full"
            />
          </div>
        ))}
      </div>
      <div className="mt-8">
        <Button variant="primary" disabled={!allAnswered} onClick={() => void handleSubmit()}>
          Submit answers →
        </Button>
      </div>
    </div>
  );
}
