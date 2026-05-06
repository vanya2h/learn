import { I18nProvider } from "@lingui/react";
import { useEffect } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from "react-router";
import type { Complexity } from "../src/data/types";
import { parseCurriculumDef } from "../src/data/types";
import type { ActiveSession } from "../src/hooks/useProgress";
import { activateLocale, getLocaleFromRequest, i18n } from "../src/lib/i18n";
import { auth } from "../src/server/auth";
import { db } from "../src/server/db";
import type { Route } from "./+types/root";
import "../src/index.css";

export async function loader({ request }: Route.LoaderArgs) {
  const locale = getLocaleFromRequest(request);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return { locale, user: null, progress: null };

  const userId = session.user.id;
  const [completions, activities, startedAt, topicSessions, customCurriculums] = await Promise.all([
    db.taskCompletion.findMany({ where: { userId } }),
    db.dailyActivity.findMany({ where: { userId } }),
    db.appSetting.findUnique({ where: { key_userId: { key: "startedAt", userId } } }),
    db.topicSession.findMany({ where: { userId } }),
    db.customCurriculum.findMany({ where: { userId } }),
  ]);

  return {
    locale,
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
      .map((c) =>
        parseCurriculumDef({
          ...c,
          description: c.description ?? undefined,
          cover: c.cover ?? undefined,
          complexity: (c.complexity as Complexity) ?? "deep",
        }),
      )
      .filter((c) => c !== null),
  };
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <Meta />
        <Links />
        {/* Prevent flash of wrong theme before hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');if(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}})()`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { locale } = useLoaderData<typeof loader>();

  if (i18n.locale !== locale) {
    activateLocale(locale);
  }

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <I18nProvider i18n={i18n}>
      <Outlet />
    </I18nProvider>
  );
}
