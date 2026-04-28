import { CurriculumView } from "../../src/components/CurriculumView";
import { Header } from "../../src/components/Header";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/curriculum.$curriculumId";

export async function loader({ request }: Route.LoaderArgs) {
  await requireSession(request);
  return {};
}

export default function CurriculumPage() {
  return (
    <>
      <Header />
      <CurriculumView />
    </>
  );
}
