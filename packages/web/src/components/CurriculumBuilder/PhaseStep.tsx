import { Trans } from "@lingui/react/macro";
import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import type { OutlinePhase, Phase, Task } from "../../data/types";
import { SelectableCard } from "./SelectableCard";

import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { cn } from "~/lib/utils";

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
      <div className="flex justify-between items-center gap-4 mb-2">
        <p className="text-xs text-muted-foreground">
          <Trans>
            Phase {currentPageIndex + 1} of {total}
          </Trans>
        </p>
        <div className="shrink-0">
          <Button size="sm" type="button" onClick={onStartOver} disabled={isGenerating}>
            <Trans>← Start over</Trans>
          </Button>
        </div>
      </div>

      <h2 className="text-2xl font-semibold text-foreground mb-1">{outlinePhase.title}</h2>
      <p className="text-sm text-muted-foreground mb-6">{outlinePhase.subtitle}</p>

      {isGeneratingThis && !generatedPhase && (
        <>
          <div className="flex items-center gap-2 mb-4 text-foreground/40">
            <Spinner />
            <p className="text-sm">
              <Trans>Generating phase...</Trans>
            </p>
          </div>
          <TaskList tasks={streamedTasks} readOnly />
        </>
      )}

      {generatedPhase && (
        <>
          <p className="text-xs text-muted-foreground mb-3">
            <Trans>Click any task to deselect it and exclude it from the program.</Trans>
          </p>
          <TaskList
            tasks={generatedPhase.tasks}
            isSelected={(task) => !deselectedTaskIds.has(task.id)}
            onToggle={onToggleTask}
          />
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

type TaskListProps =
  | { tasks: Task[]; readOnly: true; isSelected?: never; onToggle?: never }
  | { tasks: Task[]; readOnly?: false; isSelected: (task: Task) => boolean; onToggle: (taskId: string) => void };

function TaskList({ tasks, readOnly, isSelected, onToggle }: TaskListProps) {
  if (!tasks.length) return null;
  return (
    <div className="mb-6 flex flex-col gap-2">
      {tasks.map((task) => (
        <SelectableCard
          key={task.id}
          selected={readOnly ? true : isSelected(task)}
          readOnly={readOnly}
          onToggle={readOnly ? undefined : () => onToggle(task.id)}
          title={<TaskTitle task={task} />}
        />
      ))}
    </div>
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

type NavButtonProps = React.ComponentProps<"button"> & { align?: "left" | "right" };

function NavButton({ align = "left", className, children, ...rest }: NavButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        "flex flex-col gap-1 p-4 rounded-xl border border-border bg-background-layer hover:bg-background-active hover:border-border-hover transition-colors cursor-pointer overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed",
        align === "right" ? "items-end text-right" : "text-left",
        className,
      )}
    >
      {children}
    </button>
  );
}
