import { Button } from "@cloudflare/kumo/components/button";
import { LayerCard } from "@cloudflare/kumo/components/layer-card";
import { Loader } from "@cloudflare/kumo/components/loader";
import { useEffect, useRef, useState } from "react";
import { useLoaderData, useNavigate, useParams } from "react-router";
import { Markdown } from "../../src/components/Markdown";
import { useTopicSession } from "../../src/hooks/useTopicSession";
import { useClaude } from "../../src/lib/claude";
import type { PersistedPhase } from "../../src/lib/phase";
import { HANDS_ON_EVAL_SYSTEM } from "../../src/lib/phase";
import { db } from "../../src/server/db";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/topic.feedback";

const TOKENS_HANDS_ON_EVAL = 500;

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireSession(request);
  const record = await db.topicSession.findUnique({
    where: { userId_taskId: { userId: session.user.id, taskId: params.taskId } },
  });
  const phase = record?.phaseData as PersistedPhase | null;

  if (phase?.name === "feedback") {
    return {
      ready: true as const,
      material: phase.material,
      partIdx: phase.partIdx,
      answers: phase.answers,
      feedback: phase.feedback,
    };
  }
  if (phase?.name === "hands-on") {
    return { ready: false as const, material: phase.material, partIdx: phase.partIdx, answers: phase.answers };
  }
  throw new Response("Not found", { status: 404 });
}

export default function FeedbackPage() {
  const data = useLoaderData<typeof loader>();
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { streamAI } = useClaude();
  const { saveSession } = useTopicSession(taskId!);
  const abortRef = useRef<AbortController | null>(null);

  const [feedback, setFeedback] = useState(data.ready ? data.feedback : "");
  const [streaming, setStreaming] = useState(false);

  const { material, partIdx, answers } = data;
  const { parts } = material;
  const part = parts[partIdx]!;

  useEffect(() => {
    if (data.ready) return;

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStreaming(true);

    const qa = part.handsOn
      .map((t, i) => `Task ${i + 1}: ${t.task}\nAnswer ${i + 1}: ${answers[i] ?? "(no answer)"}`)
      .join("\n\n");

    void (async () => {
      try {
        await streamAI(
          HANDS_ON_EVAL_SYSTEM,
          qa,
          (acc) => {
            if (!ctrl.signal.aborted) setFeedback(acc);
          },
          TOKENS_HANDS_ON_EVAL,
          ctrl.signal,
        );
        if (ctrl.signal.aborted) return;
        setStreaming(false);
        void saveSession({ name: "feedback", material, partIdx, answers, feedback });
      } catch (err) {
        if (!ctrl.signal.aborted) console.error(err);
      }
    })();

    return () => ctrl.abort();
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
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Feedback</p>
          {streaming && <Loader size="sm" />}
        </div>
        {feedback || streaming ? (
          <Markdown isAnimating={streaming}>{feedback}</Markdown>
        ) : (
          <div className="flex items-center gap-2 text-foreground/40">
            <Loader size="sm" />
            <p className="text-sm">Evaluating your answers…</p>
          </div>
        )}
      </LayerCard>

      {!streaming && feedback && (
        <div className="mt-6">
          <Button variant="primary" onClick={handleContinue}>
            Move to reflection →
          </Button>
        </div>
      )}
    </div>
  );
}
