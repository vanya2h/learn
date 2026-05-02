import { Button } from "@cloudflare/kumo/components/button";
import { Input } from "@cloudflare/kumo/components/input";
import { InputArea } from "@cloudflare/kumo/components/input";
import { LayerCard } from "@cloudflare/kumo/components/layer-card";
import { Loader } from "@cloudflare/kumo/components/loader";
import { Text } from "@cloudflare/kumo/components/text";
import { Trans, useLingui } from "@lingui/react/macro";
import { DetailedError, hc, parseResponse } from "hono/client";
import { useState } from "react";
import { useNavigate, useRevalidator } from "react-router";
import { useRootData } from "../../app/hooks/useRootData";
import type { CurriculumDef } from "../data/types";
import { parseCurriculumDef } from "../data/types";
import { readSSEStream } from "../lib/claude";
import type { Locale } from "../lib/i18n";
import { parseJSON } from "../lib/json";
import type { AppType } from "../server/app";
import { Curriculum } from "./Curriculum";
import { Markdown } from "./Markdown";

const client = hc<AppType>("/");

type BuilderState = "idle" | "generating" | "preview" | "saving";
type InputMode = "url" | "pdf" | null;

export function CurriculumBuilder() {
  const { t } = useLingui();
  const locale = (useRootData()?.locale ?? "en") as Locale;
  const [inputMode, setInputMode] = useState<InputMode>(null);
  const [url, setUrl] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState("");
  const [state, setState] = useState<BuilderState>("idle");
  const [streamText, setStreamText] = useState("");
  const [curriculum, setCurriculum] = useState<CurriculumDef | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { revalidate } = useRevalidator();

  async function generate(feedbackText?: string) {
    setState("generating");
    setStreamText("");
    setCurriculum(null);
    setError(null);

    try {
      const res =
        inputMode === "pdf" && pdfFile
          ? await client.api.curriculums["generate-from-pdf"].$post({
              form: { file: pdfFile, feedback: feedbackText, locale },
            })
          : await client.api.curriculums.generate.$post({
              json: { url, feedback: feedbackText, locale },
            });
      if (!res.ok) await parseResponse(res);
      if (!res.body) {
        setError(t`No response body`);
        setState("idle");
        return;
      }

      let accumulated = "";
      for await (const delta of readSSEStream(res.body)) {
        accumulated += delta;
        setStreamText(accumulated);
      }

      const repaired = parseJSON<unknown>(accumulated);
      const parsed = parseCurriculumDef(repaired);
      if (!parsed) {
        setError(t`Generated curriculum has an invalid shape — try regenerating`);
        setState("idle");
        return;
      }
      setCurriculum(parsed);
      setState("preview");
    } catch (err) {
      const data = err instanceof DetailedError ? (err.detail?.data as { error?: string } | undefined) : undefined;
      setError(data?.error ?? t`Failed to generate curriculum`);
      setState("idle");
    }
  }

  async function save() {
    if (!curriculum) return;
    setState("saving");

    try {
      await parseResponse(
        client.api.curriculums.$post({
          json: {
            name: curriculum.name,
            description: curriculum.description,
            jobUrl: inputMode === "url" ? url : undefined,
            phases: curriculum.phases,
            skills: curriculum.skills,
          },
        }),
      );
      revalidate();
      void navigate("/");
    } catch {
      setError(t`Failed to save`);
      setState("preview");
    }
  }

  function handleRegenerate() {
    void generate(feedback || undefined);
    setFeedback("");
  }

  const disabled = state === "generating" || state === "saving";

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <Text variant="heading2" as="h1">
          <Trans>Create new program</Trans>
        </Text>
      </div>

      {state === "idle" && inputMode === null && <InputModePicker onPick={setInputMode} />}

      {state === "idle" && inputMode === "url" && (
        <UrlInput
          url={url}
          setUrl={setUrl}
          onGenerate={() => void generate()}
          onBack={() => setInputMode(null)}
          disabled={disabled}
        />
      )}

      {state === "idle" && inputMode === "pdf" && (
        <PdfInput
          file={pdfFile}
          setFile={setPdfFile}
          onGenerate={() => void generate()}
          onBack={() => setInputMode(null)}
          disabled={disabled}
        />
      )}

      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {state === "generating" && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Loader size="sm" />
            <span className="text-sm text-muted-foreground">
              <Trans>Generating curriculum...</Trans>
            </span>
          </div>
          <div className="rounded-lg border border-border p-4 bg-muted/30">
            <Markdown>{streamText}</Markdown>
          </div>
        </div>
      )}

      {state === "preview" && curriculum && (
        <div className="mt-6 flex flex-col gap-6">
          <PreviewHeader curriculum={curriculum} />
          <div className="rounded-lg border border-border overflow-hidden">
            <Curriculum curriculum={curriculum} />
          </div>
          <FeedbackSection
            feedback={feedback}
            setFeedback={setFeedback}
            onRegenerate={handleRegenerate}
            onSave={() => void save()}
          />
        </div>
      )}

      {state === "saving" && (
        <div className="mt-6 flex items-center gap-2">
          <Loader size="sm" />
          <span className="text-sm text-muted-foreground">
            <Trans>Saving...</Trans>
          </span>
        </div>
      )}
    </div>
  );
}

