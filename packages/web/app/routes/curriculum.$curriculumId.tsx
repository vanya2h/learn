import { Breadcrumbs } from "@cloudflare/kumo/components/breadcrumbs";
import { useParams } from "react-router";
import { CurriculumView } from "../../src/components/CurriculumView";
import { useAllCurriculums } from "../../src/hooks/useAllCurriculums";
import type { BreadcrumbHandle } from "../../src/lib/breadcrumbs";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/curriculum.$curriculumId";

export async function loader({ request }: Route.LoaderArgs) {
  await requireSession(request);
  return {};
}

export const handle: BreadcrumbHandle = {
  breadcrumb: () => <CurriculumBreadcrumb />,
};

export default function CurriculumPage() {
  return <CurriculumView />;
}

function CurriculumBreadcrumb() {
  const { curriculumId } = useParams<{ curriculumId: string }>();
  const all = useAllCurriculums();
  const name = all.find((c) => c.id === curriculumId)?.name ?? "";
  return <Breadcrumbs.Current>{name}</Breadcrumbs.Current>;
}
