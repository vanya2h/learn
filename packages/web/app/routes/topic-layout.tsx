import { useState } from "react";
import { Link, Outlet, redirect, useLoaderData, useNavigate, useParams, useRouteLoaderData } from "react-router";
import { ProgramCover } from "../../src/components/ProgramCover";
import { TopicActionBarSlotContext } from "../../src/components/TopicActionBar";
import { TopicHeader } from "../../src/components/TopicHeader";
import { TopicSidebar } from "../../src/components/TopicSidebar";
import { listCurriculums } from "../../src/data/curriculum";
import type { CurriculumDef } from "../../src/data/types";
import { parseCurriculumDef } from "../../src/data/types";
import { useProgress } from "../../src/hooks/useProgress";
import { useTopicSession } from "../../src/hooks/useTopicSession";
import type { BreadcrumbHandle } from "../../src/lib/breadcrumbs";
import { getLocaleFromRequest } from "../../src/lib/i18n";
import { parsePersistedPhase } from "../../src/lib/phase";
import { db } from "../../src/server/db";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/topic-layout";

import { GridBackground } from "~/components/GridBg";
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "~/components/ui/breadcrumb";

const PHASE_TO_STAGE_INDEX: Record<string, number> = {
  assessing: 1,
  "gaps-review": 2,
  study: 3,
  "hands-on": 4,
  feedback: 5,
  "write-up": 6,
};

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
        if (t.id === taskId) {
          return { task: t, curriculumName: c.name, phaseTitle: p.title, complexity: c.complexity, cover: c.cover };
        }
      }
    }
  }
  return null;
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireSession(request);

  const locale = getLocaleFromRequest(request);
  let taskInfo = findTask(listCurriculums(locale), params.taskId);

  if (!taskInfo) {
    const custom = await db.customCurriculum.findMany({ where: { userId: session.user.id } });
    const customCurriculums = custom
      .map((c) => parseCurriculumDef({ ...c, description: c.description ?? undefined }))
      .filter((c) => c !== null);
    taskInfo = findTask(customCurriculums, params.taskId);
  }

  if (!taskInfo) return redirect(`/curriculum/${params.curriculumId}`);

  const record = await db.topicSession.findUnique({
    where: { userId_taskId: { userId: session.user.id, taskId: params.taskId } },
  });
  const phase = parsePersistedPhase(record?.phaseData);
  const highestStage = phase ? (PHASE_TO_STAGE_INDEX[phase.name] ?? 0) : 0;

  return { ...taskInfo, highestStage };
}

export const handle: BreadcrumbHandle = {
  breadcrumb: () => <TopicBreadcrumb />,
};

function TopicBreadcrumb() {
  const data = useRouteLoaderData<typeof loader>("routes/topic-layout");
  const { curriculumId } = useParams<{ curriculumId: string }>();
  if (!data) return null;
  const { curriculumName, phaseTitle } = data;
  return (
    <>
      <BreadcrumbItem>
        <BreadcrumbLink render={<Link to={`/curriculum/${curriculumId}`} />}>{curriculumName}</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem className="text-muted-foreground">
        <span className="truncate">{phaseTitle}</span>
      </BreadcrumbItem>
    </>
  );
}

export default function TopicLayout() {
  const { task, curriculumName, highestStage, cover } = useLoaderData<typeof loader>();
  const { taskId } = useParams<{ curriculumId: string; taskId: string }>();
  const navigate = useNavigate();
  const { deleteSession } = useTopicSession(taskId!);
  const { completedTaskIds } = useProgress();
  const [actionBarSlot, setActionBarSlot] = useState<HTMLElement | null>(null);

  const taskCompleted = !!completedTaskIds[taskId!];

  function startOver() {
    void deleteSession();
    void navigate("choice", { relative: "path" });
  }

  return (
    <TopicActionBarSlotContext value={actionBarSlot}>
      <TopicHeader taskTitle={task.title} curriculumName={curriculumName} onStartOver={startOver} />
      <div className="flex flex-1">
        <TopicSidebar highestStage={highestStage} taskCompleted={taskCompleted} />
        <div className="flex-1 min-w-0 border-l border-border flex flex-col relative">
          {cover && (
            <div className="absolute inset-0">
              <ProgramCover shape="wave" preset={cover} />
            </div>
          )}
          <div className="relative grow backdrop-blur-xl bg-background/90 flex flex-col">
            <GridBackground />
            <div className="flex-1 flex flex-col">
              <Outlet />
            </div>
            <div ref={setActionBarSlot} className="sticky bottom-0 z-10 shrink-0" />
          </div>
        </div>
      </div>
    </TopicActionBarSlotContext>
  );
}
