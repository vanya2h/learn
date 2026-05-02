import { Button } from "@cloudflare/kumo/components/button";
import { Text } from "@cloudflare/kumo/components/text";
import { Trans } from "@lingui/react/macro";
import { useNavigate, useParams, useRouteLoaderData } from "react-router";
import type { loader as layoutLoader } from "./topic-layout";

export default function CompletePage() {
  const layoutData = useRouteLoaderData<typeof layoutLoader>("routes/topic-layout");
  const { curriculumId } = useParams<{ curriculumId: string }>();
  const navigate = useNavigate();

  const taskTitle = layoutData?.task.title ?? "";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="text-4xl mb-4">✓</div>
      <div className="mb-2">
        <Text variant="heading2" as="h2">
          <Trans>Topic Complete</Trans>
        </Text>
      </div>
      <p className="text-sm text-muted-foreground mb-8 max-w-sm">
        <Trans>
          You passed the final test for <span className="font-medium text-foreground">{taskTitle}</span>. It&apos;s been
          marked as done.
        </Trans>
      </p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => void navigate(`/curriculum/${curriculumId}`)}>
          <Trans>Back to curriculum</Trans>
        </Button>
        <Button variant="primary" onClick={() => void navigate("../choice", { relative: "path" })}>
          <Trans>Start over</Trans>
        </Button>
      </div>
    </div>
  );
}
