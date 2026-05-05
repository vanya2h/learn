import { Trans } from "@lingui/react/macro";
import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import clsx from "clsx";
import type { OutlinePhase, Phase, Task } from "../../data/types";
import { DotLoader } from "../Spinner";
import { Button } from "../ui/Button";
import { BuilderTaskRow } from "./BuilderTaskRow";

export function PhaseStep({
  selectedPhases,
  currentPageIndex,
  generatedPhases,
  generatingPhaseId,
  streamedTasks,
  deselectedTaskIds,
  onToggleTask,
  onNavigateTo,
  onSave,
  onStartOver,
}: {
  selectedPhases: OutlinePhase[];
  currentPageIndex: number;
  generatedPhases: Record<string, Phase>;
  generatingPhaseId: string | null;
  streamedTasks: Task[];
  deselectedTaskIds: Set<string>;
  onToggleTask: (taskId: string) => void;
  onNavigateTo: (index: number, currentGenerated: Record<string, Phase>) => void;
  onSave: () => void;
  onStartOver: () => void;
}) {
  const total = selectedPhases.length;
  const outlinePhase = selectedPhases[currentPageIndex];
  const phaseId = outlinePhase?.id;
  const generatedPhase = phaseId ? generatedPhases[phaseId] : undefined;
  const isGeneratingThis = generatingPhaseId === phaseId;
  const isGenerating = generatingPhaseId !== null;
  const isFirst = currentPageIndex === 0;
  const isLast = currentPageIndex === total - 1;
  const allSelectedDone = selectedPhases.every((p) => generatedPhases[p.id]);
  const prevPhase = !isFirst ? selectedPhases[currentPageIndex - 1] : null;
  const nextPhase = !isLast ? selectedPhases[currentPageIndex + 1] : null;

  if (!outlinePhase) return null;

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-2">
        <p className="text-xs text-muted-foreground">
          <Trans>
            Phase {currentPageIndex + 1} of {total}
          </Trans>
        </p>
        <Button size="sm" type="button" onClick={onStartOver} disabled={isGenerating}>
          <Trans>← Start over</Trans>
        </Button>
      </div>

      <h2 className="text-2xl font-semibold text-foreground mb-1">{outlinePhase.title}</h2>
      <p className="text-sm text-muted-foreground mb-6">{outlinePhase.subtitle}</p>

      {isGeneratingThis && !generatedPhase && (
        <>
          <div className="flex items-center gap-2 mb-4 text-foreground/40">
            <DotLoader />
            <p className="text-sm">
              <Trans>Generating phase...</Trans>
            </p>
          </div>
          <PartialTaskList tasks={streamedTasks} />
        </>
      )}

      {generatedPhase && (
        <>
          <p className="text-xs text-muted-foreground mb-3">
            <Trans>Click any task to deselect it and exclude it from the program.</Trans>
          </p>
          <div className="mb-6 flex flex-col">
            {generatedPhase.tasks.map((task) => (
              <BuilderTaskRow
                key={task.id}
                task={task}
                included={!deselectedTaskIds.has(task.id)}
                onToggle={() => onToggleTask(task.id)}
              />
            ))}
          </div>
        </>
      )}

      <div className="mt-8 grid grid-cols-2 gap-3">
        {prevPhase ? (
          <NavButton onClick={() => onNavigateTo(currentPageIndex - 1, generatedPhases)} disabled={isGenerating}>
            <span className="text-xs text-muted-foreground">
              <ArrowLeftIcon className="inline" /> <Trans>previous</Trans>
            </span>
            <span className="text-sm font-medium text-foreground">{prevPhase.title}</span>
          </NavButton>
        ) : (
          <div />
        )}

        {isLast && allSelectedDone ? (
          <NavButton onClick={onSave} disabled={isGenerating} align="right">
            <span className="text-xs text-muted-foreground">
              <Trans>done</Trans>
            </span>
            <span className="text-sm font-medium text-foreground">
              <Trans>Save program</Trans>
            </span>
          </NavButton>
        ) : nextPhase ? (
          <NavButton
            onClick={() => onNavigateTo(currentPageIndex + 1, generatedPhases)}
            disabled={isGenerating}
            align="right"
          >
            <span className="text-xs text-muted-foreground">
              <Trans>next</Trans> <ArrowRightIcon className="inline" />
            </span>
            <span className="text-sm font-medium text-foreground">{nextPhase.title}</span>
          </NavButton>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}

function PartialTaskList({ tasks }: { tasks: Task[] }) {
  if (!tasks.length) return null;
  return (
    <div className="flex flex-col">
      {tasks.map((task) => (
        <BuilderTaskRow key={task.id} task={task} included readOnly />
      ))}
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
        "flex flex-col gap-1 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors cursor-pointer overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed",
        align === "right" ? "items-end text-right" : "text-left",
        className,
      )}
    >
      {children}
    </button>
  );
}
