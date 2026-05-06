import { useLingui } from "@lingui/react/macro";
import { CaretDownIcon } from "@phosphor-icons/react";
import { useState } from "react";
import type { Phase, Task } from "../data/curriculum";
import { useProgress } from "../hooks/useProgress";
import { TaskRow } from "./TaskRow";

import { Progress, ProgressLabel, ProgressValue } from "~/components/ui/progress";
import { cn } from "~/lib/utils";

type Props = { phase: Phase; curriculumId: string; index: number };

function phaseProgress(tasks: Task[], completedTaskIds: Record<string, string>) {
  const total = tasks.reduce((s, t) => s + (t.estMinutes ?? 60), 0);
  if (total === 0) return 0;
  const done = tasks.filter((t) => completedTaskIds[t.id]).reduce((s, t) => s + (t.estMinutes ?? 60), 0);
  return Math.round((done / total) * 100);
}

export function PhaseCard({ phase, curriculumId, index }: Props) {
  const [open, setOpen] = useState(true);
  const { completedTaskIds } = useProgress();
  const { t } = useLingui();

  const pct = phaseProgress(phase.tasks, completedTaskIds);

  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen((o) => !o)}
        className="group w-full flex items-center justify-between gap-6 px-6 py-6 text-left transition-colors cursor-pointer bg-background-layer/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground/30"
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-2xl font-semibold text-foreground leading-tight">
            <span className="text-foreground/50">{formatIndex(++index)}</span>. {phase.title}
          </h3>
          <p className="mt-1.5 text-base text-muted-foreground leading-relaxed line-clamp-1">{phase.subtitle}</p>
        </div>
        <div className="flex items-center gap-5 shrink-0">
          <div className="hidden sm:block w-52">
            <Progress value={pct}>
              <ProgressLabel>{t`Progress`}</ProgressLabel>
              <ProgressValue />
            </Progress>
          </div>
          <span
            className={cn("text-foreground/40 transition-transform duration-300", open && "rotate-180")}
            aria-hidden
          >
            <CaretDownIcon size={18} weight="bold" />
          </span>
        </div>
      </button>
      {open && (
        <div className="border-t border-border px-6 pt-2 pb-4">
          {phase.tasks.map((task) => (
            <TaskRow key={task.id} task={task} curriculumId={curriculumId} />
          ))}
        </div>
      )}
    </div>
  );
}

function formatIndex(index: number) {
  return index < 10 ? `0${index}` : `${index}`;
}
