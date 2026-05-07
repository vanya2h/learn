import { Trans } from "@lingui/react/macro";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { DetailedError, parseResponse } from "hono/client";
import { useEffect, useRef, useState } from "react";
import { redirect, useNavigate, useParams, useRevalidator, useRouteLoaderData } from "react-router";
import { BuilderActionBar } from "../../src/components/CurriculumBuilder/BuilderActionBar";
import { SelectableCard } from "../../src/components/CurriculumBuilder/SelectableCard";
import { TopicContainer } from "../../src/components/TopicContainer";
import { type CurriculumOutline, parseCurriculumOutline } from "../../src/data/types";
import { apiClient } from "../../src/lib/apiClient";
import { readSSEStream } from "../../src/lib/claude";
import { parseJSON } from "../../src/lib/json";
import { getCurriculumLinks } from "../../src/lib/routes";
import { db } from "../../src/server/db";
import { requireSession } from "../../src/server/session";
import { useRootData } from "../hooks/useRootData";
import type { Route } from "./+types/curriculum.draft.outline";
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
  return { hasOutline: !!draft.outline, hasText: !!draft.textContent };
}

export default function DraftOutlinePage() {
  const layoutData = useRouteLoaderData<DraftLoaderData>("routes/curriculum.draft");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { revalidate } = useRevalidator();
  const root = useRootData();
  const locale = root?.locale ?? "en";
  const abortRef = useRef<AbortController | null>(null);

  const initialOutline = layoutData?.draft.outline ?? null;
  const initialSelectedIds = layoutData?.draft.selections?.selectedPhaseIds ?? [];

  const [streamOutline, setStreamOutline] = useState<CurriculumOutline | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);

  const outline = initialOutline ?? streamOutline;

  useEffect(() => {
    if (!id || initialOutline) return;
    void run();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function ensureExtracted() {
    if (!id) return;
    if (!layoutData?.draft.textContent) {
      await parseResponse(apiClient.api.curriculums.drafts[":id"].extract.$post({ param: { id } }));
    }
  }

  async function run(feedback?: string) {
    if (!id) return;
    setError(null);
    setStreaming(true);
    setStreamOutline(null);

    try {
      await ensureExtracted();

      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const res = await apiClient.api.curriculums.drafts[":id"]["generate-outline"].$post(
        { param: { id }, json: { feedback, locale } },
        { init: { signal: ctrl.signal } },
      );
      if (!res.ok) await parseResponse(res);
      if (!res.body) throw new Error("No response body");

      let accumulated = "";
      for await (const delta of readSSEStream(res.body)) {
        accumulated += delta;
        try {
          const partial = parseCurriculumOutline(parseJSON<unknown>(accumulated));
          if (partial) setStreamOutline(partial);
        } catch {
          // partial stream not yet parseable
        }
      }

      const final = parseCurriculumOutline(parseJSON<unknown>(accumulated));
      if (!final) {
        setError("Couldn't parse the curriculum outline — try regenerating");
        setStreaming(false);
        return;
      }
      setStreamOutline(final);
      setSelectedIds(final.phases.map((p) => p.id));
      setStreaming(false);
      revalidate();
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const data = err instanceof DetailedError ? (err.detail?.data as { error?: string } | undefined) : undefined;
      setError(data?.error ?? "Failed to generate outline");
      setStreaming(false);
    }
  }

  function toggle(phaseId: string) {
    setSelectedIds((prev) => (prev.includes(phaseId) ? prev.filter((p) => p !== phaseId) : [...prev, phaseId]));
  }

  async function startGenerating() {
    if (!id || !outline || selectedIds.length === 0) return;
    await parseResponse(
      apiClient.api.curriculums.drafts[":id"].$patch({
        param: { id },
        json: { selections: { selectedPhaseIds: selectedIds, deselectedTaskIds: [], currentPhaseIdx: 0 } },
      }),
    );
    const firstPhase = outline.phases.find((p) => selectedIds.includes(p.id));
    if (firstPhase) void navigate(getCurriculumLinks().draft(id).phases(firstPhase.id));
  }

  return (
    <>
      <TopicContainer className="py-8">
        {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

        <Card.List>
          <Card.Entry className="flex items-baseline justify-between gap-4">
            <div className="flex flex-col">
              <Card.Heading>
                {outline?.name || (streaming ? <Trans>Generating outline…</Trans> : <Trans>Outline</Trans>)}
              </Card.Heading>
              {outline?.description && <Card.CardSubheading>{outline.description}</Card.CardSubheading>}
            </div>
            {!streaming && initialOutline && (
              <Button variant="ghost" size="sm" onClick={() => void run()}>
                <Trans>Regenerate</Trans>
              </Button>
            )}
          </Card.Entry>

          {streaming && !outline && (
            <Card.Entry className="flex items-center gap-2 text-foreground/40">
              <Spinner />
              <p className="text-sm">
                <Trans>Generating outline…</Trans>
              </p>
            </Card.Entry>
          )}

          {(outline?.phases.length || 0) > 0 && (
            <Card.Entry className="flex flex-col gap-2">
              {outline?.phases.map((phase) => (
                <SelectableCard
                  key={phase.id}
                  selected={selectedIds.includes(phase.id)}
                  onToggle={streaming ? undefined : () => toggle(phase.id)}
                  readOnly={streaming}
                  title={phase.title}
                  description={phase.subtitle}
                />
              ))}
            </Card.Entry>
          )}
        </Card.List>
      </TopicContainer>

      <BuilderActionBar>
        <Button
          className="ml-auto"
          onClick={() => void startGenerating()}
          disabled={streaming || !outline || selectedIds.length === 0}
        >
          <Trans>Start generating</Trans> <ArrowRightIcon className="inline ml-1" />
        </Button>
      </BuilderActionBar>
    </>
  );
}
