import { Trans } from "@lingui/react/macro";
import { useNavigate, useParams, useRouteLoaderData } from "react-router";
import type { loader as layoutLoader } from "./topic-layout";

import { Card } from "~/components/Card";
import { PageBody } from "~/components/layout/PageBody";
import { PageContent } from "~/components/layout/PageContent";
import { ReadingColumn } from "~/components/layout/ReadingColumn";
import { Button } from "~/components/ui/button";
import { getCurriculumLinks } from "~/lib/routes";

export default function CompletePage() {
  const layoutData = useRouteLoaderData<typeof layoutLoader>("routes/topic-layout");
  const { curriculumId } = useParams<{ curriculumId: string }>();
  const navigate = useNavigate();

  const taskTitle = layoutData?.task.title ?? "";

  return (
    <PageBody>
      <PageContent>
        <ReadingColumn>
          <Card.List className="my-auto">
            <Card.Entry className="gap-2">
              <Card.Heading>
                <Trans>Topic Complete!</Trans>
              </Card.Heading>
              <Card.SubHeading>
                <Trans>
                  You passed the final test for <span className="font-medium text-foreground">{taskTitle}</span>.
                  It&apos;s been marked as done.
                </Trans>
              </Card.SubHeading>
            </Card.Entry>
            <Card.Entry>
              <Button
                className="ml-auto"
                onClick={() => curriculumId && void navigate(getCurriculumLinks().byId(curriculumId))}
              >
                <Trans>Continue</Trans>
              </Button>
            </Card.Entry>
          </Card.List>
        </ReadingColumn>
      </PageContent>
    </PageBody>
  );
}
