import { Trans } from "@lingui/react/macro";
import type { ReactNode } from "react";
import type { BuilderStep } from "./useCurriculumBuilder";

import { cn } from "~/lib/utils";

type BuilderSidebarProps = {
  step: BuilderStep;
};

type Stage = {
  key: string;
  label: ReactNode;
};

export function BuilderSidebar({ step }: BuilderSidebarProps) {
  const currentIndex = stageIndex(step);
  const stages: Stage[] = [
    { key: "input", label: <Trans>Job posting</Trans> },
    { key: "outline", label: <Trans>Outline</Trans> },
    { key: "phases", label: <Trans>Phases</Trans> },
    { key: "save", label: <Trans>Save</Trans> },
  ];

  return (
    <nav aria-label="Program creation steps" className="w-50 shrink-0 self-stretch py-8 bg-background">
      <ol className="flex flex-col">
        {stages.map((stage, i) => (
          <StageRow key={stage.key} index={i} label={stage.label} state={stageState(i, currentIndex)} />
        ))}
      </ol>
    </nav>
  );
}

type StageState = "active" | "done" | "upcoming";

function StageRow({ index, label, state }: { index: number; label: ReactNode; state: StageState }) {
  const isActive = state === "active";
  const isDone = state === "done";

  return (
    <li>
      <div aria-current={isActive ? "step" : undefined} className="flex items-center gap-4 h-12 pr-4">
        <span
          aria-hidden
          className={cn(
            "shrink-0 transition-all",
            isActive ? "w-6 h-0.5 bg-foreground" : isDone ? "w-3 h-px bg-foreground/40" : "w-3 h-px bg-foreground/20",
          )}
        />
        <span className="flex items-baseline gap-2.5">
          <span
            className={cn(
              "font-mono text-[10px] uppercase tracking-[0.14em]",
              isActive ? "text-foreground" : "text-foreground/30",
            )}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <span
            className={cn(
              "text-[13px] tracking-tight",
              isActive ? "font-semibold text-foreground" : isDone ? "text-foreground/60" : "text-foreground/30",
            )}
          >
            {label}
          </span>
        </span>
      </div>
    </li>
  );
}

function stageState(index: number, current: number): StageState {
  if (index === current) return "active";
  if (index < current) return "done";
  return "upcoming";
}

function stageIndex(step: BuilderStep): number {
  switch (step) {
    case "idle":
    case "extracting":
      return 0;
    case "generating-outline":
    case "outline-review":
      return 1;
    case "phase-view":
      return 2;
    case "saving":
      return 3;
    default: {
      const _exhaustive: never = step;
      return _exhaustive;
    }
  }
}
