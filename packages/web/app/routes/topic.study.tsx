import { Trans } from "@lingui/react/macro";
import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useLoaderData, useNavigate, useParams, useRouteLoaderData } from "react-router";
import { PageBody } from "../../src/components/layout/PageBody";
import { PageContent } from "../../src/components/layout/PageContent";
import { ReadingColumn } from "../../src/components/layout/ReadingColumn";
import { Markdown } from "../../src/components/Markdown";
import { TopicActionBar } from "../../src/components/TopicActionBar";
import { useTopicSession } from "../../src/hooks/useTopicSession";
import { useClaude } from "../../src/lib/claude";
import type { Material, PhaseByKey } from "../../src/lib/phase";
import { isPhaseReadOnly, parsePart, parsePlan, parseTopicSessionState } from "../../src/lib/phase";
import { db } from "../../src/server/db";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/topic.study";
import type { loader as layoutLoader } from "./topic-layout";

import { Card } from "~/components/Card";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";

type LoaderResult = (PhaseByKey<"study"> | PhaseByKey<"gaps-review"> | { name: null }) & { readOnly: boolean };

export async function loader({ request, params }: Route.LoaderArgs): Promise<LoaderResult> {
  const session = await requireSession(request);
  const record = await db.topicSession.findUnique({
    where: { userId_taskId: { userId: session.user.id, taskId: params.taskId } },
  });
  const state = record ? parseTopicSessionState(record.phaseData) : { phases: {} };
  const readOnly = isPhaseReadOnly(state, "study");

  const study = state.phases.study;
  if (study) return { ...study, readOnly };
  const gaps = state.phases["gaps-review"];
  if (gaps) return { ...gaps, readOnly };
  return { name: null, readOnly };
}

