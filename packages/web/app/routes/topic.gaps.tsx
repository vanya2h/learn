import { Trans } from "@lingui/react/macro";
import { useEffect, useState } from "react";
import { useLoaderData, useNavigate, useParams } from "react-router";
import { PageBody } from "../../src/components/layout/PageBody";
import { PageContent } from "../../src/components/layout/PageContent";
import { ReadingColumn } from "../../src/components/layout/ReadingColumn";
import { TopicActionBar } from "../../src/components/TopicActionBar";
import { useStreamAI } from "../../src/hooks/useStreamAI";
import { useTopicSession } from "../../src/hooks/useTopicSession";
import { useClaude } from "../../src/lib/claude";
import { parseJSON } from "../../src/lib/json";
import type { GapEntry, GapItem, GapLevel, PhaseByKey } from "../../src/lib/phase";
import { isLegacyGap, isPhaseReadOnly, parseTopicSessionState } from "../../src/lib/phase";
import { db } from "../../src/server/db";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/topic.gaps";

import { Card } from "~/components/Card";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { cn } from "~/lib/utils";

const VALID_LEVELS = ["partially-known", "no-knowledge"] as const satisfies readonly GapLevel[];

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
  const { run } = useStreamAI();
  const { streamGaps } = useClaude();
  const { saveSession } = useTopicSession(taskId!);

  const [streamReview, setStreamReview] = useState<{ summary?: string; gaps?: GapItem[] }>({});
  const [review, setReview] = useState<PhaseByKey<"gaps-review"> | null>(
    data.name === "gaps-review"
      ? { name: data.name, summary: data.summary, gaps: data.gaps, context: data.context }
      : null,
  );

  useEffect(() => {
    if (data.name === "gaps-review") return;

    const { questions, answers } = data;
    const qa = questions.map((q, i) => ({ q, a: answers[i] ?? "" }));

    void run((signal) =>
      streamGaps(
        { qa },
        {
          signal,
          onUpdate: (acc) => {
            try {
              const partial = parseJSON<{ summary?: unknown; gaps?: unknown }>(acc);
              setStreamReview({
                summary: typeof partial.summary === "string" ? partial.summary : undefined,
                gaps: Array.isArray(partial.gaps) ? partial.gaps.filter(isGapItem) : undefined,
              });
            } catch {
              // partial stream not yet parseable
            }
          },
        },
      ),
    ).then((evalText) => {
      if (evalText === null) return;
      const { summary, gaps } = parseJSON<{ summary: string; gaps: unknown[] }>(evalText);
      const cleanGaps = Array.isArray(gaps) ? gaps.filter(isGapItem) : [];
      const context =
        cleanGaps.length > 0
          ? `Learner level: ${summary}. Key gaps to focus on: ${cleanGaps.map((g) => g.title).join(", ")}.`
          : `Learner level: ${summary}. Knowledge is solid — go deep and cover advanced nuances.`;
      const result = { name: "gaps-review" as const, summary, gaps: cleanGaps, context };
      setReview(result);
      void saveSession(result);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoading = !review;
  const summary = review?.summary ?? streamReview.summary;
  const gaps: GapEntry[] = review?.gaps ?? streamReview.gaps ?? [];

  const partialCount = gaps.reduce((acc, g) => acc + (!isLegacyGap(g) && g.level === "partially-known" ? 1 : 0), 0);

  return (
    <PageBody>
      <PageContent>
        <ReadingColumn>
          <Card.List>
            <Card.Entry className="flex items-baseline justify-between gap-4">
              <div className="flex flex-col gap-2">
                <Card.Heading>
                  {isLoading ? (
                    <Trans>Evaluating your answers…</Trans>
                  ) : (
                    <Trans>Here&apos;s what your assessment showed</Trans>
                  )}
                </Card.Heading>
                {summary && <Card.SubHeading>{summary}</Card.SubHeading>}
              </div>
              {!isLoading && gaps.length > 0 && (
                <span className="font-mono text-[11px] tracking-[0.04em] text-foreground/40 tabular-nums">
                  {gaps.length} <Trans>gaps</Trans>
                  {partialCount > 0 && (
                    <>
                      {" · "}
                      {partialCount} <Trans>partially known</Trans>
                    </>
                  )}
                </span>
              )}
            </Card.Entry>

            {isLoading && gaps.length === 0 && (
              <Card.Entry className="flex flex-row items-center gap-2 text-foreground/40">
                <Spinner />
                <p className="text-sm">
                  <Trans>Identifying gaps…</Trans>
                </p>
              </Card.Entry>
            )}

            {!isLoading && gaps.length === 0 && (
              <Card.Entry className="text-sm text-muted-foreground">
                <Trans>No significant gaps detected — the material will go deep on advanced nuances.</Trans>
              </Card.Entry>
            )}

            {gaps.map((gap, i) => (
              <GapRow key={i} gap={gap} />
            ))}
          </Card.List>
        </ReadingColumn>
      </PageContent>

      {!data.readOnly && (
        <TopicActionBar>
          <Button
            className="ml-auto"
            disabled={isLoading}
            onClick={() => void navigate("../study", { relative: "path" })}
          >
            <Trans>Start studying</Trans>
          </Button>
        </TopicActionBar>
      )}
    </PageBody>
  );
}

function GapRow({ gap }: { gap: GapEntry }) {
  if (isLegacyGap(gap)) {
    // TODO(legacy gaps): drop this branch once all stored gaps-review sessions
    // have been re-generated under the new {title, description, level} shape.
    return (
      <Card.Entry>
        <p className="text-sm font-medium text-foreground">{gap}</p>
      </Card.Entry>
    );
  }
  return (
    <Card.Entry className="flex items-start justify-between gap-6">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{gap.title}</p>
        {gap.description && <p className="mt-1 text-sm text-muted-foreground">{gap.description}</p>}
      </div>
      <LevelPill level={gap.level} />
    </Card.Entry>
  );
}

function LevelPill({ level }: { level: GapLevel }) {
  const isPartial = level === "partially-known";
  return (
    <span
      className={cn(
        "shrink-0 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase",
        isPartial ? "text-amber-500 dark:text-amber-400" : "text-foreground/40",
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", isPartial ? "bg-amber-500 dark:bg-amber-400" : "bg-foreground/30")}
        aria-hidden
      />
      {isPartial ? <Trans>Partial</Trans> : <Trans>Gap</Trans>}
    </span>
  );
}

function isGapItem(value: unknown): value is GapItem {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.title === "string" &&
    typeof v.description === "string" &&
    typeof v.level === "string" &&
    (VALID_LEVELS as readonly string[]).includes(v.level)
  );
}
