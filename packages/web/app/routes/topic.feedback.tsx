import { Button } from "@cloudflare/kumo/components/button";
import { LayerCard } from "@cloudflare/kumo/components/layer-card";
import { Loader } from "@cloudflare/kumo/components/loader";
import { Trans } from "@lingui/react/macro";
import { useEffect, useState } from "react";
import { useLoaderData, useNavigate, useParams } from "react-router";
import { Markdown } from "../../src/components/Markdown";
import { useStreamAI } from "../../src/hooks/useStreamAI";
import { useTopicSession } from "../../src/hooks/useTopicSession";
import type { PhaseByKey } from "../../src/lib/phase";
import { HANDS_ON_EVAL_SYSTEM, parsePersistedPhase } from "../../src/lib/phase";
import { db } from "../../src/server/db";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/topic.feedback";

const TOKENS_HANDS_ON_EVAL = 500;

type LoaderResult = PhaseByKey<"feedback"> | PhaseByKey<"hands-on">;

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

  if (phase?.name === "feedback") return phase;
  if (phase?.name === "hands-on") return phase;
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
  const { parts } = material;
  const part = parts[partIdx]!;

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
    <div className="max-w-2xl mx-auto px-6 py-8">
      <LayerCard className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <Trans>Feedback</Trans>
          </p>
          {streaming && <Loader size="sm" />}
        </div>
        {feedback || streaming ? (
          <Markdown isAnimating={streaming}>{feedback}</Markdown>
        ) : (
          <div className="flex items-center gap-2 text-foreground/40">
            <Loader size="sm" />
            <p className="text-sm">
              <Trans>Evaluating your answers…</Trans>
            </p>
          </div>
        )}
      </LayerCard>

      {!streaming && feedback && (
        <div className="mt-6">
          <Button variant="primary" onClick={handleContinue}>
            <Trans>Move to reflection →</Trans>
          </Button>
        </div>
      )}
    </div>
  );
}
