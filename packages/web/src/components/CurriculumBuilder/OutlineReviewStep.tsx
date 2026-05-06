import { Trans } from "@lingui/react/macro";
import { ArrowRightIcon } from "@phosphor-icons/react";
import type { CurriculumOutline } from "../../data/types";
import { BuilderActionBar } from "./BuilderActionBar";
import { SelectableCard } from "./SelectableCard";

import { Button } from "~/components/ui/button";

export function OutlineReviewStep({
  outline,
  selectedPhaseIds,
  onTogglePhase,
  onStart,
  onStartOver,
}: {
  outline: CurriculumOutline;
  selectedPhaseIds: string[];
  onTogglePhase: (id: string) => void;
  onStart: () => void;
  onStartOver: () => void;
}) {
  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-1">{outline.name}</h2>
          {outline.description && <p className="text-sm text-muted-foreground">{outline.description}</p>}
        </div>
        <div className="shrink-0">
          <Button size="sm" variant="secondary" type="button" onClick={onStartOver}>
            <Trans>← Start over</Trans>
          </Button>
        </div>
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-3">
          <Trans>Deselect any phases you don&apos;t need:</Trans>
        </p>
        <div className="flex flex-col gap-2">
          {outline.phases.map((phase) => (
            <SelectableCard
              key={phase.id}
              selected={selectedPhaseIds.includes(phase.id)}
              onToggle={() => onTogglePhase(phase.id)}
              title={phase.title}
              description={phase.subtitle}
            />
          ))}
        </div>
      </div>

      <BuilderActionBar>
        <Button className="ml-auto" onClick={onStart} disabled={selectedPhaseIds.length === 0}>
          <Trans>Start generating</Trans> <ArrowRightIcon className="inline ml-1" />
        </Button>
      </BuilderActionBar>
    </div>
  );
}
