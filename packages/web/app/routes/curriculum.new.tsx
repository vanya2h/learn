import { CurriculumBuilder } from "../../src/components/CurriculumBuilder";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/curriculum.new";

export async function loader({ request }: Route.LoaderArgs) {
  await requireSession(request);
  return {};
}

export default function NewCurriculumPage() {
  return <CurriculumBuilder />;
}
