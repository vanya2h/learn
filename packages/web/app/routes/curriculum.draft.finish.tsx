import { Trans } from "@lingui/react/macro";
import { redirect, useLoaderData, useNavigate, useParams } from "react-router";
import { getCurriculumLinks } from "../../src/lib/routes";
import { db } from "../../src/server/db";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/curriculum.draft.finish";

import { Card } from "~/components/Card";
import { Button } from "~/components/ui/button";

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireSession(request);
  const draft = await db.customCurriculum.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  const links = getCurriculumLinks();
  if (!draft) throw redirect(links.new);
  if (draft.status !== "published") throw redirect(links.draft(draft.id).index);
  return { name: draft.name };
}

export default function DraftFinishPage() {
  const { name } = useLoaderData<typeof loader>();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <Card.List>
        <Card.Entry>
          <Card.Heading>
            <Trans>Program Ready!</Trans>
          </Card.Heading>
          <Card.CardSubheading className="mt-2 max-w-sm">
            <Trans>
              <span className="font-medium text-foreground">{name}</span> is published and ready to study.
            </Trans>
          </Card.CardSubheading>
        </Card.Entry>
        <Card.Entry>
          <Button className="ml-auto" onClick={() => id && void navigate(getCurriculumLinks().byId(id))}>
            <Trans>Open Program</Trans>
          </Button>
        </Card.Entry>
      </Card.List>
    </div>
  );
}
