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
import { ASSESSMENT_EVAL_SYSTEM, isPhaseReadOnly, parseTopicSessionState } from "../../src/lib/phase";
import { db } from "../../src/server/db";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/topic.gaps";

import { Card } from "~/components/Card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

const TOKENS_ASSESSMENT_EVAL = 300;

type LoaderResult = (PhaseByKey<"gaps-review"> | PhaseByKey<"assessing">) & { readOnly: boolean };

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
  const state = record ? parseTopicSessionState(record.phaseData) : { phases: {} };
  const readOnly = isPhaseReadOnly(state, "gaps-review");

  const review = state.phases["gaps-review"];
  if (review) return { ...review, readOnly };
  const assessing = state.phases.assessing;
  if (assessing) return { ...assessing, readOnly };
  return { name: "assessing" as const, questions: [], answers: {}, readOnly };
}

export default function GapsPage() {
  const data = useLoaderData<typeof loader>();
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { stream } = useStreamAI();
  const { saveSession } = useTopicSession(taskId!);

  const [, setEvalStream] = useState("");
  const [review, setReview] = useState<PhaseByKey<"gaps-review"> | null>(
    data.name === "gaps-review"
      ? { name: data.name, summary: data.summary, gaps: data.gaps, context: data.context }
      : null,
  );

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
      <TopicContainer className="py-8 flex flex-col gap-4">
        <Card>
          <h2 className="text-2xl font-semibold text-foreground">
            <Trans>Assessment complete</Trans>
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{review.summary}</p>
        </Card>

        <Card>
          {review.gaps.length > 0 ? (
            <div>
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
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 px-4 py-3 text-sm text-green-800 dark:text-green-300">
              <Trans>No significant gaps detected — the material will go deep on advanced nuances.</Trans>
            </div>
          )}
        </Card>
      </TopicContainer>

      {!data.readOnly && (
        <TopicActionBar>
          <Button className="ml-auto" onClick={() => void navigate("../study", { relative: "path" })}>
            <Trans>Start studying</Trans>
          </Button>
        </TopicActionBar>
      )}
    </>
  );
}
