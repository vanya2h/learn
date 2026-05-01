import { useParams } from "react-router";
import { useAllCurriculums } from "../hooks/useAllCurriculums";
import { Curriculum } from "./Curriculum";

export function CurriculumView() {
  const { curriculumId } = useParams<{ curriculumId: string }>();
  const allCurriculums = useAllCurriculums();
  const curriculum = allCurriculums.find((c) => c.id === curriculumId);

  if (!curriculum) return null;

  return <Curriculum curriculum={curriculum} />;
}
