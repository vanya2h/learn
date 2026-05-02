import { LayerCard } from "@cloudflare/kumo/components/layer-card";
import { Meter } from "@cloudflare/kumo/components/meter";
import { Text } from "@cloudflare/kumo/components/text";
import { useLingui } from "@lingui/react/macro";
import { useState } from "react";
import type { Phase, Task } from "../data/curriculum";
import { useProgress } from "../hooks/useProgress";
import { TaskRow } from "./TaskRow";

type Props = { phase: Phase; curriculumId: string };

function phaseProgress(tasks: Task[], completedTaskIds: Record<string, string>) {
  const total = tasks.reduce((s, t) => s + (t.estMinutes ?? 60), 0);
  if (total === 0) return 0;
  const done = tasks.filter((t) => completedTaskIds[t.id]).reduce((s, t) => s + (t.estMinutes ?? 60), 0);
  return Math.round((done / total) * 100);
}

export function PhaseCard({ phase, curriculumId }: Props) {
  const [open, setOpen] = useState(true);
  const { completedTaskIds } = useProgress();
  const { t } = useLingui();

  const pct = phaseProgress(phase.tasks, completedTaskIds);

  return (
    <LayerCard className="overflow-hidden">
      <LayerCard.Secondary>
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors cursor-pointer"
          aria-expanded={open}
        >
          <div className="flex-1 min-w-0">
            <Text variant="heading3">{phase.title}</Text>
            <div className="mt-1">
              <Text variant="secondary" size="xs">
                {phase.subtitle}
              </Text>
            </div>
          </div>
          <div className="flex items-center gap-3 ml-4">
            <div className="w-52">
              <Meter value={pct} label={t`Progress`} showValue />
            </div>
            <span className="text-foreground/40 text-xs">{open ? "▲" : "▼"}</span>
          </div>
        </button>
      </LayerCard.Secondary>

      {open && (
        <LayerCard.Primary>
          <div className="px-4 pb-3">
            {phase.tasks.map((task) => (
              <TaskRow key={task.id} task={task} curriculumId={curriculumId} />
            ))}
          </div>
        </LayerCard.Primary>
      )}
    </LayerCard>
  );
}
