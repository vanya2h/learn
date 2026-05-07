import { Trans, useLingui } from "@lingui/react/macro";
import { useMemo } from "react";
import { Link } from "react-router";
import type { CurriculumDef, Skill } from "../data/types";
import { useAllCurriculums } from "../hooks/useAllCurriculums";
import { useProgress } from "../hooks/useProgress";
import { useTheme } from "../hooks/useTheme";
import { GRADIENT_PRESETS } from "../lib/gradient";
import { getCurriculumLinks } from "../lib/routes";
import { computeUnlockedSkills } from "../lib/skills";
import { AnimatedText } from "./AnimatedText";
import { GradientBackground } from "./GradientBg";
import { CreatePersonalProgramCard, ProgramCard } from "./ProgramCard";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

function calcCurriculumProgress(curriculum: CurriculumDef, completedTaskIds: Record<string, string>) {
  let totalWeight = 0;
  let doneWeight = 0;
  for (const phase of curriculum.phases) {
    totalWeight += phase.tasks.reduce((s, t) => s + (t.estMinutes ?? 60), 0);
    doneWeight += phase.tasks.filter((t) => completedTaskIds[t.id]).reduce((s, t) => s + (t.estMinutes ?? 60), 0);
  }
  return totalWeight === 0 ? 0 : Math.round((doneWeight / totalWeight) * 100);
}

function SkillBadge({ skill, recentlyUnlocked }: { skill: Skill; recentlyUnlocked: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3 flex flex-col gap-1 transition-colors",
        recentlyUnlocked
          ? "border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-950/60 ring-2 ring-green-400 dark:ring-green-600 ring-offset-1 ring-offset-background"
          : "border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/40",
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-bold text-green-600 dark:text-green-400">✓</span>
        <span className="text-sm font-semibold leading-snug text-foreground">{skill.name}</span>
        {recentlyUnlocked && (
          <Badge variant="secondary" className="ml-auto">
            <Trans>New</Trans>
          </Badge>
        )}
      </div>
      <p className="text-xs leading-snug text-muted-foreground">{skill.description}</p>
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

  const curriculumsWithUnlockedSkills = allCurriculums
    .map((c) => ({ ...c, unlockedSkills: (c.skills ?? []).filter((s) => unlockedIds.has(s.id)) }))
    .filter((c) => c.unlockedSkills.length > 0);

  if (curriculumsWithUnlockedSkills.length === 0) return null;

  return (
    <section className="border-b border-border">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">
          <Trans>Skills</Trans>
        </h2>
      </div>
      <div className="flex flex-col">
        {curriculumsWithUnlockedSkills.map((curriculum, idx) => (
          <div key={curriculum.id} className={cn(idx > 0 && "border-t border-border")}>
            <h3 className="px-6 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground border-b border-border">
              {curriculum.name}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {curriculum.unlockedSkills.map((skill, i) => (
                <div
                  key={skill.id}
                  className={cn(
                    "border-b border-border last:border-b-0 p-4",
                    "sm:max-lg:odd:border-r",
                    "lg:not-nth-[3n]:border-r",
                    i >= curriculum.unlockedSkills.length - (curriculum.unlockedSkills.length % 3 || 3) &&
                      "lg:border-b-0",
                  )}
                >
                  <SkillBadge skill={skill} recentlyUnlocked={recentIds.has(skill.id)} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const CELL_BORDERS = cn("border-b border-border", "sm:max-lg:odd:border-r", "lg:not-nth-[3n]:border-r");

export function Dashboard() {
  const { t } = useLingui();
  const { completedTaskIds } = useProgress();
  const allCurriculums = useAllCurriculums();
  const { theme } = useTheme();

  return (
    <main>
      <section className="relative isolate overflow-hidden border-b border-border">
        <GradientBackground preset={theme === "dark" ? GRADIENT_PRESETS.heroDark : GRADIENT_PRESETS.heroLight} />
        <div className="relative flex flex-col items-center justify-center text-center px-6 py-24 sm:py-32">
          <AnimatedText
            as="h1"
            text={t`Learn Everything`}
            split="char"
            animation="animate-soft-blur-in"
            stagger={25}
            className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-foreground max-w-3xl"
          />
          <AnimatedText
            as="p"
            text={t`Turn any topic into a focused study plan. Track tasks, build skills, and stay consistent.`}
            split="word"
            animation="animate-word-rise"
            stagger={70}
            delay={500}
            className="mt-6 text-lg sm:text-xl lg:text-2xl text-foreground/70 max-w-2xl"
          />
          <Button
            size="lg"
            variant="default"
            render={<Link to={getCurriculumLinks().new} />}
            className="mt-10 active:scale-[0.98] transition-all animate-fade-rise [animation-delay:1500ms]"
          >
            <Trans>New Program</Trans>
          </Button>
        </div>
      </section>
      <section className="border-b border-border">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-2xl font-semibold text-foreground">
            <Trans>Programs</Trans>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {allCurriculums.map((curriculum) => (
            <ProgramCard
              key={curriculum.id}
              curriculum={curriculum}
              progress={calcCurriculumProgress(curriculum, completedTaskIds)}
              className={CELL_BORDERS}
            />
          ))}
          <CreatePersonalProgramCard className={CELL_BORDERS} />
        </div>
      </section>
      <SkillsSection completedTaskIds={completedTaskIds} />
    </main>
  );
}
