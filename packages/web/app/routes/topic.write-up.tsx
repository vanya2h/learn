import { Trans, useLingui } from "@lingui/react/macro";
import { useState } from "react";
import { useLoaderData, useNavigate, useParams } from "react-router";
import { Markdown } from "../../src/components/Markdown";
import { TopicActionBar } from "../../src/components/TopicActionBar";
import { TopicContainer } from "../../src/components/TopicContainer";
import { useProgress } from "../../src/hooks/useProgress";
import { useStreamAI } from "../../src/hooks/useStreamAI";
import { useTopicSession } from "../../src/hooks/useTopicSession";
import { parseTopicSessionState, WRITEUP_SYSTEM } from "../../src/lib/phase";
import { db } from "../../src/server/db";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/topic.write-up";

import { Card } from "~/components/Card";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";

const TOKENS_WRITEUP = 250;

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
  const phase = state.phases["write-up"];
  if (!phase) {
    throw new Response("Not found", { status: 404 });
  }
  return {
    material: phase.material,
    partIdx: phase.partIdx,
    savedFeedback: phase.feedback,
  };
}

export default function WriteUpPage() {
  const { material, partIdx, savedFeedback } = useLoaderData<typeof loader>();
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { stream, streaming, abort } = useStreamAI();
  const { saveSession, deleteSession } = useTopicSession(taskId!);
  const { toggleTask } = useProgress();
  const { t } = useLingui();

  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState(savedFeedback);

  const { parts } = material;
  const part = parts[partIdx]!;

  async function handleSubmit() {
    setFeedback("");
    const result = await stream(
      WRITEUP_SYSTEM,
      `Topic: "${part.title}"\nLearner's reflection: "${text}"`,
      setFeedback,
      TOKENS_WRITEUP,
    );
    if (result !== null) {
      void saveSession({
        name: "write-up",
        material,
        partIdx,
        feedback: result,
      });
    }
  }

  async function handleComplete() {
    abort();
    if (taskId) await toggleTask(taskId);
    void deleteSession();
    void navigate("../complete", { relative: "path" });
  }

  return (
    <>
      <TopicContainer className="py-8 flex flex-col gap-4">
        <Card>
          <h2 className="text-xl font-semibold">
            <Trans>Reflect</Trans>
          </h2>
          <p className="mt-2 text-foreground">{part.writeUpPrompt}</p>
          {!streaming && (
            <div className="mt-4">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t`Write your reflection in your own words…`}
                rows={4}
                aria-label={t`Text input`}
              />
            </div>
          )}
        </Card>

        {(feedback || streaming) && (
          <Card>
            <div className="flex items-center gap-2 mb-2">
              {streaming && <Spinner />}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <Trans>Tutor feedback</Trans>
              </p>
            </div>
            <Markdown isAnimating={streaming}>{feedback}</Markdown>
          </Card>
        )}
      </TopicContainer>

      <TopicActionBar>
        <Button className="ml-auto" onClick={() => void handleSubmit()} disabled={streaming || !!feedback}>
          <Trans>Submit reflection</Trans>
        </Button>
        <Button onClick={() => void handleComplete()} disabled={streaming || !feedback}>
          <Trans>Complete</Trans>
        </Button>
      </TopicActionBar>
    </>
  );
}
