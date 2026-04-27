import { CURRICULUM } from "../data/curriculum";
import { PhaseCard } from "./PhaseCard";

export function Curriculum() {
  return (
    <section className="px-6 py-4 flex flex-col gap-3">
      {CURRICULUM.map((phase) => (
        <PhaseCard key={phase.id} phase={phase} />
      ))}
    </section>
  );
}
