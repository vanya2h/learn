import { type MouseEvent, useState } from "react";
import type { Phase, Task } from "../data/curriculum";
import { SPECIALIZATION_INFO } from "../data/curriculum";
import { useStore } from "../store";
import { SpecializationPicker } from "./SpecializationPicker";
import { TaskRow } from "./TaskRow";

type Props = { phase: Phase };

function phaseProgress(tasks: Task[], completedTaskIds: Record<string, string>) {
  const total = tasks.reduce((s, t) => s + (t.estMinutes ?? 60), 0);
  if (total === 0) return 0;
  const done = tasks.filter((t) => completedTaskIds[t.id]).reduce((s, t) => s + (t.estMinutes ?? 60), 0);
  return Math.round((done / total) * 100);
}

export function PhaseCard({ phase }: Props) {
  const [open, setOpen] = useState(true);
  const completedTaskIds = useStore((s) => s.completedTaskIds);
  const specialization = useStore((s) => s.specialization);

  const isPhase3 = phase.id === "phase-3";
  const visibleTasks = isPhase3
    ? specialization
      ? phase.tasks.filter((t) => t.branch === specialization)
      : []
    : phase.tasks;

  const pct = phaseProgress(visibleTasks, completedTaskIds);

  function handleChangePath(e: MouseEvent) {
    e.stopPropagation();
    useStore.setState({ specialization: null });
  }

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">{phase.title}</span>
            {isPhase3 && specialization && (
              <span className="text-xs text-green-700 dark:text-green-400 font-medium">
                {SPECIALIZATION_INFO[specialization].label}
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{phase.subtitle}</p>
        </div>
        <div className="flex items-center gap-3 ml-4">
          <div className="w-24">
            <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="text-right text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">{pct}%</div>
          </div>
          <span className="text-neutral-400 text-xs">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-3">
          {isPhase3 && !specialization && <SpecializationPicker />}
          {isPhase3 && specialization && (
            <div className="py-1">
              <button
                className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 underline"
                onClick={handleChangePath}
              >
                change path
              </button>
            </div>
          )}
          {visibleTasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
