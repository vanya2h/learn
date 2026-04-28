import { TopicView } from "../../src/components/TopicView";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/topic.$curriculumId.$taskId";

export async function loader({ request }: Route.LoaderArgs) {
  await requireSession(request);
  return {};
}

export default function TopicPage() {
  return <TopicView />;
}
