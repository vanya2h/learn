import { CURRICULUMS } from "../data/curriculum";
import { useStore } from "../store";
import { Curriculum } from "./Curriculum";
import { SessionLogger } from "./SessionLogger";

export function CurriculumView() {
  const activeCurriculumId = useStore((s) => s.activeCurriculumId);
  const curriculum = CURRICULUMS.find((c) => c.id === activeCurriculumId);

  if (!curriculum) return null;

  return (
    <>
      <Curriculum curriculum={curriculum} />
      <SessionLogger />
    </>
  );
}
