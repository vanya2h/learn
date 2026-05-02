import { Button } from "@cloudflare/kumo/components/button";
import { Trans, useLingui } from "@lingui/react/macro";
import clsx from "clsx";
import { useNavigate } from "react-router";
import type { Task } from "../data/curriculum";
import type { ActiveSession } from "../hooks/useProgress";
import { useProgress } from "../hooks/useProgress";
import { apiClient } from "../lib/apiClient";

function useSessionLabel(session: ActiveSession): string {
  const { t } = useLingui();
  const part = (session.partIdx ?? 0) + 1;
  switch (session.name) {
    case "assessing":
      return t`Assessing`;
    case "gaps-review":
      return t`Assessment done`;
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

function ActiveSessionLabel({ session }: { session: ActiveSession }) {
  const label = useSessionLabel(session);
  return <span className="ml-2 text-xs text-amber-500 dark:text-amber-400 font-medium">{label}</span>;
}

export function TaskRow({ task, curriculumId }: { task: Task; curriculumId: string }) {
  const { completedTaskIds, activeSessions } = useProgress();
  const navigate = useNavigate();
  const checked = !!completedTaskIds[task.id];
  const activeSession = activeSessions[task.id];

  return (
    <div className="group flex items-start gap-3 py-1.5 px-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800">
      <label className="flex items-start gap-3 flex-1 min-w-0">
        <input
          type="checkbox"
          checked={checked}
          readOnly
          className="mt-0.5 h-4 w-4 shrink-0 accent-green-600 pointer-events-none"
        />
        <span className={`text-sm leading-snug ${checked ? "line-through text-foreground/40" : "text-foreground"}`}>
          {task.title}
          {task.estMinutes && (
            <span className="ml-2 text-xs text-muted-foreground">
              ~{task.estMinutes >= 60 ? `${Math.round(task.estMinutes / 60)}h` : `${task.estMinutes}m`}
            </span>
          )}
          {activeSession && <ActiveSessionLabel session={activeSession} />}
        </span>
      </label>
      {!checked && (
        <div
          className={clsx(
            "shrink-0 flex gap-1 transition-opacity",
            !activeSession && "opacity-0 group-hover:opacity-100",
          )}
        >
          {activeSession && (
            <Button
              size="xs"
              variant="secondary"
              onClick={() => {
                void apiClient.api["topic-sessions"][":taskId"].$delete({ param: { taskId: task.id } });
                navigate(`/topic/${curriculumId}/${task.id}`);
              }}
            >
              <Trans>Start over</Trans>
            </Button>
          )}
          <Button size="xs" variant="primary" onClick={() => navigate(`/topic/${curriculumId}/${task.id}`)}>
            {activeSession ? <Trans>Continue</Trans> : <Trans>Start</Trans>}
          </Button>
        </div>
      )}
    </div>
  );
}
