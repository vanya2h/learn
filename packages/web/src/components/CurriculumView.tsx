import { useParams } from "react-router";
import { CURRICULUMS } from "../data/curriculum";
import { Curriculum } from "./Curriculum";
import { SessionLogger } from "./SessionLogger";

export function CurriculumView() {
  const { curriculumId } = useParams<{ curriculumId: string }>();
  const curriculum = CURRICULUMS.find((c) => c.id === curriculumId);

  if (!curriculum) return null;

  return (
    <>
      <Curriculum curriculum={curriculum} />
      <SessionLogger />
    </>
  );
}
