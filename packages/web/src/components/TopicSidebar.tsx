import { Trans } from "@lingui/react/macro";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";

import { cn } from "~/lib/utils";

type Props = {
  highestStage: number;
  taskCompleted: boolean;
};

type Stage = {
  path: string;
  label: ReactNode;
};

export function TopicSidebar({ highestStage, taskCompleted }: Props) {
  const { pathname } = useLocation();
  const lastSegment = pathname.split("/").filter(Boolean).pop() ?? "";
  const stages: Stage[] = [
    { path: "choice", label: <Trans>Choice</Trans> },
    { path: "assess", label: <Trans>Assess</Trans> },
    { path: "gaps", label: <Trans>Gaps</Trans> },
    { path: "study", label: <Trans>Study</Trans> },
    { path: "hands-on", label: <Trans>Practice</Trans> },
    { path: "feedback", label: <Trans>Feedback</Trans> },
    { path: "write-up", label: <Trans>Write-up</Trans> },
    { path: "complete", label: <Trans>Complete</Trans> },
  ];
  const reached = taskCompleted ? stages.length - 1 : highestStage;
  const activeIndex = stages.findIndex((s) => s.path === lastSegment);

  return (
    <nav aria-label="Topic stages" className="w-50 shrink-0 self-stretch py-8 bg-background flex flex-col">
      <ol className="flex flex-col">
        {stages.map((stage, i) => (
          <StageRow
            key={stage.path}
            index={i}
            label={stage.label}
            to={stage.path}
            state={stageStateFor(i, activeIndex, reached)}
          />
        ))}
      </ol>
    </nav>
  );
}

type StageState = "active" | "done" | "upcoming";

function StageRow({ index, label, to, state }: { index: number; label: ReactNode; to: string; state: StageState }) {
  const isActive = state === "active";
  const isDone = state === "done";
  const isUpcoming = state === "upcoming";

  const tick = (
    <span
      aria-hidden
      className={cn(
        "shrink-0 transition-all",
        isActive ? "w-6 h-0.5 bg-foreground" : isDone ? "w-3 h-px bg-foreground/40" : "w-3 h-px bg-foreground/20",
      )}
    />
  );
  const number = (
    <span
      className={cn(
        "font-mono text-[10px] uppercase tracking-[0.14em]",
        isActive ? "text-foreground" : "text-foreground/30",
      )}
    >
      {String(index + 1).padStart(2, "0")}
    </span>
  );
  const text = (
    <span
      className={cn(
        "text-[13px] tracking-tight",
        isActive ? "font-semibold text-foreground" : isDone ? "text-foreground/60" : "text-foreground/30",
      )}
    >
      {label}
    </span>
  );

  const rowClassName = cn(
    "flex items-center gap-4 h-12 pr-4 transition-colors",
    isUpcoming ? "cursor-not-allowed select-none" : "cursor-pointer hover:text-foreground",
  );

  const inner = (
    <>
      {tick}
      <span className="flex items-baseline gap-2.5">
        {number}
        {text}
      </span>
    </>
  );

  return (
    <li>
      {isUpcoming ? (
        <button type="button" disabled className={rowClassName} aria-current={undefined}>
          {inner}
        </button>
      ) : (
        <Link to={to} className={rowClassName} aria-current={isActive ? "step" : undefined}>
          {inner}
        </Link>
      )}
    </li>
  );
}

function stageStateFor(index: number, activeIndex: number, reached: number): StageState {
  if (index === activeIndex) return "active";
  if (index > reached) return "upcoming";
  return "done";
}
