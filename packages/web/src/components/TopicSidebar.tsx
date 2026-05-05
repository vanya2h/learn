import { Trans } from "@lingui/react/macro";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useLocation } from "react-router";
import { StageLink } from "./StageLink";

const STAGES = [
  { path: "choice", label: "Choice" },
  { path: "assess", label: "Assess" },
  { path: "gaps", label: "Gaps" },
  { path: "study", label: "Study" },
  { path: "hands-on", label: "Practice" },
  { path: "feedback", label: "Feedback" },
  { path: "write-up", label: "Write-up" },
  { path: "complete", label: "Complete" },
] as const;

type Props = {
  highestStage: number;
  taskCompleted: boolean;
  onBack: () => void;
};

export function TopicSidebar({ highestStage, taskCompleted, onBack }: Props) {
  const { pathname } = useLocation();
  const lastSegment = pathname.split("/").filter(Boolean).pop() ?? "";
  const reached = taskCompleted ? STAGES.length - 1 : highestStage;

  return (
    <div className="flex flex-col h-full">
      <nav className="w-64 shrink-0 self-stretch flex flex-col">
        <StageLink
          prefix={<ArrowLeftIcon size={14} weight="bold" />}
          label={<Trans>Back to curriculum</Trans>}
          onClick={onBack}
        />
        {STAGES.map((stage, i) => (
          <StageLink
            key={stage.path}
            prefix={String(i + 1).padStart(2, "0")}
            label={stage.label}
            to={stage.path}
            active={stage.path === lastSegment}
            disabled={i > reached}
          />
        ))}
      </nav>
    </div>
  );
}
