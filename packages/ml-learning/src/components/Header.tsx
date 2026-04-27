import { format, subDays } from "date-fns";
import { useRef, useState } from "react";
import { CURRICULUMS } from "../data/curriculum";
import { useStore } from "../store";

function calcCurriculumProgress(
  curriculumId: string,
  completedTaskIds: Record<string, string>,
  specializations: Record<string, string | null>,
) {
  const curriculum = CURRICULUMS.find((c) => c.id === curriculumId);
  if (!curriculum) return 0;
  const specialization = specializations[curriculumId] ?? null;
  let totalWeight = 0;
  let doneWeight = 0;
  for (const phase of curriculum.phases) {
    const tasks =
      phase.id === "phase-3"
        ? specialization
          ? phase.tasks.filter((t) => t.branch === specialization)
          : []
        : phase.tasks;
    totalWeight += tasks.reduce((s, t) => s + (t.estMinutes ?? 60), 0);
    doneWeight += tasks.filter((t) => completedTaskIds[t.id]).reduce((s, t) => s + (t.estMinutes ?? 60), 0);
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const completedTaskIds = useStore((s) => s.completedTaskIds);
  const activity = useStore((s) => s.activity);
  const specializations = useStore((s) => s.specializations);
  const currentView = useStore((s) => s.currentView);
  const activeCurriculumId = useStore((s) => s.activeCurriculumId);
  const setView = useStore((s) => s.setView);

  const streak = calcStreak(activity);

  const activeCurriculum = CURRICULUMS.find((c) => c.id === activeCurriculumId);
  const currentLabel = currentView === "dashboard" ? "Dashboard" : (activeCurriculum?.name ?? "");

  const pct =
    currentView === "curriculum" ? calcCurriculumProgress(activeCurriculumId, completedTaskIds, specializations) : null;

  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
      setDropdownOpen(false);
    }
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Learning Tracker</h1>

        <div ref={dropdownRef} className="relative" onBlur={handleBlur}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-md border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            {currentLabel}
            <svg
              className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 top-full mt-1 z-50 min-w-40 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg py-1">
              <button
                onClick={() => {
                  setView("dashboard");
                  setDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
                  currentView === "dashboard"
                    ? "text-green-700 dark:text-green-400 font-medium"
                    : "text-neutral-700 dark:text-neutral-300"
                }`}
              >
                Dashboard
              </button>
              <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />
              {CURRICULUMS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setView("curriculum", c.id);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
                    currentView === "curriculum" && activeCurriculumId === c.id
                      ? "text-green-700 dark:text-green-400 font-medium"
                      : "text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6 text-sm text-neutral-600 dark:text-neutral-400">
        {pct !== null && (
          <span>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">{pct}%</span> complete
          </span>
        )}
        <span>
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">{streak}</span>
          {streak === 1 ? " day" : " days"} streak
        </span>
      </div>
    </header>
  );
}
