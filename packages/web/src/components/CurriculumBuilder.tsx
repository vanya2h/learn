import { Button } from "@cloudflare/kumo/components/button";
import { Input } from "@cloudflare/kumo/components/input";
import { InputArea } from "@cloudflare/kumo/components/input";
import { Loader } from "@cloudflare/kumo/components/loader";
import { Text } from "@cloudflare/kumo/components/text";
import { hc } from "hono/client";
import { useState } from "react";
import { useNavigate, useRevalidator } from "react-router";
import type { CurriculumDef } from "../data/types";
import { parseCurriculumDef } from "../data/types";
import { parseJSON } from "../lib/json";
import type { AppType } from "../server/app";
import { Curriculum } from "./Curriculum";
import { Markdown } from "./Markdown";

const client = hc<AppType>("/");

type BuilderState = "idle" | "generating" | "preview" | "saving";

export function CurriculumBuilder() {
  const [url, setUrl] = useState("");
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
      const res = await client.api.curriculums.generate.$post({
        json: { url, feedback: feedbackText },
      });

      if (!res.ok) {
        const body = await res.json();
        setError((body as { error?: string }).error ?? "Generation failed");
        setState("idle");
        return;
      }

      if (!res.body) {
        setError("No response body");
        setState("idle");
        return;
      }

      let accumulated = "";
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            accumulated += JSON.parse(line.slice(6)) as string;
            setStreamText(accumulated);
          }
        }
      }

      const repaired = parseJSON<unknown>(accumulated);
      const parsed = parseCurriculumDef(repaired);
      if (!parsed) {
        setError("Generated curriculum has an invalid shape — try regenerating");
        setState("idle");
        return;
      }
      setCurriculum(parsed);
      setState("preview");
    } catch {
      setError("Failed to generate curriculum");
      setState("idle");
    }
  }

  async function save() {
    if (!curriculum) return;
    setState("saving");

    try {
      const res = await client.api.curriculums.$post({
        json: {
          name: curriculum.name,
          description: curriculum.description,
          jobUrl: url,
          phases: curriculum.phases,
          skills: curriculum.skills,
        },
      });

      if (!res.ok) {
        setError("Failed to save");
        setState("preview");
        return;
      }

      revalidate();
      void navigate("/");
    } catch {
      setError("Failed to save");
      setState("preview");
    }
  }

  function handleRegenerate() {
    void generate(feedback || undefined);
    setFeedback("");
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <Text variant="heading2" as="h1">
          Create new program
        </Text>
      </div>

      <UrlInput
        url={url}
        setUrl={setUrl}
        onGenerate={() => void generate()}
        disabled={state === "generating" || state === "saving"}
      />

      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {state === "generating" && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Loader size="sm" />
            <span className="text-sm text-muted-foreground">Generating curriculum...</span>
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
          <span className="text-sm text-muted-foreground">Saving...</span>
        </div>
      )}
    </div>
  );
}

function UrlInput({
  url,
  setUrl,
  onGenerate,
  disabled,
}: {
  url: string;
  setUrl: (v: string) => void;
  onGenerate: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex gap-3 w-full">
      <div className="flex-1 grow">
        <Input
          placeholder="Paste job posting URL..."
          value={url}
          className="w-full"
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && url.trim()) onGenerate();
          }}
        />
      </div>
      <Button onClick={onGenerate} disabled={disabled || !url.trim()}>
        Generate
      </Button>
    </div>
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
        {curriculum.phases.length} phases &middot; {totalTasks} tasks &middot; ~{totalHours}h total
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
  return (
    <div className="flex flex-col gap-3">
      <InputArea
        placeholder="Optional: describe what to change (e.g. 'add more system design tasks', 'remove the algorithms phase')..."
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={3}
      />
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onRegenerate}>
          Regenerate
        </Button>
        <Button onClick={onSave}>Save program</Button>
      </div>
    </div>
  );
}
