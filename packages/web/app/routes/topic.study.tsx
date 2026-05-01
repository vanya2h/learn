import { Loader } from "@cloudflare/kumo/components/loader";
import { Text } from "@cloudflare/kumo/components/text";
import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { useLoaderData, useNavigate, useParams, useRouteLoaderData } from "react-router";
import { Markdown } from "../../src/components/Markdown";
import { useTopicSession } from "../../src/hooks/useTopicSession";
import { useClaude } from "../../src/lib/claude";
import type { Material, PhaseByKey } from "../../src/lib/phase";
import { parsePart, parsePersistedPhase, parsePlan, PART_SYSTEM, PLAN_SYSTEM } from "../../src/lib/phase";
import { db } from "../../src/server/db";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/topic.study";
import type { loader as layoutLoader } from "./topic-layout";

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

  const [material, setMaterial] = useState<Material | null>(loaderData.name === "study" ? loaderData.material : null);
  const [partIdx, setPartIdx] = useState(loaderData.name === "study" ? loaderData.partIdx : 0);
  const [planStream, setPlanStream] = useState("");
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

    const userMsg = assessmentContext
      ? `Plan a study session for: "${task.title}"\nCurriculum: ${curriculumName}\n\nAssessment context: ${assessmentContext}`
      : `Plan a study session for: "${task.title}"\nCurriculum: ${curriculumName}`;

    try {
      const text = await streamAI(
        PLAN_SYSTEM,
        userMsg,
        (acc) => {
          if (!ctrl.signal.aborted) setPlanStream(acc);
        },
        TOKENS_PLAN,
        ctrl.signal,
      );
      if (ctrl.signal.aborted) return;

      const plan = parsePlan(text);
      setPlanStream("");

      const newMaterial: Material = {
        plan,
        parts: Array<null>(plan.partPlans.length).fill(null),
        assessmentContext,
      };

      setMaterial(newMaterial);
      setPartIdx(0);
      void saveSession({ name: "study", material: newMaterial, partIdx: 0 });
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

  // Still generating the plan
  if (!material) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader size="sm" />
        <p className="text-sm text-muted-foreground">Building your study plan…</p>
        {planStream && (
          <p className="text-xs text-foreground/40 max-w-sm text-center italic">{planStream.slice(0, 120)}</p>
        )}
      </div>
    );
  }

  const { plan, parts } = material;
  const partPlan = plan.partPlans[partIdx];
  const part = parts[partIdx];
  const isLastPart = partIdx === plan.partPlans.length - 1;
  const prevPlan = partIdx > 0 ? plan.partPlans[partIdx - 1] : null;
  const nextPlan = !isLastPart ? plan.partPlans[partIdx + 1] : null;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div>
        <p className="text-xs text-muted-foreground mb-2">
          Part {partIdx + 1} of {plan.partPlans.length}
        </p>
      </div>

      <div className="mb-6">
        <Text variant="heading2" as="h2">
          {partPlan?.title ?? ""}
        </Text>
      </div>

      {!part && (
        <>
          <div className="flex items-center gap-2 mb-6 text-foreground/40">
            <Loader size="sm" />
            <p className="text-sm">Preparing study material…</p>
          </div>
          {partStream && <Markdown isAnimating>{partStream}</Markdown>}
        </>
      )}

      {part && (
        <>
          <Markdown>{part.study}</Markdown>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {prevPlan && parts[partIdx - 1] ? (
              <NavButton onClick={() => handleGoToPart(partIdx - 1)}>
                <span className="text-xs text-muted-foreground">
                  <ArrowLeftIcon className="inline" /> previous
                </span>
                <span className="text-sm font-medium text-foreground">{prevPlan.title}</span>
              </NavButton>
            ) : (
              <div />
            )}

            {isLastPart ? (
              <NavButton onClick={handleMoveToHandsOn} align="right">
                <span className="text-xs text-muted-foreground">next</span>
                <span className="text-sm font-medium text-foreground">Practice</span>
              </NavButton>
            ) : (
              <NavButton onClick={handleNextPart} align="right">
                <span className="text-xs text-muted-foreground">
                  next <ArrowRightIcon className="inline" />
                </span>
                <span className="text-sm font-medium text-foreground">{nextPlan?.title}</span>
              </NavButton>
            )}
          </div>
        </>
      )}
    </div>
  );
}

type NavButtonProps = React.ComponentProps<"button"> & { align?: "left" | "right" };

function NavButton({ align = "left", className, children, ...rest }: NavButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={clsx(
        "flex flex-col gap-1 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors cursor-pointer overflow-hidden",
        align === "right" ? "items-end text-right" : "text-left",
        className,
      )}
    >
      {children}
    </button>
  );
}
