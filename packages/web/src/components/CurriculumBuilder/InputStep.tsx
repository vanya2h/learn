import { Button } from "@cloudflare/kumo/components/button";
import { Input } from "@cloudflare/kumo/components/input";
import { LayerCard } from "@cloudflare/kumo/components/layer-card";
import { Trans, useLingui } from "@lingui/react/macro";

export function InputModePicker({ onPick }: { onPick: (mode: "url" | "pdf") => void }) {
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

export function UrlInput({
  url,
  setUrl,
  onGenerate,
  onBack,
}: {
  url: string;
  setUrl: (v: string) => void;
  onGenerate: () => void;
  onBack: () => void;
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
        <Button onClick={onGenerate} disabled={!url.trim()}>
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

export function PdfInput({
  file,
  setFile,
  onGenerate,
  onBack,
}: {
  file: File | null;
  setFile: (f: File | null) => void;
  onGenerate: () => void;
  onBack: () => void;
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
        <Button onClick={onGenerate} disabled={!file}>
          <Trans>Generate</Trans>
        </Button>
      </div>
      <BackLink onClick={onBack} />
    </div>
  );
}

export function BackLink({ onClick }: { onClick: () => void }) {
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
