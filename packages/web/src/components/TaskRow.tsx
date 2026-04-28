import { useNavigate } from "react-router";
import type { Task } from "../data/curriculum";
import { useProgress } from "../hooks/useProgress";

type Props = { task: Task; curriculumId: string };

export function TaskRow({ task, curriculumId }: Props) {
  const { completedTaskIds } = useProgress();
  const navigate = useNavigate();
  const checked = !!completedTaskIds[task.id];

  return (
    <div className="group flex items-start gap-3 py-1.5 px-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800">
      <label className="flex items-start gap-3 flex-1 min-w-0 cursor-default">
        <input
          type="checkbox"
          checked={checked}
          readOnly
          className="mt-0.5 h-4 w-4 shrink-0 accent-green-600 pointer-events-none"
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
      {!checked && (
        <button
          onClick={() => navigate(`/topic/${curriculumId}/${task.id}`)}
          className="opacity-0 group-hover:opacity-100 shrink-0 text-xs px-2 py-0.5 rounded bg-green-600 text-white hover:bg-green-700 transition-opacity"
        >
          Start
        </button>
      )}
    </div>
  );
}
