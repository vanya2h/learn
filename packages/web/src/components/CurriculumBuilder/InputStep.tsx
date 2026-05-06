import { Trans, useLingui } from "@lingui/react/macro";
import type { Complexity } from "../../data/types";
import { MethodPicker } from "./methods/MethodPicker";
import type { InputMode } from "./useCurriculumBuilder";

import { Button } from "~/components/ui/button";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { cn } from "~/lib/utils";

type InputStepProps = {
  method: InputMode;
  setMethod: (m: InputMode) => void;
  url: string;
  setUrl: (v: string) => void;
  file: File | null;
  setFile: (f: File | null) => void;
  complexity: Complexity;
  setComplexity: (v: Complexity) => void;
  onGenerate: () => void;
};

export function InputStep({
  method,
  setMethod,
  url,
  setUrl,
  file,
  setFile,
  complexity,
  setComplexity,
  onGenerate,
}: InputStepProps) {
  const canGenerate = method !== null;

  function handleUrlChange(v: string) {
    setUrl(v);
    if (v.trim()) {
      if (file) setFile(null);
      if (method !== "url") setMethod("url");
    } else if (method === "url") {
      setMethod(null);
    }
  }

  function handleFileChange(f: File | null) {
    setFile(f);
    if (f) {
      if (url) setUrl("");
      if (method !== "pdf") setMethod("pdf");
    } else if (method === "pdf") {
      setMethod(null);
    }
  }

  function submit() {
    if (canGenerate) onGenerate();
  }

  return (
    <div className="flex w-full flex-col gap-7">
      <MethodPicker
        url={url}
        onUrlChange={handleUrlChange}
        file={file}
        onFileChange={handleFileChange}
        activeMethod={method}
        onSubmit={submit}
      />

      <DepthRow depth={complexity} setDepth={setComplexity} enabled={canGenerate} />

      <div className="flex items-center justify-end">
        <Button type="button" size="lg" onClick={submit} disabled={!canGenerate}>
          <Trans>Generate program →</Trans>
        </Button>
      </div>
    </div>
  );
}

function DepthRow({
  depth,
  setDepth,
  enabled,
}: {
  depth: Complexity;
  setDepth: (d: Complexity) => void;
  enabled: boolean;
}) {
  const { t } = useLingui();

  const opts: { value: Complexity; label: string; description: string }[] = [
    { value: "easy", label: t`Easy`, description: t`2–3 key phases · easy reading & practice` },
    { value: "medium", label: t`Medium`, description: t`3–6 phases · balanced reading & practice` },
    { value: "deep", label: t`Deep`, description: t`5–9 phases · full depth with open-ended builds` },
  ];

  return (
    <div className={cn("transition-opacity duration-300", enabled ? "opacity-100" : "pointer-events-none opacity-45")}>
      <div className="mb-2.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/40">
        <Trans>Depth</Trans>
        {!enabled && (
          <span className="text-[11px] tracking-normal text-foreground/30 normal-case">
            · <Trans>paste a URL or pick a PDF above to choose</Trans>
          </span>
        )}
      </div>
      <RadioGroup
        value={depth}
        onValueChange={(v) => setDepth(v as Complexity)}
        disabled={!enabled}
        className="grid grid-cols-1 gap-2.5 sm:grid-cols-3"
      >
        {opts.map((o) => {
          const active = depth === o.value;
          return (
            <label
              key={o.value}
              className={cn(
                "rounded-lg border px-4 py-3.5 text-left transition-[background-color,border-color] duration-200",
                active
                  ? "border-border-active bg-muted"
                  : "border-border bg-background-layer hover:border-border-hover",
                enabled ? "cursor-pointer" : "cursor-not-allowed",
              )}
            >
              <div className="mb-1 flex items-center gap-2">
                <RadioGroupItem value={o.value} />
                <span className="font-semibold text-foreground">{o.label}</span>
              </div>
              <p className="pl-6 text-[12px] leading-normal text-muted-foreground">{o.description}</p>
            </label>
          );
        })}
      </RadioGroup>
    </div>
  );
}
