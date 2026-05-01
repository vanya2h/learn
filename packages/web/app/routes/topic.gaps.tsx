import { Badge } from "@cloudflare/kumo/components/badge";
import { Button } from "@cloudflare/kumo/components/button";
import { Loader } from "@cloudflare/kumo/components/loader";
import { Text } from "@cloudflare/kumo/components/text";
import { useEffect, useRef, useState } from "react";
import { useLoaderData, useNavigate, useParams } from "react-router";
import { useTopicSession } from "../../src/hooks/useTopicSession";
import { useClaude } from "../../src/lib/claude";
import { parseJSON } from "../../src/lib/json";
import type { PersistedPhase } from "../../src/lib/phase";
import { ASSESSMENT_EVAL_SYSTEM } from "../../src/lib/phase";
import { db } from "../../src/server/db";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/topic.gaps";

const TOKENS_ASSESSMENT_EVAL = 300;

type LoaderResult =
  | { ready: true; summary: string; gaps: string[]; context: string }
  | { ready: false; questions: string[]; answers: Record<number, string> };

export async function loader({ request, params }: Route.LoaderArgs): Promise<LoaderResult> {
  const session = await requireSession(request);
  const record = await db.topicSession.findUnique({
    where: { userId_taskId: { userId: session.user.id, taskId: params.taskId } },
  });
  const phase = record?.phaseData as PersistedPhase | null;

  if (phase?.name === "gaps-review") {
    return { ready: true, summary: phase.summary, gaps: phase.gaps, context: phase.context };
  }
  if (phase?.name === "assessing") {
    return { ready: false, questions: phase.questions, answers: phase.answers };
  }
  // Redirect handled by navigate in component if we somehow land here without proper session
  return { ready: false, questions: [], answers: {} };
}

export default function GapsPage() {
  const data = useLoaderData<typeof loader>();
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { streamAI } = useClaude();
  const { saveSession } = useTopicSession(taskId!);
  const abortRef = useRef<AbortController | null>(null);

  const [evalStream, setEvalStream] = useState("");
  const [review, setReview] = useState<{ summary: string; gaps: string[]; context: string } | null>(
    data.ready ? { summary: data.summary, gaps: data.gaps, context: data.context } : null,
  );

  useEffect(() => {
    if (data.ready) return;

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const { questions, answers } = data;
    const qa = questions.map((q, i) => `Q${i + 1}: ${q}\nA${i + 1}: ${answers[i] ?? "(no answer)"}`).join("\n\n");

    void (async () => {
      try {
        const evalText = await streamAI(
          ASSESSMENT_EVAL_SYSTEM,
          qa,
          (acc) => {
            if (!ctrl.signal.aborted) setEvalStream(acc);
          },
          TOKENS_ASSESSMENT_EVAL,
          ctrl.signal,
        );
        if (ctrl.signal.aborted) return;

        const { summary, gaps } = parseJSON<{ summary: string; gaps: string[] }>(evalText);
        const context =
          gaps.length > 0
            ? `Learner level: ${summary}. Key gaps to focus on: ${gaps.join(", ")}.`
            : `Learner level: ${summary}. Knowledge is solid — go deep and cover advanced nuances.`;

        const result = { summary, gaps, context };
        setReview(result);
        void saveSession({ name: "gaps-review", ...result });
      } catch (err) {
        if (!ctrl.signal.aborted) console.error(err);
      }
    })();

    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!review) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader size="sm" />
        <p className="text-sm text-muted-foreground">Evaluating your answers…</p>
        {evalStream && (
          <p className="text-xs text-foreground/40 max-w-sm text-center italic">
            {evalStream.slice(0, 120)}
            {evalStream.length > 120 ? "…" : ""}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-1">
        <Text variant="heading2" as="h2">
          Assessment complete
        </Text>
      </div>
      <p className="text-sm text-muted-foreground mb-6">{review.summary}</p>

      {review.gaps.length > 0 ? (
        <div className="mb-8">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Gaps to cover</p>
          <ul className="flex flex-wrap gap-2">
            {review.gaps.map((gap) => (
              <li key={gap}>
                <Badge variant="warning">{gap}</Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mb-8 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 px-4 py-3 text-sm text-green-800 dark:text-green-300">
          No significant gaps detected — the material will go deep on advanced nuances.
        </div>
      )}

      <Button variant="primary" onClick={() => void navigate("../study", { relative: "path" })}>
        Start studying
      </Button>
    </div>
  );
}
