import { useLingui } from "@lingui/react/macro";
import { DetailedError, hc, parseResponse } from "hono/client";
import { useState } from "react";
import { useNavigate, useRevalidator } from "react-router";
import { useRootData } from "../../../app/hooks/useRootData";
import type { CurriculumOutline, Phase, Task } from "../../data/types";
import { parseCurriculumOutline, parsePhase } from "../../data/types";
import { readSSEStream } from "../../lib/claude";
import type { Locale } from "../../lib/i18n";
import { parseJSON } from "../../lib/json";
import type { AppType } from "../../server/app";

const client = hc<AppType>("/");

export type BuilderStep = "idle" | "extracting" | "generating-outline" | "outline-review" | "phase-view" | "saving";
export type InputMode = "url" | "pdf" | null;

export function useCurriculumBuilder() {
  const { t } = useLingui();
  const locale = (useRootData()?.locale ?? "en") as Locale;
  const [step, setStep] = useState<BuilderStep>("idle");
  const [inputMode, setInputMode] = useState<InputMode>(null);
  const [url, setUrl] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState("");
  const [outline, setOutline] = useState<CurriculumOutline | null>(null);
  const [selectedPhaseIds, setSelectedPhaseIds] = useState<string[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [generatedPhases, setGeneratedPhases] = useState<Record<string, Phase>>({});
  const [generatingPhaseId, setGeneratingPhaseId] = useState<string | null>(null);
  const [streamedTasks, setStreamedTasks] = useState<Task[]>([]);
  const [phaseFeedback, setPhaseFeedback] = useState("");
  const [deselectedTaskIds, setDeselectedTaskIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { revalidate } = useRevalidator();

  async function start() {
    setError(null);
    setOutline(null);
    setSelectedPhaseIds([]);
    setGeneratedPhases({});
    setGeneratingPhaseId(null);
    setDeselectedTaskIds(new Set());
    setStep("extracting");

    try {
      const extracted =
        inputMode === "pdf" && pdfFile
          ? await parseResponse(client.api.curriculums["extract-pdf"].$post({ form: { file: pdfFile } }))
          : await parseResponse(client.api.curriculums.extract.$post({ json: { url } }));

      const text = extracted.text;
      setTextContent(text);
      await generateOutline(text, undefined);
    } catch (err) {
      const data = err instanceof DetailedError ? (err.detail?.data as { error?: string } | undefined) : undefined;
      setError(data?.error ?? t`Failed to extract job posting`);
      setStep("idle");
    }
  }

  async function generateOutline(text: string, feedback: string | undefined) {
    setStep("generating-outline");
    setError(null);

    try {
      const res = await client.api.curriculums["generate-outline"].$post({
        json: { textContent: text, feedback, locale },
      });
      if (!res.ok) await parseResponse(res);
      if (!res.body) throw new Error("No response body");

      let accumulated = "";
      for await (const delta of readSSEStream(res.body)) {
        accumulated += delta;
      }

      const parsed = parseCurriculumOutline(parseJSON<unknown>(accumulated));
      if (!parsed) {
        setError(t`Couldn't parse the curriculum outline — try regenerating`);
        setStep("idle");
        return;
      }

      setOutline(parsed);
      setSelectedPhaseIds(parsed.phases.map((p) => p.id));
      setGeneratedPhases({});
      setCurrentPageIndex(0);
      setStep("outline-review");
    } catch (err) {
      const data = err instanceof DetailedError ? (err.detail?.data as { error?: string } | undefined) : undefined;
      setError(data?.error ?? t`Failed to generate outline`);
      setStep("idle");
    }
  }

  async function generatePhase(phaseId: string, currentGenerated: Record<string, Phase>, feedback?: string) {
    if (!outline) return;
    const phaseIndex = outline.phases.findIndex((p) => p.id === phaseId);
    if (phaseIndex === -1) return;

    const completedPhasesForContext = outline.phases
      .filter((p) => p.id !== phaseId && currentGenerated[p.id])
      .map((p) => currentGenerated[p.id]!);

    setGeneratingPhaseId(phaseId);
    setStreamedTasks([]);
    setGeneratedPhases((prev) => {
      const next = { ...prev };
      delete next[phaseId];
      return next;
    });
    setError(null);

    try {
      const res = await client.api.curriculums["generate-phase"].$post({
        json: {
          textContent,
          outline,
          phaseIndex,
          completedPhases: completedPhasesForContext,
          feedback,
          locale,
        },
      });
      if (!res.ok) await parseResponse(res);
      if (!res.body) throw new Error("No response body");

      let accumulated = "";
      for await (const delta of readSSEStream(res.body)) {
        accumulated += delta;
        try {
          const partial = parsePhase(parseJSON<unknown>(accumulated));
          if (partial?.tasks.length) setStreamedTasks(partial.tasks);
        } catch {
          // partial stream not yet parseable
        }
      }

      const parsed = parsePhase(parseJSON<unknown>(accumulated));
      if (!parsed) {
        setError(t`Couldn't parse the generated phase — try regenerating`);
        setGeneratingPhaseId(null);
        return;
      }

      setGeneratedPhases((prev) => ({ ...prev, [phaseId]: parsed }));
      setGeneratingPhaseId(null);
    } catch (err) {
      const data = err instanceof DetailedError ? (err.detail?.data as { error?: string } | undefined) : undefined;
      setError(data?.error ?? t`Failed to generate phase`);
      setGeneratingPhaseId(null);
    }
  }

  function handleStartGenerating() {
    if (selectedPhaseIds.length === 0 || !outline) return;
    const freshGenerated: Record<string, Phase> = {};
    setGeneratedPhases(freshGenerated);
    setCurrentPageIndex(0);
    setStep("phase-view");
    void generatePhase(selectedPhaseIds[0]!, freshGenerated);
  }

  function handleNavigateTo(pageIndex: number, currentGenerated: Record<string, Phase>) {
    const selectedPhases = outline?.phases.filter((p) => selectedPhaseIds.includes(p.id)) ?? [];
    const phaseId = selectedPhases[pageIndex]?.id;
    setCurrentPageIndex(pageIndex);
    setPhaseFeedback("");
    if (phaseId && !currentGenerated[phaseId] && !generatingPhaseId) {
      void generatePhase(phaseId, currentGenerated);
    }
  }

  function handleRegenerate(currentGenerated: Record<string, Phase>) {
    const selectedPhases = outline?.phases.filter((p) => selectedPhaseIds.includes(p.id)) ?? [];
    const phaseId = selectedPhases[currentPageIndex]?.id;
    if (!phaseId) return;
    void generatePhase(phaseId, currentGenerated, phaseFeedback || undefined);
    setPhaseFeedback("");
  }

  function togglePhase(phaseId: string) {
    setSelectedPhaseIds((prev) => (prev.includes(phaseId) ? prev.filter((id) => id !== phaseId) : [...prev, phaseId]));
  }

  function toggleTask(taskId: string) {
    setDeselectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  async function save() {
    if (!outline || selectedPhaseIds.length === 0) return;
    setStep("saving");

    const phasesToSave = outline.phases
      .filter((p) => selectedPhaseIds.includes(p.id) && generatedPhases[p.id])
      .map((p) => ({
        ...generatedPhases[p.id]!,
        tasks: generatedPhases[p.id]!.tasks.filter((t) => !deselectedTaskIds.has(t.id)),
      }))
      .filter((p) => p.tasks.length > 0);

    try {
      await parseResponse(
        client.api.curriculums.$post({
          json: {
            name: outline.name,
            description: outline.description,
            jobUrl: inputMode === "url" ? url : undefined,
            phases: phasesToSave,
            skills: outline.skills,
          },
        }),
      );
      revalidate();
      void navigate("/");
    } catch {
      setError(t`Failed to save`);
      setStep("phase-view");
    }
  }

  function startOver() {
    setStep("idle");
    setOutline(null);
    setSelectedPhaseIds([]);
    setGeneratedPhases({});
    setGeneratingPhaseId(null);
    setError(null);
    setPhaseFeedback("");
    setDeselectedTaskIds(new Set());
  }

  const selectedPhases = outline?.phases.filter((p) => selectedPhaseIds.includes(p.id)) ?? [];

  return {
    step,
    inputMode,
    url,
    setUrl,
    pdfFile,
    setPdfFile,
    setInputMode,
    outline,
    selectedPhaseIds,
    currentPageIndex,
    generatedPhases,
    generatingPhaseId,
    streamedTasks,
    phaseFeedback,
    setPhaseFeedback,
    deselectedTaskIds,
    error,
    selectedPhases,
    start,
    handleStartGenerating,
    handleNavigateTo,
    handleRegenerate,
    togglePhase,
    toggleTask,
    save,
    startOver,
  };
}
