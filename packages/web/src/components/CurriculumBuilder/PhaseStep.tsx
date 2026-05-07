import { Trans } from "@lingui/react/macro";
import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import type { OutlinePhase, Phase, Task } from "../../data/types";
import { Card } from "../Card";
import { BuilderActionBar } from "./BuilderActionBar";
import { SelectableCard } from "./SelectableCard";

import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";

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
  //   onStartOver,
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

  if (!outlinePhase) return null;

  return (
    <div className="mt-6 flex flex-col gap-4">
      <Card>
        <h2 className="text-2xl font-semibold text-foreground mb-1">{outlinePhase.title}</h2>
        <p className="text-sm text-muted-foreground">{outlinePhase.subtitle}</p>
        <p className="text-xs text-muted-foreground mt-4">
          <Trans>
            Phase {currentPageIndex + 1} of {total}
          </Trans>
        </p>
      </Card>

      {isGeneratingThis && !generatedPhase && (
        <Card>
          <div className="flex items-center gap-2 mb-4 text-foreground/40">
            <Spinner />
            <p className="text-sm">
              <Trans>Generating phase...</Trans>
            </p>
          </div>
          <TaskList tasks={streamedTasks} readOnly />
        </Card>
      )}

      {generatedPhase && (
        <TaskList
          tasks={generatedPhase.tasks}
          isSelected={(task) => !deselectedTaskIds.has(task.id)}
          onToggle={onToggleTask}
        />
      )}

      <BuilderActionBar>
        <Button
          variant="outline"
          disabled={isFirst || isGenerating}
          onClick={() => onNavigateTo(currentPageIndex - 1, generatedPhases)}
        >
          <ArrowLeftIcon /> <Trans>Previous</Trans>
        </Button>

        {isLast && allSelectedDone ? (
          <Button className="ml-auto" disabled={isGenerating} onClick={onSave}>
            <Trans>Save program</Trans> <ArrowRightIcon />
          </Button>
        ) : (
          <Button
            className="ml-auto"
            disabled={isLast || isGenerating}
            onClick={() => onNavigateTo(currentPageIndex + 1, generatedPhases)}
          >
            <Trans>Next</Trans> <ArrowRightIcon />
          </Button>
        )}
      </BuilderActionBar>
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
