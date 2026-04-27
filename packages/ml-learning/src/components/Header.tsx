import { format, subDays } from "date-fns";
import { CURRICULUM } from "../data/curriculum";
import { useStore } from "../store";

function calcOverallProgress(completedTaskIds: Record<string, string>, specialization: string | null) {
  let totalWeight = 0;
  let doneWeight = 0;
  for (const phase of CURRICULUM) {
    const tasks =
      phase.id === "phase-3"
        ? specialization
          ? phase.tasks.filter((t) => t.branch === specialization)
          : []
        : phase.tasks;
    const phaseTotal = tasks.reduce((s, t) => s + (t.estMinutes ?? 60), 0);
    const phaseDone = tasks.filter((t) => completedTaskIds[t.id]).reduce((s, t) => s + (t.estMinutes ?? 60), 0);
    totalWeight += phaseTotal;
    doneWeight += phaseDone;
  }
  return totalWeight === 0 ? 0 : Math.round((doneWeight / totalWeight) * 100);
}

function calcStreak(activity: Record<string, { minutes: number; taskIds: string[] }>) {
  let streak = 0;
  let cursor = new Date();
  while (true) {
    const key = format(cursor, "yyyy-MM-dd");
    const entry = activity[key];
    if (!entry || (entry.minutes === 0 && entry.taskIds.length === 0)) break;
    streak++;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

export function Header() {
  const completedTaskIds = useStore((s) => s.completedTaskIds);
  const activity = useStore((s) => s.activity);
  const specialization = useStore((s) => s.specialization);
  const pct = calcOverallProgress(completedTaskIds, specialization);
  const streak = calcStreak(activity);

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
      <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">ML Learning Tracker</h1>
      <div className="flex items-center gap-6 text-sm text-neutral-600 dark:text-neutral-400">
        <span>
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">{pct}%</span> overall
        </span>
        <span>
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">{streak}</span>
          {streak === 1 ? " day" : " days"} streak
        </span>
      </div>
    </header>
  );
}
