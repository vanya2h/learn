import { format, subDays } from "date-fns";
import { useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { useRootData } from "../../app/hooks/useRootData";
import { CURRICULUMS } from "../data/curriculum";
import { useProgress } from "../hooks/useProgress";
import type { AuthUser } from "../server/auth";

function hashToHue(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffff;
  return h % 360;
}

function UserAvatar({ user }: { user: AuthUser }) {
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const hue = hashToHue(user.id);

  if (user.image) {
    return <img src={user.image} alt={user.name} className="w-8 h-8 rounded-full object-cover" />;
  }

  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
      style={{
        background: `linear-gradient(135deg, hsl(${hue}, 65%, 55%), hsl(${(hue + 60) % 360}, 65%, 40%))`,
      }}
    >
      {initials}
    </div>
  );
}

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
  const user = (useRootData()?.user ?? null) as AuthUser | null;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { completedTaskIds, activity, specializations } = useProgress();

  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ curriculumId?: string }>();

  const isDashboard = location.pathname === "/";
  const activeCurriculumId = params.curriculumId ?? null;
  const activeCurriculum = activeCurriculumId ? CURRICULUMS.find((c) => c.id === activeCurriculumId) : null;
  const currentLabel = isDashboard ? "Dashboard" : (activeCurriculum?.name ?? "");

  const pct =
    activeCurriculumId && !isDashboard
      ? calcCurriculumProgress(activeCurriculumId, completedTaskIds, specializations)
      : null;

  const streak = calcStreak(activity);

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
                  navigate("/");
                  setDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
                  isDashboard
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
                    navigate(`/curriculum/${c.id}`);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
                    !isDashboard && activeCurriculumId === c.id
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
        {user && (
          <div className="flex items-center gap-2">
            <UserAvatar user={user} />
            <span className="text-neutral-700 dark:text-neutral-300 font-medium">{user.name}</span>
          </div>
        )}
      </div>
    </header>
  );
}
