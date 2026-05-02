import { Breadcrumbs } from "@cloudflare/kumo/components/breadcrumbs";
import { Trans } from "@lingui/react/macro";
import { CurriculumBuilder } from "../../src/components/CurriculumBuilder";
import type { BreadcrumbHandle } from "../../src/lib/breadcrumbs";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/curriculum.new";

export async function loader({ request }: Route.LoaderArgs) {
  await requireSession(request);
  return {};
}

export const handle: BreadcrumbHandle = {
  breadcrumb: () => (
    <Breadcrumbs.Current>
      <Trans>New program</Trans>
    </Breadcrumbs.Current>
  ),
};

export default function NewCurriculumPage() {
  return <CurriculumBuilder />;
}
