import type { ReactNode } from "react";
import { Link } from "react-router";

import { cn } from "~/lib/utils";

export type StageNavStageState = "active" | "done" | "upcoming";

export type StageNavStage = {
  key: string;
  label: ReactNode;
  state: StageNavStageState;
  href?: string;
};

export type StageNavProps = React.ComponentProps<"nav"> & {
  stages: StageNavStage[];
};

export function StageNav({ stages, className, ...restProps }: StageNavProps) {
  return (
    <nav {...restProps} className={cn("w-64 shrink-0 self-stretch py-8 bg-background", className)}>
      <ol className="flex flex-col">
        {stages.map((stage, i) => (
          <StageRow key={stage.key} index={i} label={stage.label} state={stage.state} href={stage.href} />
        ))}
      </ol>
    </nav>
  );
}

type StageRowProps = {
  index: number;
  label: ReactNode;
  state: StageNavStageState;
  href?: string;
};

function StageRow({ index, label, state, href }: StageRowProps) {
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
        "tracking-tight",
        isActive ? "font-semibold text-foreground" : isDone ? "text-foreground/60" : "text-foreground/30",
      )}
    >
      {label}
    </span>
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

  if (href === undefined) {
    return (
      <li>
        <div aria-current={isActive ? "step" : undefined} className="flex items-center gap-4 h-12 pr-4">
          {inner}
        </div>
      </li>
    );
  }

  const interactiveClassName = cn(
    "flex items-center gap-4 h-12 pr-4 transition-colors",
    isUpcoming ? "cursor-not-allowed select-none" : "cursor-pointer hover:text-foreground",
  );

  if (isUpcoming) {
    return (
      <li>
        <button type="button" disabled className={interactiveClassName}>
          {inner}
        </button>
      </li>
    );
  }

  return (
    <li>
      <Link to={href} className={interactiveClassName} aria-current={isActive ? "step" : undefined}>
        {inner}
      </Link>
    </li>
  );
}
