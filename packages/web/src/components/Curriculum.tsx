import { Trans, useLingui } from "@lingui/react/macro";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { parseResponse } from "hono/client";
import { Link, useNavigate } from "react-router";
import type { CurriculumDef, Phase, Task } from "../data/types";
import type { ActiveSession } from "../hooks/useProgress";
import { useProgress } from "../hooks/useProgress";
import { apiClient } from "../lib/apiClient";
import { PHASE_ORDER } from "../lib/phase";
import { Card } from "./Card";
import { PhaseCard } from "./PhaseCard";
import { ProgramCover } from "./ProgramCover";
import { Ring } from "./Ring";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export type CurriculumProps = React.ComponentProps<"section"> & {
  curriculum: CurriculumDef;
};

export function Curriculum({ curriculum, className, ...restProps }: CurriculumProps) {
  const { completedTaskIds, activeSessions } = useProgress();

  const totalTasks = curriculum.phases.reduce((acc, phase) => acc + phase.tasks.length, 0);
  const completedTasks = curriculum.phases.reduce(
    (acc, phase) => acc + phase.tasks.filter((task) => completedTaskIds[task.id]).length,
    0,
  );
  const remainingMinutes = curriculum.phases.reduce(
    (acc, phase) =>
      acc + phase.tasks.filter((task) => !completedTaskIds[task.id]).reduce((s, task) => s + (task.estMinutes ?? 0), 0),
    0,
  );
  const completionPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const nextUp = findNextUp(curriculum, completedTaskIds, activeSessions);

  return (
    <section className={cn("relative flex flex-col grow", className)} {...restProps}>
      {curriculum.cover && (
        <div className="absolute inset-0">
          <ProgramCover shape="wave" preset={curriculum.cover} />
        </div>
      )}
      <div className="relative grow flex flex-col py-8">
        <div className="px-6 sm:px-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
          <NextUpCard curriculum={curriculum} nextUp={nextUp} />
          <ProgressRingCard percent={completionPercent} remainingMinutes={remainingMinutes} />
        </div>

        <div className="px-6 sm:px-10 mt-4">
          <Card className="overflow-hidden p-0">
            <h2 className="font-bold px-6 py-4 border-b border-border text-foreground">
              <Trans>All Sections</Trans>
            </h2>
            <div>
              {curriculum.phases.map((phase, index) => (
                <PhaseCard
                  key={phase.id}
                  phase={phase}
                  curriculumId={curriculum.id}
                  index={index}
                  completedTaskIds={completedTaskIds}
                />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

type NextUp = {
  task: Task;
  phase: Phase;
  session: ActiveSession | null;
};

function findNextUp(
  curriculum: CurriculumDef,
  completedTaskIds: Record<string, string>,
  activeSessions: Record<string, ActiveSession>,
): NextUp | null {
  for (const phase of curriculum.phases) {
    for (const task of phase.tasks) {
      const session = activeSessions[task.id];
      if (session && !completedTaskIds[task.id]) {
        return { task, phase, session };
      }
    }
  }
  for (const phase of curriculum.phases) {
    for (const task of phase.tasks) {
      if (!completedTaskIds[task.id]) {
        return { task, phase, session: null };
      }
    }
  }
  return null;
}

function NextUpCard({ curriculum, nextUp }: { curriculum: CurriculumDef; nextUp: NextUp | null }) {
  const navigate = useNavigate();

  if (!nextUp) {
    return (
      <Card>
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-foreground/40">
          <Trans>All done</Trans>
        </div>
        <div className="grow" />
        <h2 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">
          <Trans>You finished every topic</Trans>
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          <Trans>Revisit any section below to review what you learned.</Trans>
        </p>
      </Card>
    );
  }

  const { task, phase, session } = nextUp;
  const taskPercent = session ? phaseProgressPercent(session) : 0;
  const taskUrl = `/topic/${curriculum.id}/${task.id}`;

  async function startOver() {
    await parseResponse(apiClient.api["topic-sessions"][":taskId"].$delete({ param: { taskId: task.id } }));
    navigate(taskUrl);
  }

  return (
    <Card>
      <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-foreground/40">
        <span>
          <Trans>Next up</Trans>
        </span>
        {session && <SessionBadge session={session} />}
      </div>

      <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-foreground leading-tight">{task.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">{task.notes ?? phase.subtitle}</p>
      <div className="grow" />
      <div className="mt-6 flex items-end justify-between gap-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="h-1 rounded-full bg-foreground/10 overflow-hidden">
            <div className="h-full bg-brand transition-[width] duration-500" style={{ width: `${taskPercent}%` }} />
          </div>
          <div className="mt-3 flex items-center gap-2 font-mono text-[11px] tracking-[0.04em] text-foreground/50">
            <span className="text-foreground">{taskPercent}%</span>
            <span>·</span>
            <span className="truncate">{phase.title}</span>
            {task.estMinutes && (
              <>
                <span>·</span>
                <span>~{formatDuration(task.estMinutes)}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {session && (
            <Button size="lg" type="button" onClick={startOver} variant="secondary">
              <Trans>Start over</Trans>
            </Button>
          )}
          <Button size="lg" render={<Link to={taskUrl} />}>
            {session ? <Trans>Continue</Trans> : <Trans>Start</Trans>}
            <ArrowRightIcon weight="bold" data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function SessionBadge({ session }: { session: ActiveSession }) {
  const label = useSessionLabel(session);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 bg-brand/15 text-brand text-[11px] font-medium normal-case tracking-normal">
      <span className="size-1.5 rounded-full bg-brand" aria-hidden />
      {label}
    </span>
  );
}

function useSessionLabel(session: ActiveSession): string {
  const { t } = useLingui();
  const part = (session.partIdx ?? 0) + 1;
  switch (session.name) {
    case "assessing":
      return t`Assessing`;
    case "gaps-review":
      return t`Reviewing gaps`;
    case "study":
      return t`Part ${part} · Study`;
    case "hands-on":
      return t`Part ${part} · Practice`;
    case "feedback":
      return t`Part ${part} · Feedback`;
    case "write-up":
      return t`Part ${part} · Write-up`;
    default: {
      const _exhaustive: never = session.name;
      return _exhaustive;
    }
  }
}

function phaseProgressPercent(session: ActiveSession) {
  const idx = PHASE_ORDER.indexOf(session.name);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / PHASE_ORDER.length) * 100);
}

function ProgressRingCard({ percent, remainingMinutes }: { percent: number; remainingMinutes: number }) {
  return (
    <Card className="flex flex-col items-center justify-center text-center">
      <Ring percent={percent} size={148} stroke={8}>
        <span className="text-3xl font-semibold tracking-[-0.03em] text-foreground">{percent}%</span>
      </Ring>
      <div className="text-foreground mt-4">
        <Trans>Program Completed</Trans>
      </div>
      {remainingMinutes > 0 && (
        <div className="text-sm text-foreground/40">
          ~{formatHours(remainingMinutes)} <Trans>remaining</Trans>
        </div>
      )}
    </Card>
  );
}

function formatDuration(minutes: number) {
  if (minutes >= 60) {
    const hours = minutes / 60;
    return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
  }
  return `${minutes}m`;
}

function formatHours(minutes: number) {
  if (minutes <= 0) return "0h";
  if (minutes < 60) return `${minutes}m`;
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
}
