import { Badge } from "@cloudflare/kumo/components/badge";
import { LayerCard } from "@cloudflare/kumo/components/layer-card";
import { Meter } from "@cloudflare/kumo/components/meter";
import { Text } from "@cloudflare/kumo/components/text";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import type { CurriculumDef, Skill } from "../data/types";
import { useAllCurriculums } from "../hooks/useAllCurriculums";
import { useProgress } from "../hooks/useProgress";
import { computeUnlockedSkills } from "../lib/skills";

const QUOTES = [
  "If you can't explain it cleanly in writing, you don't understand it.",
  "The expert in anything was once a beginner who refused to quit.",
  "Every hour of focused work today is an hour your future self doesn't have to dread.",
  "You don't rise to the level of your goals — you fall to the level of your systems.",
  "Discomfort is the price of admission to a meaningful career.",
  "The gap between where you are and where you want to be is closed one rep at a time.",
  "Ship something small today. Momentum is built, not found.",
  "Your skills compound like interest. The earlier you invest, the richer you become.",
  "A day of deep work done is a day you can defend.",
  "You are not behind. You are exactly where your effort has put you — and effort is still yours to give.",
];

function QuoteSlider() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));

  const prev = () => setIndex((i) => (i - 1 + QUOTES.length) % QUOTES.length);
  const next = () => setIndex((i) => (i + 1) % QUOTES.length);

  return (
    <section className="px-6 py-4 border-b border-border">
      <div className="flex items-center gap-3">
        <button
          onClick={prev}
          aria-label="Previous quote"
          className="shrink-0 text-foreground/40 hover:text-foreground/70 transition-colors text-lg leading-none"
        >
          ‹
        </button>
        <blockquote className="flex-1 text-center text-sm italic text-muted-foreground leading-relaxed">
          &ldquo;{QUOTES[index]}&rdquo;
        </blockquote>
        <button
          onClick={next}
          aria-label="Next quote"
          className="shrink-0 text-foreground/40 hover:text-foreground/70 transition-colors text-lg leading-none"
        >
          ›
        </button>
      </div>
    </section>
  );
}

function calcCurriculumProgress(curriculum: CurriculumDef, completedTaskIds: Record<string, string>) {
  let totalWeight = 0;
  let doneWeight = 0;
  for (const phase of curriculum.phases) {
    totalWeight += phase.tasks.reduce((s, t) => s + (t.estMinutes ?? 60), 0);
    doneWeight += phase.tasks.filter((t) => completedTaskIds[t.id]).reduce((s, t) => s + (t.estMinutes ?? 60), 0);
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
            ? "border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-950/60 ring-2 ring-green-400 dark:ring-green-600 ring-offset-1 ring-offset-background"
            : "border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/40"
          : "border-border bg-muted/50"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span className={`text-xs font-bold ${unlocked ? "text-green-600 dark:text-green-400" : "text-foreground/20"}`}>
          {unlocked ? "✓" : "○"}
        </span>
        <span className={`text-sm font-semibold leading-snug ${unlocked ? "text-foreground" : "text-foreground/40"}`}>
          {skill.name}
        </span>
        {recentlyUnlocked && (
          <Badge variant="success" className="ml-auto">
            New
          </Badge>
        )}
      </div>
      <p className={`text-xs leading-snug ${unlocked ? "text-muted-foreground" : "text-foreground/20"}`}>
        {skill.description}
      </p>
    </div>
  );
}

function SkillsSection({ completedTaskIds }: { completedTaskIds: Record<string, string> }) {
  const allCurriculums = useAllCurriculums();
  const unlockedSkills = useMemo(
    () => computeUnlockedSkills(completedTaskIds, allCurriculums),
    [completedTaskIds, allCurriculums],
  );
  const { unlockedIds, recentIds } = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return {
      unlockedIds: new Set(unlockedSkills.map((u) => u.skill.id)),
      recentIds: new Set(unlockedSkills.filter((u) => u.unlockedAt >= sevenDaysAgo).map((u) => u.skill.id)),
    };
  }, [unlockedSkills]);

  const curriculumsWithSkills = allCurriculums.filter((c) => (c.skills?.length ?? 0) > 0);
  if (curriculumsWithSkills.length === 0) return null;

  return (
    <section className="px-6 py-4 border-b border-border">
      <div className="mb-4">
        <Text variant="heading3" as="h2">
          Skills
        </Text>
      </div>
      <div className="flex flex-col gap-6">
        {curriculumsWithSkills.map((curriculum) => (
          <div key={curriculum.id}>
            <h3 className="text-xs font-medium text-foreground/40 mb-2">{curriculum.name}</h3>
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
  const { completedTaskIds } = useProgress();
  const allCurriculums = useAllCurriculums();

  return (
    <main>
      <QuoteSlider />

      <section className="px-6 py-4 border-b border-border">
        <div className="mb-3">
          <Text variant="heading3" as="h2">
            Programs
          </Text>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allCurriculums.map((curriculum) => {
            const pct = calcCurriculumProgress(curriculum, completedTaskIds);
            return (
              <LayerCard key={curriculum.id} render={<Link to={`/curriculum/${curriculum.id}`} />}>
                <LayerCard.Secondary>{curriculum.name}</LayerCard.Secondary>
                <LayerCard.Primary>
                  {curriculum.description && (
                    <p className="text-sm text-muted-foreground mb-3">{curriculum.description}</p>
                  )}
                  <Meter label="Progress" value={pct} showValue />
                </LayerCard.Primary>
              </LayerCard>
            );
          })}
          <Link
            to="/curriculum/new"
            className="flex items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-foreground/30 transition-colors min-h-25 text-muted-foreground hover:text-foreground/60"
          >
            <span className="text-sm font-medium">+ Create new program</span>
          </Link>
        </div>
      </section>
      <SkillsSection completedTaskIds={completedTaskIds} />
    </main>
  );
}