export default function StudyPage() {
  const loaderData = useLoaderData<typeof loader>();
  const layoutData = useRouteLoaderData<typeof layoutLoader>("routes/topic-layout");
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { streamStudyPlan, streamStudyPart } = useClaude();
  const { saveSession: rawSaveSession } = useTopicSession(taskId!);
  const abortRef = useRef<AbortController | null>(null);

  const task = layoutData?.task;
  const curriculumName = layoutData?.curriculumName;
  const complexity = layoutData?.complexity;

  const [material, setMaterial] = useState<Material | null>(loaderData.name === "study" ? loaderData.material : null);
  const [partIdx, setPartIdx] = useState(loaderData.name === "study" ? loaderData.partIdx : 0);
  const [partStream, setPartStream] = useState("");

  function newAbort() {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    return ctrl;
  }

  const { readOnly } = loaderData;
  const saveSession: typeof rawSaveSession = (phase) =>
    readOnly ? Promise.resolve({ ok: true } as never) : rawSaveSession(phase);

  async function loadPart(idx: number, mat: Material, ctrl: AbortController) {
    const partPlan = mat.plan.partPlans[idx];
    if (!partPlan) return;

    if (!task) return;

    try {
      const text = await streamStudyPart(
        {
          topic: task.title,
          curriculum: curriculumName ?? "",
          complexity,
          assessmentContext: mat.assessmentContext,
          partIdx: idx,
          parts: mat.plan.partPlans,
        },
        {
          signal: ctrl.signal,
          onUpdate: (acc) => {
            if (!ctrl.signal.aborted) {
              try {
                setPartStream(parsePart(acc).study);
              } catch {
                // partial stream not yet parseable
              }
            }
          },
        },
      );
      if (ctrl.signal.aborted) return;

      const studyPart = parsePart(text);
      setMaterial((prev) => {
        if (!prev) return prev;
        const updatedParts = prev.parts.map((p, i) => (i === idx ? studyPart : p));
        const updated = { ...prev, parts: updatedParts };
        void saveSession({
          name: "study",
          material: updated,
          partIdx: idx,
        });
        return updated;
      });
      setPartStream("");
    } catch (err) {
      if (!ctrl.signal.aborted) console.error(err);
    }
  }

  async function generatePlan() {
    if (!task) return;
    const ctrl = newAbort();
    const assessmentContext = loaderData.name === "gaps-review" ? loaderData.context : undefined;

    try {
      const text = await streamStudyPlan(
        {
          topic: task.title,
          curriculum: curriculumName ?? "",
          complexity,
          assessmentContext,
        },
        { signal: ctrl.signal },
      );
      if (ctrl.signal.aborted) return;

      const plan = parsePlan(text);

      const newMaterial: Material = {
        plan,
        parts: Array<null>(plan.partPlans.length).fill(null),
        assessmentContext,
      };

      setMaterial(newMaterial);
      setPartIdx(0);
      void saveSession({
        name: "study",
        material: newMaterial,
        partIdx: 0,
      });
      void loadPart(0, newMaterial, ctrl);
    } catch (err) {
      if (!ctrl.signal.aborted) console.error(err);
    }
  }

  // On mount: generate plan if no session, or resume incomplete part
  useEffect(() => {
    if (loaderData.name !== "study") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void generatePlan();
    } else if (!loaderData.material.parts[loaderData.partIdx]) {
      const ctrl = newAbort();
      void loadPart(loaderData.partIdx, loaderData.material, ctrl);
    }
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleGoToPart(idx: number) {
    if (!material || !material.parts[idx]) return;
    setPartIdx(idx);
    void saveSession({ name: "study", material, partIdx: idx });
  }

  function handleNextPart() {
    if (!material) return;
    const nextIdx = partIdx + 1;
    setPartIdx(nextIdx);
    if (!material.parts[nextIdx]) {
      const ctrl = newAbort();
      void loadPart(nextIdx, material, ctrl);
    }
    void saveSession({ name: "study", material, partIdx: nextIdx });
  }

  function handleMoveToHandsOn() {
    if (!material) return;
    void saveSession({ name: "hands-on", material, partIdx, answers: {} });
    void navigate("../hands-on", { relative: "path" });
  }

  const partPlan = material?.plan.partPlans[partIdx];
  const part = material?.parts[partIdx];
  const totalParts = material?.plan.partPlans.length ?? 0;
  const isLastPart = material ? partIdx === totalParts - 1 : false;
  const prevPlan = material && partIdx > 0 ? material.plan.partPlans[partIdx - 1] : null;
  const headingTitle = partPlan?.title ?? task?.title ?? "";
  const headingDescription = partPlan?.description;

  return (
    <PageBody>
      <PageContent>
        <ReadingColumn>
          <Card.List>
            <Card.Entry className="flex items-baseline justify-between gap-4">
              <div className="flex flex-col gap-2">
                <Card.Heading>{headingTitle}</Card.Heading>
                {headingDescription && <Card.SubHeading>{headingDescription}</Card.SubHeading>}
              </div>
              {material && (
                <span className="shrink-0 font-mono text-[11px] tracking-[0.04em] text-foreground/40 tabular-nums">
                  <Trans>
                    Part {partIdx + 1} of {totalParts}
                  </Trans>
                </span>
              )}
            </Card.Entry>

            {!part && (
              <Card.Entry className="flex flex-row items-center gap-2 text-foreground/40">
                <Spinner />
                <p className="text-sm">
                  <Trans>Preparing your study material…</Trans>
                </p>
              </Card.Entry>
            )}

            {!part && partStream && (
              <Card.Entry>
                <Markdown isAnimating>{partStream}</Markdown>
              </Card.Entry>
            )}

            {part && (
              <Card.Entry>
                <Markdown>{part.study}</Markdown>
              </Card.Entry>
            )}
          </Card.List>
        </ReadingColumn>
      </PageContent>

      {material && (
        <TopicActionBar>
          <Button
            variant="outline"
            disabled={!prevPlan || !material.parts[partIdx - 1]}
            onClick={() => handleGoToPart(partIdx - 1)}
          >
            <ArrowLeftIcon /> <Trans>Previous</Trans>
          </Button>

          {isLastPart ? (
            <Button className="ml-auto" disabled={!part} onClick={handleMoveToHandsOn}>
              <Trans>Practice</Trans> <ArrowRightIcon />
            </Button>
          ) : (
            <Button className="ml-auto" disabled={!part} onClick={handleNextPart}>
              <Trans>Next</Trans> <ArrowRightIcon />
            </Button>
          )}
        </TopicActionBar>
      )}
    </PageBody>
  );
}
