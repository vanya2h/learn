import type { Task } from "../data/curriculum";
import { useStore } from "../store";

type Props = { task: Task };

export function TaskRow({ task }: Props) {
  const completedTaskIds = useStore((s) => s.completedTaskIds);
  const toggleTask = useStore((s) => s.toggleTask);
  const checked = !!completedTaskIds[task.id];

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") toggleTask(task.id);
  }

  return (
    <label
      className="flex items-start gap-3 py-1.5 px-2 rounded cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 group"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => toggleTask(task.id)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-green-600"
      />
      <span
        className={`text-sm leading-snug ${checked ? "line-through text-neutral-400 dark:text-neutral-600" : "text-neutral-800 dark:text-neutral-200"}`}
      >
        {task.title}
        {task.estMinutes && (
          <span className="ml-2 text-xs text-neutral-400 dark:text-neutral-500">
            ~{task.estMinutes >= 60 ? `${Math.round(task.estMinutes / 60)}h` : `${task.estMinutes}m`}
          </span>
        )}
      </span>
    </label>
  );
}
