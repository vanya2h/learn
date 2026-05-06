import { Trans } from "@lingui/react/macro";
import type { ReactNode } from "react";
import { useLocation } from "react-router";
import { StageNav, type StageNavStage } from "./StageNav";

import { cn } from "~/lib/utils";

export type TopicSidebarProps = Omit<React.ComponentProps<typeof StageNav>, "stages"> & {
  highestStage: number;
  taskCompleted: boolean;
};

export function TopicSidebar({ highestStage, taskCompleted, className, ...restProps }: TopicSidebarProps) {
  const { pathname } = useLocation();
  const lastSegment = pathname.split("/").filter(Boolean).pop() ?? "";
  const items: { path: string; label: ReactNode }[] = [
    { path: "choice", label: <Trans>Choice</Trans> },
    { path: "assess", label: <Trans>Assess</Trans> },
    { path: "gaps", label: <Trans>Gaps</Trans> },
    { path: "study", label: <Trans>Study</Trans> },
    { path: "hands-on", label: <Trans>Practice</Trans> },
    { path: "feedback", label: <Trans>Feedback</Trans> },
    { path: "write-up", label: <Trans>Write-up</Trans> },
    { path: "complete", label: <Trans>Complete</Trans> },
  ];
  const reached = taskCompleted ? items.length - 1 : highestStage;
  const activeIndex = items.findIndex((s) => s.path === lastSegment);

  const stages: StageNavStage[] = items.map((item, i) => ({
    key: item.path,
    label: item.label,
    href: item.path,
    state: i === activeIndex ? "active" : i > reached ? "upcoming" : "done",
  }));

  return (
    <StageNav
      aria-label="Topic stages"
      stages={stages}
      className={cn("self-start sticky top-15.25", className)}
      {...restProps}
    />
  );
}
