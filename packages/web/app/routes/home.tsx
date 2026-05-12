import { redirect } from "react-router";
import { Dashboard } from "../../src/components/Dashboard";
import { getProfileRoute } from "../../src/lib/routes";
import { auth } from "../../src/server/auth";
import { db } from "../../src/server/db";
import type { Route } from "./+types/home";

export function meta(): Route.MetaDescriptors {
  return [
    { title: "Dashboard — Sheafu" },
    { name: "description", content: "Track your learning progress and manage your curriculum." },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return null;

  const userId = session.user.id;
  const [user, profile] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { onboardingSkipped: true } }),
    db.userProfile.findUnique({ where: { userId }, select: { markdown: true } }),
  ]);

  const hasProfile = !!profile && profile.markdown.trim().length > 0;
  const skipped = user?.onboardingSkipped ?? false;
  if (!hasProfile && !skipped) {
    throw redirect(getProfileRoute());
  }
  return null;
}

export default function HomePage() {
  return <Dashboard />;
}
