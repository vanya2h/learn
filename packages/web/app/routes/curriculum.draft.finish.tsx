import { Trans } from "@lingui/react/macro";
import { redirect, useLoaderData, useNavigate, useParams } from "react-router";
import type { Route } from "./+types/curriculum.draft.finish";

import { Card } from "~/components/Card";
import { PageBody } from "~/components/layout/PageBody";
import { PageContent } from "~/components/layout/PageContent";
import { ReadingColumn } from "~/components/layout/ReadingColumn";
import { Button } from "~/components/ui/button";
import { getCurriculumLinks } from "~/lib/routes";
import { db } from "~/server/db";
import { requireSession } from "~/server/session";

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
    <PageBody>
      <PageContent>
        <ReadingColumn>
          <Card.List className="m-auto max-w-64">
            <Card.Entry className="gap-2">
              <Card.Heading>
                <Trans>Program Ready!</Trans>
              </Card.Heading>
              <Card.SubHeading className="max-w-sm">
                <Trans>
                  <span className="font-medium text-foreground">{name}</span> is published and ready to study.
                </Trans>
              </Card.SubHeading>
            </Card.Entry>
            <Card.Entry>
              <Button className="ml-auto" onClick={() => id && void navigate(getCurriculumLinks().byId(id))}>
                <Trans>Open Program</Trans>
              </Button>
            </Card.Entry>
          </Card.List>
        </ReadingColumn>
      </PageContent>
    </PageBody>
  );
}
