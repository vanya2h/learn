import { Trans } from "@lingui/react/macro";
import { useEffect, useState } from "react";
import { useLoaderData, useNavigate, useParams } from "react-router";
import { LoadingState } from "../../src/components/LoadingState";
import { TopicActionBar } from "../../src/components/TopicActionBar";
import { TopicContainer } from "../../src/components/TopicContainer";
import { useStreamAI } from "../../src/hooks/useStreamAI";
import { useTopicSession } from "../../src/hooks/useTopicSession";
import { parseJSON } from "../../src/lib/json";
import type { PhaseByKey } from "../../src/lib/phase";
import { ASSESSMENT_EVAL_SYSTEM, parsePersistedPhase } from "../../src/lib/phase";
import { db } from "../../src/server/db";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/topic.gaps";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

const TOKENS_ASSESSMENT_EVAL = 300;

type LoaderResult = PhaseByKey<"gaps-review"> | PhaseByKey<"assessing">;

export async function loader({ request, params }: Route.LoaderArgs): Promise<LoaderResult> {
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

  if (phase?.name === "gaps-review") return phase;
  if (phase?.name === "assessing") return phase;
  return { name: "assessing" as const, questions: [], answers: {} };
}

export default function GapsPage() {
  const data = useLoaderData<typeof loader>();
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { stream } = useStreamAI();
  const { saveSession } = useTopicSession(taskId!);

  const [evalStream, setEvalStream] = useState("");
  const [review, setReview] = useState<PhaseByKey<"gaps-review"> | null>(data.name === "gaps-review" ? data : null);

  useEffect(() => {
    if (data.name === "gaps-review") return;

    const { questions, answers } = data;
    const qa = questions.map((q, i) => `Q${i + 1}: ${q}\nA${i + 1}: ${answers[i] ?? "(no answer)"}`).join("\n\n");

    void stream(ASSESSMENT_EVAL_SYSTEM, qa, setEvalStream, TOKENS_ASSESSMENT_EVAL).then((evalText) => {
      if (evalText === null) return;
      const { summary, gaps } = parseJSON<{ summary: string; gaps: string[] }>(evalText);
      const context =
        gaps.length > 0
          ? `Learner level: ${summary}. Key gaps to focus on: ${gaps.join(", ")}.`
          : `Learner level: ${summary}. Knowledge is solid — go deep and cover advanced nuances.`;
      const result = { name: "gaps-review" as const, summary, gaps, context };
      setReview(result);
      void saveSession(result);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!review) {
    return (
      <LoadingState>
        <Trans>Evaluating your answers…</Trans>
      </LoadingState>
    );
  }

  return (
    <>
      <TopicContainer className="py-8">
        <h2 className="text-2xl font-semibold text-foreground mb-1">
          <Trans>Assessment complete</Trans>
        </h2>
        <p className="text-sm text-muted-foreground mb-6">{review.summary}</p>

        {review.gaps.length > 0 ? (
          <div className="mb-8">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              <Trans>Gaps to cover</Trans>
            </p>
            <ul className="flex flex-wrap gap-2">
              {review.gaps.map((gap) => (
                <li key={gap}>
                  <Badge variant="secondary">{gap}</Badge>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mb-8 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 px-4 py-3 text-sm text-green-800 dark:text-green-300">
            <Trans>No significant gaps detected — the material will go deep on advanced nuances.</Trans>
          </div>
        )}
      </TopicContainer>

      <TopicActionBar>
        <Button className="ml-auto" onClick={() => void navigate("../study", { relative: "path" })}>
          <Trans>Start studying</Trans>
        </Button>
      </TopicActionBar>
    </>
  );
}
