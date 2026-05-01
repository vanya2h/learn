import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { parseCurriculumDef } from "../src/data/types";
import type { ActiveSession } from "../src/hooks/useProgress";
import { auth } from "../src/server/auth";
import { db } from "../src/server/db";
import type { Route } from "./+types/root";
import "../src/index.css";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return { user: null, progress: null };

  const userId = session.user.id;
  const [completions, activities, startedAt, topicSessions, customCurriculums] = await Promise.all([
    db.taskCompletion.findMany({ where: { userId } }),
    db.dailyActivity.findMany({ where: { userId } }),
    db.appSetting.findUnique({ where: { key_userId: { key: "startedAt", userId } } }),
    db.topicSession.findMany({ where: { userId } }),
    db.customCurriculum.findMany({ where: { userId } }),
  ]);

  return {
    user: session.user,
    progress: {
      completedTaskIds: Object.fromEntries(completions.map((t) => [t.taskId, t.completedAt.toISOString()])),
      activity: Object.fromEntries(
        activities.map((a) => [a.date, { date: a.date, taskIds: a.taskIds as string[], minutes: a.minutes }]),
      ),
      startedAt: startedAt?.value ?? new Date().toISOString(),
      activeSessions: Object.fromEntries(
        topicSessions.map((s) => {
          const data = s.phaseData as { name: ActiveSession["name"]; partIdx?: number };
          return [s.taskId, { name: data.name, partIdx: data.partIdx }];
        }),
      ),
    },
    customCurriculums: customCurriculums
      .map((c) => parseCurriculumDef({ ...c, description: c.description ?? undefined }))
      .filter((c) => c !== null),
  };
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        {/* Prevent flash of wrong theme before hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');if(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}})()`,
          }}
        />
      </head>
      <body className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
