import { zodResolver } from "@hookform/resolvers/zod";
import { Trans, useLingui } from "@lingui/react/macro";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { type Complexity, COMPLEXITY_LEVELS } from "../../data/types";
import { Card } from "../Card";
import { MethodPicker } from "./methods/MethodPicker";
import { BuilderActionBar } from "./BuilderActionBar";

import { Button } from "~/components/ui/button";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { cn } from "~/lib/utils";

const inputSchema = z
  .object({
    inputMode: z.enum(["url", "pdf"]).nullable(),
    url: z.string(),
    file: z.instanceof(File).nullable(),
    complexity: z.enum(COMPLEXITY_LEVELS),
  })
  .superRefine((data, ctx) => {
    if (data.inputMode === null) {
      ctx.addIssue({ code: "custom", path: ["inputMode"], message: "Choose URL or PDF" });
      return;
    }
    if (data.inputMode === "url" && !isValidHttpUrl(data.url)) {
      ctx.addIssue({
        code: "custom",
        path: ["url"],
        message: "Enter a full URL starting with http:// or https://",
      });
    }
    if (data.inputMode === "pdf" && !data.file) {
      ctx.addIssue({ code: "custom", path: ["file"], message: "Please upload a PDF" });
    }
  });

type InputFormValues = z.infer<typeof inputSchema>;

export type InputStepValues =
  | { inputMode: "url"; url: string; complexity: Complexity }
  | { inputMode: "pdf"; file: File; complexity: Complexity };

function isValidHttpUrl(value: string): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.hostname.includes(".");
  } catch {
    return false;
  }
}

export type InputStepProps = {
  defaultComplexity?: Complexity;
  generating?: boolean;
  onGenerate: (values: InputStepValues) => void;
};

export function InputStep({ defaultComplexity = "medium", generating = false, onGenerate }: InputStepProps) {
  const form = useForm<InputFormValues>({
    resolver: zodResolver(inputSchema),
    mode: "onChange",
    defaultValues: { inputMode: null, url: "", file: null, complexity: defaultComplexity },
  });

  const {
    handleSubmit,
    setValue,
    control,
    formState: { isValid, errors, touchedFields },
  } = form;

  const watchedMode = useWatch({ control, name: "inputMode" });
  const watchedUrl = useWatch({ control, name: "url" });
  const watchedFile = useWatch({ control, name: "file" });
  const watchedComplexity = useWatch({ control, name: "complexity" });

  function handleUrlChange(v: string) {
    setValue("url", v, { shouldValidate: true, shouldTouch: true });
    if (v.trim()) {
      if (watchedFile) setValue("file", null);
      if (watchedMode !== "url") setValue("inputMode", "url", { shouldValidate: true });
    } else if (watchedMode === "url") {
      setValue("inputMode", null, { shouldValidate: true });
    }
  }

  function handleFileChange(f: File | null) {
    setValue("file", f, { shouldValidate: true, shouldTouch: true });
    if (f) {
      if (watchedUrl) setValue("url", "");
      if (watchedMode !== "pdf") setValue("inputMode", "pdf", { shouldValidate: true });
    } else if (watchedMode === "pdf") {
      setValue("inputMode", null, { shouldValidate: true });
    }
  }

  function handleComplexityChange(v: Complexity) {
    setValue("complexity", v, { shouldValidate: true });
  }

  const urlError = touchedFields.url ? errors.url?.message : undefined;

  const submit = handleSubmit((data) => {
    if (data.inputMode === "url") {
      onGenerate({ inputMode: "url", url: data.url, complexity: data.complexity });
    } else if (data.inputMode === "pdf" && data.file) {
      onGenerate({ inputMode: "pdf", file: data.file, complexity: data.complexity });
    }
  });

  return (
    <form
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey && (e.target as HTMLElement).tagName === "INPUT") {
          e.preventDefault();
          void submit();
        }
      }}
      className="flex w-full flex-col gap-4"
    >
      <Card.List>
        <MethodPicker
          url={watchedUrl}
          onUrlChange={handleUrlChange}
          urlError={urlError}
          file={watchedFile}
          onFileChange={handleFileChange}
          activeMethod={watchedMode}
        />

        <DepthRow depth={watchedComplexity} setDepth={handleComplexityChange} enabled={isValid} />
      </Card.List>

      <BuilderActionBar>
        <Button className="ml-auto" type="button" onClick={() => void submit()} disabled={!isValid || generating}>
          <Trans>Generate program →</Trans>
        </Button>
      </BuilderActionBar>
    </form>
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
    { value: "easy", label: t`Easy`, description: t`2-3 key phases · easy reading & practice` },
    { value: "medium", label: t`Medium`, description: t`3-6 phases · balanced reading & practice` },
    { value: "deep", label: t`Deep`, description: t`5-9 phases · full depth with open-ended builds` },
  ];

  return (
    <Card.Entry
      className={cn(
        "p-0 last:pb-0 transition-opacity duration-300",
        enabled ? "opacity-100" : "pointer-events-none opacity-45",
      )}
    >
      <RadioGroup
        value={depth}
        onValueChange={(v) => setDepth(v as Complexity)}
        disabled={!enabled}
        className="grid grid-cols-1 sm:grid-cols-3 gap-0"
      >
        {opts.map((o, i) => {
          const active = depth === o.value;
          const isLast = i === opts.length - 1;
          return (
            <label
              key={o.value}
              className={cn(
                "px-6 py-4 transition-[background-color] duration-300 ease-out",
                enabled ? "cursor-pointer" : "cursor-not-allowed",
                active ? "bg-card-active" : enabled && "hover:bg-card-hover",
                !isLast && "border-b border-border sm:border-b-0 sm:border-r",
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
    </Card.Entry>
  );
}
