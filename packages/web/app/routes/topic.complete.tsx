import { Trans } from "@lingui/react/macro";
import { useNavigate, useParams, useRouteLoaderData } from "react-router";
import type { loader as layoutLoader } from "./topic-layout";

import { Button } from "~/components/ui/button";

export default function CompletePage() {
  const layoutData = useRouteLoaderData<typeof layoutLoader>("routes/topic-layout");
  const { curriculumId } = useParams<{ curriculumId: string }>();
  const navigate = useNavigate();

  const taskTitle = layoutData?.task.title ?? "";

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="text-4xl mb-4">✓</div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          <Trans>Topic Complete</Trans>
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          <Trans>
            You passed the final test for <span className="font-medium text-foreground">{taskTitle}</span>. It&apos;s
            been marked as done.
          </Trans>
        </p>
        <Button className="mt-6" onClick={() => void navigate(`/curriculum/${curriculumId}`)}>
          <Trans>Back to curriculum</Trans>
        </Button>
      </div>
    </>
  );
}
