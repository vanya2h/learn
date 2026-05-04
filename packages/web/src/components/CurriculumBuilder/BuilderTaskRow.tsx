import clsx from "clsx";
import type { Task } from "../../data/types";

export function BuilderTaskRow({
  task,
  included,
  onToggle,
  readOnly = false,
}: {
  task: Task;
  included: boolean;
  onToggle?: () => void;
  readOnly?: boolean;
}) {
  const nonInteractive = readOnly || !onToggle;
  return (
    <div className="group flex items-start gap-3 py-1.5 px-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800">
      <label
        className={clsx("flex items-start gap-3 flex-1 min-w-0", nonInteractive ? "cursor-default" : "cursor-pointer")}
      >
        <input
          type="checkbox"
          checked={included}
          onChange={nonInteractive ? undefined : onToggle}
          readOnly={nonInteractive}
          className={clsx("mt-0.5 h-4 w-4 shrink-0 accent-green-600", nonInteractive && "pointer-events-none")}
        />
        <span className={`text-sm leading-snug ${!included ? "line-through text-foreground/40" : "text-foreground"}`}>
          {task.title}
          {task.estMinutes && (
            <span className="ml-2 text-xs text-muted-foreground">
              ~{task.estMinutes >= 60 ? `${Math.round(task.estMinutes / 60)}h` : `${task.estMinutes}m`}
            </span>
          )}
        </span>
      </label>
    </div>
  );
}
