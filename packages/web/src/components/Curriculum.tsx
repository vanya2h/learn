import type { CurriculumDef } from "../data/curriculum";
import { PhaseCard } from "./PhaseCard";

type Props = { curriculum: CurriculumDef };

export function Curriculum({ curriculum }: Props) {
  return (
    <section className="px-6 py-4 flex flex-col gap-3">
      {curriculum.phases.map((phase) => (
        <PhaseCard key={phase.id} phase={phase} curriculumId={curriculum.id} />
      ))}
    </section>
  );
}
