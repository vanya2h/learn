import { Trans } from "@lingui/react/macro";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useLoaderData, useNavigate, useParams } from "react-router";
import { Markdown } from "../../src/components/Markdown";
import { TopicActionBar } from "../../src/components/TopicActionBar";
import { TopicContainer } from "../../src/components/TopicContainer";
import { useStreamAI } from "../../src/hooks/useStreamAI";
import { useTopicSession } from "../../src/hooks/useTopicSession";
import type { PhaseByKey } from "../../src/lib/phase";
import { HANDS_ON_EVAL_SYSTEM, isPhaseReadOnly, parseTopicSessionState } from "../../src/lib/phase";
import { db } from "../../src/server/db";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/topic.feedback";

import { Card } from "~/components/Card";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";

const TOKENS_HANDS_ON_EVAL = 500;

type LoaderResult = (PhaseByKey<"feedback"> | PhaseByKey<"hands-on">) & { readOnly: boolean };

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
  const readOnly = isPhaseReadOnly(state, "feedback");

  const feedback = state.phases.feedback;
  if (feedback) return { ...feedback, readOnly };
  const handsOn = state.phases["hands-on"];
  if (handsOn) return { ...handsOn, readOnly };
  throw new Response("Not found", { status: 404 });
}

export default function FeedbackPage() {
  const data = useLoaderData<typeof loader>();
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { stream, streaming } = useStreamAI();
  const { saveSession } = useTopicSession(taskId!);

  const [feedback, setFeedback] = useState(data.name === "feedback" ? data.feedback : "");

  const { material, partIdx, answers } = data;
  const { parts, plan } = material;
  const part = parts[partIdx]!;
  const partPlan = plan.partPlans[partIdx];

  useEffect(() => {
    if (data.name === "feedback") return;

    const qa = part.handsOn
      .map((t, i) => `Task ${i + 1}: ${t.task}\nAnswer ${i + 1}: ${answers[i] ?? "(no answer)"}`)
      .join("\n\n");

    void stream(HANDS_ON_EVAL_SYSTEM, qa, setFeedback, TOKENS_HANDS_ON_EVAL).then((result) => {
      if (result !== null) {
        void saveSession({
          name: "feedback",
          material,
          partIdx,
          answers,
          feedback: result,
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleContinue() {
    void saveSession({ name: "write-up", material, partIdx, feedback: "" });
    void navigate("../write-up", { relative: "path" });
  }

  return (
    <>
      <TopicContainer className="py-8 flex flex-col gap-4">
        <Card>
          <p className="text-xs text-muted-foreground mb-2">
            <Trans>Feedback</Trans>
          </p>
          <h2 className="text-2xl font-semibold text-foreground">{partPlan?.title ?? ""}</h2>
        </Card>

        <Card>
          {streaming && (
            <>
              <div className="flex items-center gap-2 mb-6 text-foreground/40">
                <Spinner />
                <p className="text-sm">
                  <Trans>Evaluating your answers…</Trans>
                </p>
              </div>
              {feedback && <Markdown isAnimating>{feedback}</Markdown>}
            </>
          )}

          {!streaming && feedback && <Markdown>{feedback}</Markdown>}
        </Card>
      </TopicContainer>

      {!data.readOnly && (
        <TopicActionBar>
          <Button className="ml-auto" disabled={streaming || !feedback} onClick={handleContinue}>
            <Trans>Reflection</Trans> <ArrowRightIcon />
          </Button>
        </TopicActionBar>
      )}
    </>
  );
}
