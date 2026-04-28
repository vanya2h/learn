import { formatDistanceToNow } from "date-fns";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { CURRICULUMS } from "../data/curriculum";
import type { Skill } from "../data/types";
import { useProgress } from "../hooks/useProgress";
import { computeRecentActivity, computeUnlockedSkills } from "../lib/skills";
import { Heatmap } from "./Heatmap";

const QUOTES = [
  "If you can't explain it cleanly in writing, you don't understand it.",
  "Interest = Stimulus Value – Baseline Expectation. You can change your experience of reality by changing either variable.",
];

function QuoteSlider() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));

  const prev = () => setIndex((i) => (i - 1 + QUOTES.length) % QUOTES.length);
  const next = () => setIndex((i) => (i + 1) % QUOTES.length);

  return (
    <section className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center gap-3">
        <button
          onClick={prev}
          aria-label="Previous quote"
          className="shrink-0 text-neutral-400 dark:text-neutral-600 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors text-lg leading-none"
        >
          ‹
        </button>
        <blockquote className="flex-1 text-center text-sm italic text-neutral-600 dark:text-neutral-400 leading-relaxed">
          &ldquo;{QUOTES[index]}&rdquo;
        </blockquote>
        <button
          onClick={next}
          aria-label="Next quote"
          className="shrink-0 text-neutral-400 dark:text-neutral-600 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors text-lg leading-none"
        >
          ›
        </button>
      </div>
      <div className="flex justify-center gap-1.5 mt-3">
        {QUOTES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Quote ${i + 1}`}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              i === index ? "bg-neutral-500 dark:bg-neutral-400" : "bg-neutral-200 dark:bg-neutral-700"
            }`}
          />
        ))}
      </div>
    </section>
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

function SkillBadge({
  skill,
  unlocked,
  recentlyUnlocked,
}: {
  skill: Skill;
  unlocked: boolean;
  recentlyUnlocked: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 flex flex-col gap-1 transition-colors ${
        unlocked
          ? recentlyUnlocked
            ? "border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-950/60 ring-2 ring-green-400 dark:ring-green-600 ring-offset-1 dark:ring-offset-neutral-950"
            : "border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/40"
          : "border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={`text-xs font-bold ${unlocked ? "text-green-600 dark:text-green-400" : "text-neutral-300 dark:text-neutral-700"}`}
        >
          {unlocked ? "✓" : "○"}
        </span>
        <span
          className={`text-sm font-semibold leading-snug ${unlocked ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-400 dark:text-neutral-600"}`}
        >
          {skill.name}
        </span>
        {recentlyUnlocked && (
          <span className="ml-auto text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-1.5 py-0.5 rounded-full">
            New
          </span>
        )}
      </div>
      <p
        className={`text-xs leading-snug ${unlocked ? "text-neutral-500 dark:text-neutral-400" : "text-neutral-300 dark:text-neutral-700"}`}
      >
        {skill.description}
      </p>
    </div>
  );
}

function RecentActivity({
  completedTaskIds,
  specializations,
}: {
  completedTaskIds: Record<string, string>;
  specializations: Record<string, string | null>;
}) {
  const items = computeRecentActivity(completedTaskIds, specializations);
  if (items.length === 0) return null;

  return (
    <section className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
      <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3">
        Recent Activity
      </h2>
      <ul className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            {item.type === "skill" ? (
              <>
                <span className="mt-0.5 text-green-600 dark:text-green-400 font-bold shrink-0">★</span>
                <span className="leading-snug">
                  <span className="font-medium text-green-700 dark:text-green-400">New skill unlocked:</span>{" "}
                  <span className="text-neutral-900 dark:text-neutral-100">{item.skill.skill.name}</span>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500 ml-2">
                    {formatDistanceToNow(item.date, { addSuffix: true })}
                  </span>
                </span>
              </>
            ) : (
              <>
                <span className="mt-0.5 text-neutral-300 dark:text-neutral-600 shrink-0">·</span>
                <span className="leading-snug text-neutral-600 dark:text-neutral-400">
                  Completed: <span className="text-neutral-800 dark:text-neutral-200">{item.taskTitle}</span>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500 ml-2">
                    {formatDistanceToNow(item.date, { addSuffix: true })}
                  </span>
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function SkillsSection({
  completedTaskIds,
  specializations,
}: {
  completedTaskIds: Record<string, string>;
  specializations: Record<string, string | null>;
}) {
  const unlockedSkills = useMemo(
    () => computeUnlockedSkills(completedTaskIds, specializations),
    [completedTaskIds, specializations],
  );
  const { unlockedIds, recentIds } = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return {
      unlockedIds: new Set(unlockedSkills.map((u) => u.skill.id)),
      recentIds: new Set(unlockedSkills.filter((u) => u.unlockedAt >= sevenDaysAgo).map((u) => u.skill.id)),
    };
  }, [unlockedSkills]);

  const curriculumsWithSkills = CURRICULUMS.filter((c) => (c.skills?.length ?? 0) > 0);
  if (curriculumsWithSkills.length === 0) return null;

  return (
    <section className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
      <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-4">
        Skills
      </h2>
      <div className="flex flex-col gap-6">
        {curriculumsWithSkills.map((curriculum) => (
          <div key={curriculum.id}>
            <h3 className="text-xs font-medium text-neutral-400 dark:text-neutral-500 mb-2">{curriculum.name}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {(curriculum.skills ?? []).map((skill) => (
                <SkillBadge
                  key={skill.id}
                  skill={skill}
                  unlocked={unlockedIds.has(skill.id)}
                  recentlyUnlocked={recentIds.has(skill.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Dashboard() {
  const { completedTaskIds, specializations } = useProgress();

  return (
    <main>
      <QuoteSlider />
      <Heatmap />
      <RecentActivity completedTaskIds={completedTaskIds} specializations={specializations} />
      <SkillsSection completedTaskIds={completedTaskIds} specializations={specializations} />
      <section className="px-6 py-4">
        <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3">
          Programs
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CURRICULUMS.map((curriculum) => {
            const pct = calcCurriculumProgress(curriculum.id, completedTaskIds, specializations);
            return (
              <Link
                key={curriculum.id}
                to={`/curriculum/${curriculum.id}`}
                className="block rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 hover:border-green-500 dark:hover:border-green-600 transition-colors"
              >
                <div className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{curriculum.name}</div>
                <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{pct}% complete</div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