function InputModePicker({ onPick }: { onPick: (mode: "url" | "pdf") => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
      <LayerCard
        render={<button onClick={() => onPick("url")} className="text-left cursor-pointer" />}
        className="flex flex-col items-start gap-2 rounded-xl p-5 hover:bg-muted/50 transition-colors"
      >
        <span className="font-semibold text-foreground">
          <Trans>Paste a URL</Trans>
        </span>
        <span className="text-xs text-muted-foreground">
          <Trans>Use a link to the job posting on its company or job-board page</Trans>
        </span>
      </LayerCard>
      <LayerCard
        render={<button onClick={() => onPick("pdf")} className="text-left cursor-pointer" />}
        className="flex flex-col items-start gap-2 rounded-xl p-5 hover:bg-muted/50 transition-colors"
      >
        <span className="font-semibold text-foreground">
          <Trans>Upload a PDF</Trans>
        </span>
        <span className="text-xs text-muted-foreground">
          <Trans>Pick a saved PDF of the job description from your computer</Trans>
        </span>
      </LayerCard>
    </div>
  );
}

function UrlInput({
  url,
  setUrl,
  onGenerate,
  onBack,
  disabled,
}: {
  url: string;
  setUrl: (v: string) => void;
  onGenerate: () => void;
  onBack: () => void;
  disabled: boolean;
}) {
  const { t } = useLingui();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3 w-full">
        <div className="flex-1 grow">
          <Input
            placeholder={t`Paste job posting URL...`}
            value={url}
            className="w-full"
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && url.trim()) onGenerate();
            }}
          />
        </div>
        <Button onClick={onGenerate} disabled={disabled || !url.trim()}>
          <Trans>Generate</Trans>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        <Trans>
          Some sites render their content with JavaScript and cannot be read this way. If generation fails, save the
          page as a PDF in your browser and use the PDF upload option instead.
        </Trans>
      </p>
      <BackLink onClick={onBack} />
    </div>
  );
}

function PdfInput({
  file,
  setFile,
  onGenerate,
  onBack,
  disabled,
}: {
  file: File | null;
  setFile: (f: File | null) => void;
  onGenerate: () => void;
  onBack: () => void;
  disabled: boolean;
}) {
  const { t } = useLingui();
  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center justify-center w-full px-4 py-8 rounded-lg border border-dashed border-border hover:bg-muted/30 cursor-pointer transition-colors">
        <input
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <span className="text-sm text-muted-foreground text-center">
          {file ? file.name : t`Click to choose a PDF file`}
        </span>
      </label>
      <div className="flex justify-end">
        <Button onClick={onGenerate} disabled={disabled || !file}>
          <Trans>Generate</Trans>
        </Button>
      </div>
      <BackLink onClick={onBack} />
    </div>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="self-start text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      <Trans>← Choose another method</Trans>
    </button>
  );
}

function PreviewHeader({ curriculum }: { curriculum: CurriculumDef }) {
  const totalTasks = curriculum.phases.reduce((sum, p) => sum + p.tasks.length, 0);
  const totalMinutes = curriculum.phases.reduce(
    (sum, p) => sum + p.tasks.reduce((s, t) => s + (t.estMinutes ?? 60), 0),
    0,
  );
  const totalHours = Math.round(totalMinutes / 60);

  return (
    <div>
      <div className="mb-1">
        <Text variant="heading3" as="h2">
          {curriculum.name}
        </Text>
      </div>
      {curriculum.description && <p className="text-sm text-muted-foreground mb-2">{curriculum.description}</p>}
      <p className="text-xs text-muted-foreground">
        <Trans>
          {curriculum.phases.length} phases &middot; {totalTasks} tasks &middot; ~{totalHours}h total
        </Trans>
      </p>
    </div>
  );
}

function FeedbackSection({
  feedback,
  setFeedback,
  onRegenerate,
  onSave,
}: {
  feedback: string;
  setFeedback: (v: string) => void;
  onRegenerate: () => void;
  onSave: () => void;
}) {
  const { t } = useLingui();
  return (
    <div className="flex flex-col gap-3">
      <InputArea
        placeholder={t`Optional: describe what to change (e.g. 'add more system design tasks', 'remove the algorithms phase')...`}
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={3}
      />
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onRegenerate}>
          <Trans>Regenerate</Trans>
        </Button>
        <Button onClick={onSave}>
          <Trans>Save program</Trans>
        </Button>
      </div>
    </div>
  );
}
