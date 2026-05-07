import { Trans } from "@lingui/react/macro";
import type { ReactNode } from "react";
import { useLocation, useParams } from "react-router";
import { StageNav, type StageNavStage } from "../StageNav";

import { getCurriculumLinks, type IDraftLinks } from "~/lib/routes";
import { cn } from "~/lib/utils";

export type DraftStep = "outline" | "phases" | "finish";

export type BuilderSidebarProps = Omit<React.ComponentProps<typeof StageNav>, "stages"> & {
  reachedStep: DraftStep;
  firstPhaseId?: string;
};

const STEPS: { key: DraftStep; label: ReactNode }[] = [
  { key: "outline", label: <Trans>Outline</Trans> },
  { key: "phases", label: <Trans>Phases</Trans> },
  { key: "finish", label: <Trans>Finish</Trans> },
];

const STEP_INDEX: Record<DraftStep, number> = { outline: 0, phases: 1, finish: 2 };
const STEP_KEYS = STEPS.map((s) => s.key);

export function BuilderSidebar({ reachedStep, firstPhaseId, className, ...restProps }: BuilderSidebarProps) {
  const { pathname } = useLocation();
  const { id } = useParams<{ id: string }>();
  const draftLinks = id ? getCurriculumLinks().draft(id) : null;
  const activeStep = activeStepFromPathname(pathname, draftLinks?.index);
  const reachedIdx = STEP_INDEX[reachedStep];

  const stages: StageNavStage[] = STEPS.map((s, i) => ({
    key: s.key,
    label: s.label,
    href: i <= reachedIdx ? hrefForStep(s.key, draftLinks, firstPhaseId) : undefined,
    state: s.key === activeStep ? "active" : i > reachedIdx ? "upcoming" : "done",
  }));

  return (
    <StageNav
      aria-label="Curriculum builder steps"
      stages={stages}
      className={cn("self-start sticky top-15.25", className)}
      {...restProps}
    />
  );
}

function activeStepFromPathname(pathname: string, draftBase: string | undefined): DraftStep | null {
  if (!draftBase) return null;
  const prefix = `${draftBase}/`;
  if (!pathname.startsWith(prefix)) return null;
  const rest = pathname.slice(prefix.length);
  for (const step of STEP_KEYS) {
    if (rest.startsWith(step)) return step;
  }
  return null;
}

function hrefForStep(step: DraftStep, links: IDraftLinks | null, firstPhaseId: string | undefined): string | undefined {
  if (!links) return undefined;
  switch (step) {
    case "outline":
      return links.outline;
    case "phases":
      return firstPhaseId ? links.phases(firstPhaseId) : undefined;
    case "finish":
      return links.finish;
    default: {
      const _exhaustive: never = step;
      return _exhaustive;
    }
  }
}
