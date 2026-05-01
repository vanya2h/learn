import { Button } from "@cloudflare/kumo/components/button";
import { Dialog } from "@cloudflare/kumo/components/dialog";
import { Text } from "@cloudflare/kumo/components/text";
import { Outlet, useLoaderData, useNavigate, useParams } from "react-router";
import { redirect } from "react-router";
import { CURRICULUMS } from "../../src/data/curriculum";
import { useTopicSession } from "../../src/hooks/useTopicSession";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/topic-layout";

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireSession(request);
  for (const c of CURRICULUMS) {
    for (const p of c.phases) {
      for (const t of p.tasks) {
        if (t.id === params.taskId) {
          return { task: t, curriculumName: c.name };
        }
      }
    }
  }
  return redirect(`/curriculum/${params.curriculumId}`);
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
          ← Back
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
                  Start over
                </Button>
              )}
            />
            <Dialog size="sm" className="p-8">
              <div className="mb-4">
                <Dialog.Title className="text-xl font-semibold">Start over?</Dialog.Title>
              </div>
              <Dialog.Description className="text-muted-foreground">
                Your current progress on this topic will be reset.
              </Dialog.Description>
              <div className="mt-6 flex justify-end gap-2">
                <Dialog.Close
                  render={(props) => (
                    <Button variant="secondary" {...props}>
                      Cancel
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
                      Start over
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
