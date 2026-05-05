import { Trans } from "@lingui/react/macro";
import { ArrowRightIcon } from "@phosphor-icons/react";
import clsx from "clsx";
import type { CurriculumOutline } from "../../data/types";
import { Button } from "../ui/Button";

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
          <h2 className="text-lg font-semibold text-foreground mb-1">{outline.name}</h2>
          {outline.description && <p className="text-sm text-muted-foreground">{outline.description}</p>}
        </div>
        <div className="shrink-0">
          <Button size="sm" type="button" onClick={onStartOver}>
            <Trans>← Start over</Trans>
          </Button>
        </div>
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-3">
          <Trans>Deselect any phases you don&apos;t need:</Trans>
        </p>
        <div className="flex flex-col gap-2">
          {outline.phases.map((phase) => {
            const selected = selectedPhaseIds.includes(phase.id);
            return (
              <label
                key={phase.id}
                className={clsx(
                  "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  selected ? "border-border" : "border-border/40 opacity-50",
                )}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 accent-foreground"
                  checked={selected}
                  onChange={() => onTogglePhase(phase.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{phase.title}</p>
                  <p className="text-xs text-muted-foreground">{phase.subtitle}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onStart} disabled={selectedPhaseIds.length === 0}>
          <Trans>Start generating</Trans> <ArrowRightIcon className="inline ml-1" />
        </Button>
      </div>
    </div>
  );
}
