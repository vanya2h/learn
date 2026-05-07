import { Trans } from "@lingui/react/macro";
import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { DetailedError, parseResponse } from "hono/client";
import { useEffect, useRef, useState } from "react";
import { redirect, useNavigate, useParams, useRevalidator, useRouteLoaderData } from "react-router";
import { BuilderActionBar } from "../../src/components/CurriculumBuilder/BuilderActionBar";
import { SelectableCard } from "../../src/components/CurriculumBuilder/SelectableCard";
import { TopicContainer } from "../../src/components/TopicContainer";
import { parsePhase, type Phase, type Task } from "../../src/data/types";
import { apiClient } from "../../src/lib/apiClient";
import { readSSEStream } from "../../src/lib/claude";
import { parseJSON } from "../../src/lib/json";
import { getCurriculumLinks } from "../../src/lib/routes";
import { db } from "../../src/server/db";
import { requireSession } from "../../src/server/session";
import { useRootData } from "../hooks/useRootData";
import type { Route } from "./+types/curriculum.draft.phases";
import type { DraftLoaderData } from "./curriculum.draft";

import { Card } from "~/components/Card";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireSession(request);
  const draft = await db.customCurriculum.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  const links = getCurriculumLinks();
  if (!draft) throw redirect(links.new);
  if (draft.status === "published") throw redirect(links.byId(draft.id));
  if (!draft.outline) throw redirect(links.draft(draft.id).outline);
  return { ok: true };
}

