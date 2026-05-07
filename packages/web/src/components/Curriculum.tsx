import type { CurriculumDef } from "../data/types";
import { PhaseCard } from "./PhaseCard";
import { ProgramCover } from "./ProgramCover";

type Props = { curriculum: CurriculumDef };

export function Curriculum({ curriculum }: Props) {
  return (
    <section className="flex flex-col relative">
      {curriculum.cover && (
        <div className="absolute inset-0">
          <ProgramCover shape="wave" preset={curriculum.cover} />
        </div>
      )}
      <div className="relative grow backdrop-blur-xl bg-background/90">
        {curriculum.phases.map((phase, index) => (
          <PhaseCard key={phase.id} phase={phase} curriculumId={curriculum.id} index={index} />
        ))}
      </div>
    </section>
  );
}
