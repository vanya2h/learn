import { Trans, useLingui } from "@lingui/react/macro";
import { DetailedError, parseResponse } from "hono/client";
import { useState } from "react";
import { Link, useLoaderData, useNavigate } from "react-router";
import { BuilderActionBarSlotContext } from "../../src/components/CurriculumBuilder/BuilderActionBar";
import { InputStep, type InputStepValues } from "../../src/components/CurriculumBuilder/InputStep";
import { GridBackground } from "../../src/components/GridBg";
import { ProgramCover } from "../../src/components/ProgramCover";
import { TopicContainer } from "../../src/components/TopicContainer";
import { apiClient } from "../../src/lib/apiClient";
import type { BreadcrumbHandle } from "../../src/lib/breadcrumbs";
import { generateGradient, type GradientCover, GradientCoverSchema } from "../../src/lib/gradient";
import { getCurriculumLinks } from "../../src/lib/routes";
import { db } from "../../src/server/db";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/curriculum.new";

import { Card } from "~/components/Card";
import { BreadcrumbItem, BreadcrumbPage } from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export function meta(): Route.MetaDescriptors {
  return [
    { title: "New Program — Learning Tracker" },
    { name: "description", content: "Build a custom learning curriculum powered by AI." },
  ];
}

export const handle: BreadcrumbHandle = {
  breadcrumb: () => (
    <BreadcrumbItem>
      <BreadcrumbPage>
        <Trans>New program</Trans>
      </BreadcrumbPage>
    </BreadcrumbItem>
  ),
};

type DraftSummary = {
  id: string;
  name: string;
  description: string | null;
  cover: GradientCover | null;
  complexity: string;
  jobUrl: string | null;
  hasOutline: boolean;
  updatedAt: string;
};

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request);
  const drafts = await db.customCurriculum.findMany({
    where: { userId: session.user.id, status: "draft" },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      cover: true,
      complexity: true,
      jobUrl: true,
      outline: true,
      updatedAt: true,
    },
  });

  const summaries: DraftSummary[] = drafts.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    cover: GradientCoverSchema.safeParse(d.cover).data ?? null,
    complexity: d.complexity,
    jobUrl: d.jobUrl,
    hasOutline: d.outline !== null,
    updatedAt: d.updatedAt.toISOString(),
  }));

  return { drafts: summaries };
}

export default function NewCurriculumPage() {
  const { drafts } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const { t } = useLingui();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cover] = useState<GradientCover>(generateGradient);
  const [actionBarSlot, setActionBarSlot] = useState<HTMLElement | null>(null);

  async function handleGenerate(values: InputStepValues) {
    setGenerating(true);
    setError(null);
    try {
      const json: {
        inputMode: "url" | "pdf";
        complexity: typeof values.complexity;
        url?: string;
        textContent?: string;
        cover: GradientCover;
      } = {
        inputMode: values.inputMode,
        complexity: values.complexity,
        cover,
      };

      if (values.inputMode === "url") {
        json.url = values.url;
      } else {
        json.textContent = await extractPdfTextOnClient(values.file);
        if (!json.textContent || json.textContent.length < 100) {
          setError(t`Couldn't extract text from this PDF — try another file.`);
          setGenerating(false);
          return;
        }
      }

      const result = await parseResponse(apiClient.api.curriculums.drafts.$post({ json }));
      void navigate(getCurriculumLinks().draft(result.id).outline);
    } catch (err) {
      const data = err instanceof DetailedError ? (err.detail?.data as { error?: string } | undefined) : undefined;
      setError(data?.error ?? t`Failed to start a new program`);
      setGenerating(false);
    }
  }

  return (
    <BuilderActionBarSlotContext value={actionBarSlot}>
      <div className="relative flex flex-1 flex-col grow">
        <div className="absolute inset-0">
          <ProgramCover shape="wave" preset={cover} />
        </div>
        <div className="relative grow flex flex-col">
          <GridBackground />
          <TopicContainer className="py-8 mt-[8vh] grow">
            {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

            <InputStep onGenerate={(values) => void handleGenerate(values)} generating={generating} />

            {drafts.length > 0 && (
              <section className="mt-12">
                <Card.List>
                  <Card.Entry>
                    <Card.Heading>
                      <Trans>Drafts in progress</Trans>
                    </Card.Heading>
                  </Card.Entry>
                  {drafts.map((draft) => (
                    <Card.Entry key={draft.id} className="p-0 last:pb-0">
                      <Link
                        to={getCurriculumLinks().draft(draft.id).index}
                        className={cn(
                          "block px-6 py-4 transition-[background-color] duration-300 ease-out",
                          "hover:bg-card-hover focus-visible:outline-none focus-visible:bg-card-hover",
                        )}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-base font-semibold tracking-[-0.01em] text-foreground truncate">
                              {draft.name || <Trans>Untitled draft</Trans>}
                            </p>
                            {draft.description && (
                              <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{draft.description}</p>
                            )}
                            <p className="mt-1 font-mono text-[11px] tracking-[0.04em] text-foreground/40 tabular-nums">
                              {draft.hasOutline ? <Trans>Phases pending</Trans> : <Trans>Outline pending</Trans>}
                              {" · "}
                              {draft.complexity}
                            </p>
                          </div>
                          <Button variant="secondary" size="sm" tabIndex={-1} className="shrink-0">
                            <Trans>Resume</Trans>
                          </Button>
                        </div>
                      </Link>
                    </Card.Entry>
                  ))}
                </Card.List>
              </section>
            )}
          </TopicContainer>
          <div ref={setActionBarSlot} className="sticky bottom-0 z-10 shrink-0" />
        </div>
      </div>
    </BuilderActionBarSlotContext>
  );
}

async function extractPdfTextOnClient(file: File): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const buffer = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocumentProxy(buffer);
  const { text } = await extractText(pdf, { mergePages: true });
  return text.replace(/\s+/g, " ").trim().slice(0, 15000);
}
