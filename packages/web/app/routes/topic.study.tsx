import { Trans } from "@lingui/react/macro";
import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useLoaderData, useNavigate, useParams, useRouteLoaderData } from "react-router";
import { Markdown } from "../../src/components/Markdown";
import { TopicActionBar } from "../../src/components/TopicActionBar";
import { TopicContainer } from "../../src/components/TopicContainer";
import { useTopicSession } from "../../src/hooks/useTopicSession";
import { useClaude } from "../../src/lib/claude";
import type { Material, PhaseByKey } from "../../src/lib/phase";
import { parsePart, parsePersistedPhase, parsePlan, PART_SYSTEM, PLAN_SYSTEM } from "../../src/lib/phase";
import { db } from "../../src/server/db";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/topic.study";
import type { loader as layoutLoader } from "./topic-layout";

import { LoadingState } from "~/components/LoadingState";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";

const TOKENS_PLAN = 600;
const TOKENS_PART = 3000;

type LoaderResult = PhaseByKey<"study"> | PhaseByKey<"gaps-review"> | { name: null };

export async function loader({ request, params }: Route.LoaderArgs): Promise<LoaderResult> {
  const session = await requireSession(request);
  const record = await db.topicSession.findUnique({
    where: { userId_taskId: { userId: session.user.id, taskId: params.taskId } },
  });
  const phase = parsePersistedPhase(record?.phaseData);

  if (phase?.name === "study") return phase;
  if (phase?.name === "gaps-review") return phase;
  return { name: null };
}

export default function StudyPage() {
  const loaderData = useLoaderData<typeof loader>();
  const layoutData = useRouteLoaderData<typeof layoutLoader>("routes/topic-layout");
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { streamAI } = useClaude();
  const { saveSession } = useTopicSession(taskId!);
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

  async function loadPart(idx: number, mat: Material, ctrl: AbortController) {
    const partPlan = mat.plan.partPlans[idx];
    if (!partPlan) return;

    const otherParts = mat.plan.partPlans.map((p, i) => `${i + 1}. ${p.title}: ${p.description}`).join("\n");

    const userMsg = [
      `Topic: "${task?.title}"`,
      `Curriculum: ${curriculumName}`,
      complexity ? `Complexity: ${complexity}` : null,
      mat.assessmentContext ? `Assessment context: ${mat.assessmentContext}` : null,
      ``,
      `Generate part ${idx + 1} of ${mat.plan.partPlans.length}: "${partPlan.title}"`,
      `Scope: ${partPlan.description}`,
      ``,
      `Full session outline:`,
      otherParts,
    ]
      .filter((l) => l !== null)
      .join("\n");

    try {
      const text = await streamAI(
        PART_SYSTEM,
        userMsg,
        (acc) => {
          if (!ctrl.signal.aborted) {
            try {
              setPartStream(parsePart(acc).study);
            } catch {
              // partial stream not yet parseable
            }
          }
        },
        TOKENS_PART,
        ctrl.signal,
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

    const complexityLine = complexity ? `\nComplexity: ${complexity}` : "";
    const userMsg = assessmentContext
      ? `Plan a study session for: "${task.title}"\nCurriculum: ${curriculumName}${complexityLine}\n\nAssessment context: ${assessmentContext}`
      : `Plan a study session for: "${task.title}"\nCurriculum: ${curriculumName}${complexityLine}`;

    try {
      const text = await streamAI(PLAN_SYSTEM, userMsg, () => {}, TOKENS_PLAN, ctrl.signal);
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

  if (!material) {
    return (
      <LoadingState>
        <Trans>Preparing your study material…</Trans>
      </LoadingState>
    );
  }

  const { plan, parts } = material;
  const partPlan = plan.partPlans[partIdx];
  const part = parts[partIdx];
  const isLastPart = partIdx === plan.partPlans.length - 1;
  const prevPlan = partIdx > 0 ? plan.partPlans[partIdx - 1] : null;

  return (
    <>
      <TopicContainer className="py-8">
        <p className="text-xs text-muted-foreground mb-2">
          <Trans>
            Part {partIdx + 1} of {plan.partPlans.length}
          </Trans>
        </p>

        <h2 className="text-2xl font-semibold text-foreground mb-6">{partPlan?.title ?? ""}</h2>

        {!part && (
          <>
            <div className="flex items-center gap-2 mb-6 text-foreground/40">
              <Spinner />
              <p className="text-sm">
                <Trans>Preparing study material…</Trans>
              </p>
            </div>
            {partStream && <Markdown isAnimating>{partStream}</Markdown>}
          </>
        )}

        {part && <Markdown>{part.study}</Markdown>}
      </TopicContainer>

      <TopicActionBar>
        <Button
          variant="outline"
          disabled={!prevPlan || !parts[partIdx - 1]}
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
    </>
  );
}
