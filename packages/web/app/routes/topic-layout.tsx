import { Breadcrumbs } from "@cloudflare/kumo/components/breadcrumbs";
import { Button } from "@cloudflare/kumo/components/button";
import { Dialog } from "@cloudflare/kumo/components/dialog";
import { Text } from "@cloudflare/kumo/components/text";
import { Trans } from "@lingui/react/macro";
import { Outlet, useLoaderData, useNavigate, useParams } from "react-router";
import { redirect } from "react-router";
import { CURRICULUMS_BY_LOCALE } from "../../src/data/curriculum";
import type { CurriculumDef } from "../../src/data/types";
import { parseCurriculumDef } from "../../src/data/types";
import { useTopicSession } from "../../src/hooks/useTopicSession";
import type { BreadcrumbHandle } from "../../src/lib/breadcrumbs";
import { getLocaleFromRequest } from "../../src/lib/i18n";
import { db } from "../../src/server/db";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/topic-layout";

export function meta({ loaderData }: Route.MetaArgs): Route.MetaDescriptors {
  const title = loaderData?.task?.title;
  return [
    { title: title ? `${title} — Learning Tracker` : "Topic — Learning Tracker" },
    {
      name: "description",
      content: title
        ? `Study ${title} with AI-generated material and hands-on practice.`
        : "Study this topic with AI-generated material and hands-on practice.",
    },
  ];
}

function findTask(curriculums: CurriculumDef[], taskId: string) {
  for (const c of curriculums) {
    for (const p of c.phases) {
      for (const t of p.tasks) {
        if (t.id === taskId) return { task: t, curriculumName: c.name };
      }
    }
  }
  return null;
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireSession(request);

  const locale = getLocaleFromRequest(request);
  const found = findTask(CURRICULUMS_BY_LOCALE[locale], params.taskId);
  if (found) return found;

  const custom = await db.customCurriculum.findMany({ where: { userId: session.user.id } });
  const customCurriculums = custom
    .map((c) => parseCurriculumDef({ ...c, description: c.description ?? undefined }))
    .filter((c) => c !== null);
  const foundCustom = findTask(customCurriculums, params.taskId);
  if (foundCustom) return foundCustom;

  return redirect(`/curriculum/${params.curriculumId}`);
}

export const handle: BreadcrumbHandle = {
  breadcrumb: () => <TopicBreadcrumb />,
};

function TopicBreadcrumb() {
  const data = useLoaderData<typeof loader>();
  const { curriculumId } = useParams<{ curriculumId: string }>();
  if (!data) return null;
  const { task, curriculumName } = data;
  return (
    <>
      <Breadcrumbs.Link href={`/curriculum/${curriculumId}`}>{curriculumName}</Breadcrumbs.Link>
      <Breadcrumbs.Separator />
      <Breadcrumbs.Current>{task.title}</Breadcrumbs.Current>
    </>
  );
}

export default function TopicLayout() {
  const { task, curriculumName } = useLoaderData<typeof loader>();
  const { curriculumId, taskId } = useParams<{ curriculumId: string; taskId: string }>();
  const navigate = useNavigate();
  const { deleteSession } = useTopicSession(taskId!);

  function goBack() {
    void navigate(`/curriculum/${curriculumId}`);
  }

  function startOver() {
    void deleteSession();
    void navigate("choice", { relative: "path" });
  }

  return (
    <>
      <header className="flex items-center gap-4 px-6 py-4 border-b border-border bg-background">
        <Button size="sm" onClick={goBack}>
          <Trans>← Back</Trans>
        </Button>
        <div className="min-w-0">
          <Text variant="heading3" as="h1">
            {task.title}
          </Text>
          <p className="text-xs text-muted-foreground">{curriculumName}</p>
        </div>
        <div className="ml-auto shrink-0">
          <Dialog.Root>
            <Dialog.Trigger
              render={(p) => (
                <Button size="sm" {...p}>
                  <Trans>Start over</Trans>
                </Button>
              )}
            />
            <Dialog size="sm" className="p-8">
              <div className="mb-4">
                <Dialog.Title className="text-xl font-semibold">
                  <Trans>Start over?</Trans>
                </Dialog.Title>
              </div>
              <Dialog.Description className="text-muted-foreground">
                <Trans>Your current progress on this topic will be reset.</Trans>
              </Dialog.Description>
              <div className="mt-6 flex justify-end gap-2">
                <Dialog.Close
                  render={(props) => (
                    <Button variant="secondary" {...props}>
                      <Trans>Cancel</Trans>
                    </Button>
                  )}
                />
                <Dialog.Close
                  render={(props) => (
                    <Button
                      variant="destructive"
                      {...props}
                      onClick={(e) => {
                        startOver();
                        props.onClick?.(e);
                      }}
                    >
                      <Trans>Start over</Trans>
                    </Button>
                  )}
                />
              </div>
            </Dialog>
          </Dialog.Root>
        </div>
      </header>
      <Outlet />
    </>
  );
}
