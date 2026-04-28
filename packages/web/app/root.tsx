import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { auth } from "../src/server/auth";
import { db } from "../src/server/db";
import type { Route } from "./+types/root";
import "../src/index.css";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return { user: null, progress: null };

  const userId = session.user.id;
  const [completions, activities, specializations, startedAt] = await Promise.all([
    db.taskCompletion.findMany({ where: { userId } }),
    db.dailyActivity.findMany({ where: { userId } }),
    db.specialization.findMany({ where: { userId } }),
    db.appSetting.findUnique({ where: { key_userId: { key: "startedAt", userId } } }),
  ]);

  return {
    user: session.user,
    progress: {
      completedTaskIds: Object.fromEntries(completions.map((t) => [t.taskId, t.completedAt.toISOString()])),
      activity: Object.fromEntries(
        activities.map((a) => [a.date, { date: a.date, taskIds: a.taskIds as string[], minutes: a.minutes }]),
      ),
      specializations: Object.fromEntries(specializations.map((s) => [s.curriculumId, s.branch])) as Record<
        string,
        string | null
      >,
      startedAt: startedAt?.value ?? new Date().toISOString(),
    },
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
