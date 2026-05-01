import { Button } from "@cloudflare/kumo/components/button";
import { InputArea } from "@cloudflare/kumo/components/input";
import { LayerCard } from "@cloudflare/kumo/components/layer-card";
import { Loader } from "@cloudflare/kumo/components/loader";
import { useRef, useState } from "react";
import { useLoaderData, useNavigate, useParams } from "react-router";
import { Markdown } from "../../src/components/Markdown";
import { useProgress } from "../../src/hooks/useProgress";
import { useTopicSession } from "../../src/hooks/useTopicSession";
import { useClaude } from "../../src/lib/claude";
import type { PersistedPhase } from "../../src/lib/phase";
import { WRITEUP_SYSTEM } from "../../src/lib/phase";
import { db } from "../../src/server/db";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/topic.write-up";

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
  const phase = record?.phaseData as PersistedPhase | null;
  if (phase?.name !== "write-up") {
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
  const { streamAI } = useClaude();
  const { saveSession, deleteSession } = useTopicSession(taskId!);
  const { toggleTask } = useProgress();
  const abortRef = useRef<AbortController | null>(null);

  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState(savedFeedback);
  const [streaming, setStreaming] = useState(false);

  const { parts } = material;
  const part = parts[partIdx]!;

  async function handleSubmit() {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setStreaming(true);
    setFeedback("");

    try {
      await streamAI(
        WRITEUP_SYSTEM,
        `Topic: "${part.title}"\nLearner's reflection: "${text}"`,
        (acc) => {
          if (!ctrl.signal.aborted) setFeedback(acc);
        },
        TOKENS_WRITEUP,
        ctrl.signal,
      );
      if (ctrl.signal.aborted) return;
      setStreaming(false);
      void saveSession({
        name: "write-up",
        material,
        partIdx,
        feedback,
      });
    } catch (err) {
      if (!ctrl.signal.aborted) console.error(err);
    }
  }

  async function handleComplete() {
    abortRef.current?.abort();
    if (taskId) await toggleTask(taskId);
    void deleteSession();
    void navigate("../complete", { relative: "path" });
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-4 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
        <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1">Reflect</p>
        <p className="text-sm text-foreground">{part.writeUpPrompt}</p>
      </div>

      {!feedback && !streaming && (
        <>
          <InputArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your reflection in your own words…"
            rows={5}
            aria-label="Text input"
            className="w-full"
          />
          <div className="mt-4">
            <Button variant="primary" onClick={() => void handleSubmit()} disabled={text.trim().length < 20}>
              Submit reflection
            </Button>
          </div>
        </>
      )}

      {(feedback || streaming) && (
        <div className="mt-4">
          <div className="text-xs text-muted-foreground italic mb-1">Your reflection:</div>
          <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">{text}</p>

          <LayerCard className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tutor feedback</p>
              {streaming && <Loader size="sm" />}
            </div>
            <Markdown isAnimating={streaming}>{feedback}</Markdown>
          </LayerCard>

          {!streaming && (
            <div className="mt-6">
              <Button variant="primary" onClick={() => void handleComplete()}>
                Complete →
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