export default function DraftPhasesPage() {
  const layoutData = useRouteLoaderData<DraftLoaderData>("routes/curriculum.draft");
  const { id, phaseId } = useParams<{ id: string; phaseId: string }>();
  const navigate = useNavigate();
  const { revalidate } = useRevalidator();
  const root = useRootData();
  const locale = root?.locale ?? "en";
  const abortRef = useRef<AbortController | null>(null);

  const outline = layoutData?.draft.outline;
  const selections = layoutData?.draft.selections;
  const generatedPhases = layoutData?.draft.generatedPhases ?? {};
  const selectedPhaseIds = selections?.selectedPhaseIds ?? [];
  const deselectedTaskIds = new Set(selections?.deselectedTaskIds ?? []);

  const orderedSelected = (outline?.phases ?? []).filter((p) => selectedPhaseIds.includes(p.id));
  const currentIdx = orderedSelected.findIndex((p) => p.id === phaseId);
  const outlinePhase = currentIdx >= 0 ? orderedSelected[currentIdx] : undefined;
  const total = orderedSelected.length;
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === total - 1;

  const persistedPhase = phaseId ? parsePhase(generatedPhases[phaseId]) : null;
  const [streamPhase, setStreamPhase] = useState<Phase | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phase = persistedPhase ?? streamPhase;
  const allSelectedDone = orderedSelected.every((p) => parsePhase(generatedPhases[p.id]));

  useEffect(() => {
    if (!id || !phaseId) return;
    if (persistedPhase) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    async function generate() {
      setError(null);

      setStreaming(true);

      setStreamPhase(null);
      try {
        const res = await apiClient.api.curriculums.drafts[":id"]["generate-phase"].$post(
          { param: { id: id! }, json: { phaseId: phaseId!, locale } },
          { init: { signal: ctrl.signal } },
        );
        if (!res.ok) await parseResponse(res);
        if (!res.body) throw new Error("No response body");

        let accumulated = "";
        for await (const delta of readSSEStream(res.body)) {
          accumulated += delta;
          try {
            const partial = parsePhase(parseJSON<unknown>(accumulated));
            if (partial) setStreamPhase(partial);
          } catch {
            // partial stream not yet parseable
          }
        }
        const final = parsePhase(parseJSON<unknown>(accumulated));
        if (final) setStreamPhase(final);
        setStreaming(false);
        revalidate();
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const data = err instanceof DetailedError ? (err.detail?.data as { error?: string } | undefined) : undefined;
        setError(data?.error ?? "Failed to generate phase");
        setStreaming(false);
      }
    }

    void generate();
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseId]);

  async function toggleTask(taskId: string) {
    if (!id || !selections) return;
    const next = new Set(selections.deselectedTaskIds);
    if (next.has(taskId)) next.delete(taskId);
    else next.add(taskId);
    await parseResponse(
      apiClient.api.curriculums.drafts[":id"].$patch({
        param: { id },
        json: {
          selections: {
            selectedPhaseIds: selections.selectedPhaseIds,
            deselectedTaskIds: [...next],
            currentPhaseIdx: selections.currentPhaseIdx,
          },
        },
      }),
    );
    revalidate();
  }

  async function navigateTo(idx: number) {
    if (!id) return;
    const target = orderedSelected[idx];
    if (!target) return;
    if (selections) {
      void apiClient.api.curriculums.drafts[":id"].$patch({
        param: { id },
        json: {
          selections: {
            selectedPhaseIds: selections.selectedPhaseIds,
            deselectedTaskIds: selections.deselectedTaskIds,
            currentPhaseIdx: idx,
          },
        },
      });
    }
    void navigate(getCurriculumLinks().draft(id).phases(target.id));
  }

  async function finishAndPublish() {
    if (!id) return;
    const result = await parseResponse(apiClient.api.curriculums.drafts[":id"].publish.$post({ param: { id } }));
    void navigate(getCurriculumLinks().draft(result.id).finish);
  }

  if (!outlinePhase) {
    return (
      <TopicContainer className="py-8">
        <p className="text-sm text-muted-foreground">
          <Trans>Phase not found.</Trans>
        </p>
      </TopicContainer>
    );
  }

  return (
    <>
      <TopicContainer className="py-8">
        {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

        <Card.List>
          <Card.Entry className="flex items-baseline justify-between gap-4">
            <div className="flex flex-col">
              <Card.Heading>{outlinePhase.title}</Card.Heading>
              {outlinePhase.subtitle && <Card.CardSubheading>{outlinePhase.subtitle}</Card.CardSubheading>}
            </div>
            <span className="shrink-0 font-mono text-[11px] tracking-[0.04em] text-foreground/40 tabular-nums">
              <Trans>
                Phase {currentIdx + 1} of {total}
              </Trans>
            </span>
          </Card.Entry>

          {streaming && !phase && (
            <Card.Entry className="flex items-center gap-2 text-foreground/40">
              <Spinner />
              <p className="text-sm">
                <Trans>Generating phase…</Trans>
              </p>
            </Card.Entry>
          )}

          {(phase?.tasks.length || 0) > 0 && (
            <Card.Entry className="flex flex-col gap-2">
              {phase?.tasks.map((task) => (
                <SelectableCard
                  key={task.id}
                  selected={!deselectedTaskIds.has(task.id)}
                  readOnly={!persistedPhase}
                  onToggle={persistedPhase ? () => void toggleTask(task.id) : undefined}
                  title={<TaskTitle task={task} />}
                />
              ))}
            </Card.Entry>
          )}
        </Card.List>
      </TopicContainer>

      <BuilderActionBar>
        <Button variant="outline" disabled={isFirst || streaming} onClick={() => void navigateTo(currentIdx - 1)}>
          <ArrowLeftIcon /> <Trans>Previous</Trans>
        </Button>

        {isLast && allSelectedDone ? (
          <Button className="ml-auto" disabled={streaming} onClick={() => void finishAndPublish()}>
            <Trans>Finish</Trans> <ArrowRightIcon />
          </Button>
        ) : (
          <Button className="ml-auto" disabled={isLast || streaming} onClick={() => void navigateTo(currentIdx + 1)}>
            <Trans>Next</Trans> <ArrowRightIcon />
          </Button>
        )}
      </BuilderActionBar>
    </>
  );
}

function TaskTitle({ task }: { task: Task }) {
  return (
    <span className="text-sm leading-snug">
      {task.title}
      {task.estMinutes !== undefined && (
        <span className="ml-2 text-xs text-muted-foreground font-normal">
          ~{task.estMinutes >= 60 ? `${Math.round(task.estMinutes / 60)}h` : `${task.estMinutes}m`}
        </span>
      )}
    </span>
  );
}
