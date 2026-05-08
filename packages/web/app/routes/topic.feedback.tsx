import { Trans } from "@lingui/react/macro";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useLoaderData, useNavigate, useParams } from "react-router";
import { PageBody } from "../../src/components/layout/PageBody";
import { PageContent } from "../../src/components/layout/PageContent";
import { ReadingColumn } from "../../src/components/layout/ReadingColumn";
import { Markdown } from "../../src/components/Markdown";
import { TopicActionBar } from "../../src/components/TopicActionBar";
import { useStreamAI } from "../../src/hooks/useStreamAI";
import { useTopicSession } from "../../src/hooks/useTopicSession";
import { useClaude } from "../../src/lib/claude";
import type { PhaseByKey } from "../../src/lib/phase";
import { isPhaseReadOnly, parseTopicSessionState } from "../../src/lib/phase";
import { db } from "../../src/server/db";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/topic.feedback";

import { Card } from "~/components/Card";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";

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
  const { run, streaming } = useStreamAI();
  const { streamHandsOnFeedback } = useClaude();
  const { saveSession } = useTopicSession(taskId!);

  const [feedback, setFeedback] = useState(data.name === "feedback" ? data.feedback : "");

  const { material, partIdx, answers } = data;
  const { parts, plan } = material;
  const part = parts[partIdx]!;
  const partPlan = plan.partPlans[partIdx];

  useEffect(() => {
    if (data.name === "feedback") return;

    const qa = part.handsOn.map((t, i) => ({ task: t.task, answer: answers[i] ?? "" }));

    void run((signal) => streamHandsOnFeedback({ qa }, { signal, onUpdate: setFeedback })).then((result) => {
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
    <PageBody>
      <PageContent>
        <ReadingColumn>
          <Card.List>
            <Card.Entry className="flex items-baseline justify-between gap-4">
              <div className="flex flex-col gap-2">
                <Card.Heading>{partPlan?.title ?? ""}</Card.Heading>
                {partPlan?.description && <Card.SubHeading>{partPlan.description}</Card.SubHeading>}
              </div>
              <span className="hidden md:inline shrink-0 font-mono text-[11px] tracking-[0.04em] text-foreground/40 tabular-nums">
                <Trans>Feedback</Trans>
              </span>
            </Card.Entry>

            {streaming && (
              <Card.Entry className="flex flex-row items-center gap-2 text-foreground/40">
                <Spinner />
                <p className="text-sm">
                  <Trans>Evaluating your answers…</Trans>
                </p>
              </Card.Entry>
            )}

            {streaming && feedback && (
              <Card.Entry>
                <Markdown isAnimating>{feedback}</Markdown>
              </Card.Entry>
            )}

            {!streaming && feedback && (
              <Card.Entry>
                <Markdown>{feedback}</Markdown>
              </Card.Entry>
            )}
          </Card.List>
        </ReadingColumn>
      </PageContent>

      {!data.readOnly && (
        <TopicActionBar>
          <Button className="ml-auto" disabled={streaming || !feedback} onClick={handleContinue}>
            <Trans>Reflection</Trans> <ArrowRightIcon />
          </Button>
        </TopicActionBar>
      )}
    </PageBody>
  );
}
