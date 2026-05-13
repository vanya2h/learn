import { redirect } from "react-router";
import type { Route } from "./+types/curriculum.draft.index";

import { parseCurriculumOutline } from "~/data/types";
import { getCurriculumLinks } from "~/lib/routes";
import { db } from "~/server/db";
import { requireSession } from "~/server/session";

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireSession(request);
  const draft = await db.customCurriculum.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  const links = getCurriculumLinks();
  if (!draft) throw redirect(links.new);

  if (draft.status === "published") throw redirect(links.byId(draft.id));

  const draftLinks = links.draft(draft.id);
  const outline = parseCurriculumOutline(draft.outline);
  if (!outline) throw redirect(draftLinks.outline);

  const generatedPhases = (draft.generatedPhases ?? {}) as Record<string, unknown>;
  const selections = parseSelections(draft.selections);
  const selectedPhaseIds = selections?.selectedPhaseIds ?? [];
  const orderedSelected = outline.phases.filter((p) => selectedPhaseIds.includes(p.id));

  if (orderedSelected.length === 0) throw redirect(draftLinks.outline);

  const allGenerated = orderedSelected.every((p) => generatedPhases[p.id]);
  const target = allGenerated
    ? (orderedSelected[orderedSelected.length - 1] ?? null)
    : (orderedSelected.find((p) => !generatedPhases[p.id]) ?? orderedSelected[0] ?? null);

  if (target) throw redirect(draftLinks.phases(target.id));
  throw redirect(draftLinks.outline);
}

function parseSelections(value: unknown): { selectedPhaseIds: string[] } | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (!Array.isArray(v.selectedPhaseIds)) return null;
  return { selectedPhaseIds: v.selectedPhaseIds.filter((s): s is string => typeof s === "string") };
}

export default function DraftIndex() {
  return null;
}
