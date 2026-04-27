import type { SpecializationId } from "../data/curriculum";
import { SPECIALIZATION_INFO } from "../data/curriculum";
import { useStore } from "../store";

type Props = { curriculumId: string };

export function SpecializationPicker({ curriculumId }: Props) {
  const setSpecialization = useStore((s) => s.setSpecialization);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
      {(
        Object.entries(SPECIALIZATION_INFO) as [SpecializationId, (typeof SPECIALIZATION_INFO)[SpecializationId]][]
      ).map(([id, info]) => (
        <div key={id} className="flex flex-col gap-3 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
          <div>
            <div className="font-semibold text-neutral-900 dark:text-neutral-100">{info.label}</div>
            <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{info.description}</div>
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-500">
            {info.tasks} tasks · ~{info.hours} hrs
          </div>
          <button
            onClick={() => setSpecialization(curriculumId, id)}
            className="mt-auto rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
          >
            Choose this path
          </button>
        </div>
      ))}
    </div>
  );
}
