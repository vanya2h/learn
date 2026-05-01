import { redirect } from "react-router";
import { parsePersistedPhase, PHASE_ROUTES } from "../../src/lib/phase";
import { db } from "../../src/server/db";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/topic.index";

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireSession(request);
  const record = await db.topicSession.findUnique({
    where: { userId_taskId: { userId: session.user.id, taskId: params.taskId } },
  });

  if (!record) return redirect("choice");

  const phase = parsePersistedPhase(record.phaseData);
  if (!phase) return redirect("choice");
  return redirect(PHASE_ROUTES[phase.name] ?? "choice");
}
