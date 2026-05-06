import { Trans } from "@lingui/react/macro";
import { useState } from "react";
import { MethodCard } from "./MethodCard";

import { cn } from "~/lib/utils";

export type PdfMethodCardProps = {
  file: File | null;
  onFileChange: (f: File | null) => void;
  active: boolean;
  className?: string;
};

export function PdfMethodCard({ file, onFileChange, active, className }: PdfMethodCardProps) {
  return (
    <MethodCard active={active} className={className}>
      <div>
        <div className="mb-3.5 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/40">
          <Trans>Have a file?</Trans>
        </div>
        <div className="mb-1.5 text-xl font-semibold tracking-[-0.015em] text-foreground">
          <Trans>Upload a PDF</Trans>
        </div>
        <p className="leading-normal text-muted-foreground">
          <Trans>A saved job description from your computer.</Trans>
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <PdfDropZone file={file} onFileChange={onFileChange} active={active} />
        <p className="text-xs leading-normal text-foreground/40">
          <Trans>* The file stays on your device until you click Generate.</Trans>
        </p>
      </div>
    </MethodCard>
  );
}

function PdfDropZone({
  file,
  onFileChange,
  active,
}: {
  file: File | null;
  onFileChange: (f: File | null) => void;
  active: boolean;
}) {
  const [drag, setDrag] = useState(false);
  const highlight = drag || active;

  return (
    <label
      onDragEnter={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f && f.type === "application/pdf") onFileChange(f);
      }}
      className={cn(
        "flex cursor-pointer items-center justify-between gap-2 rounded-md border border-dashed bg-muted/30 px-3 py-2.5 font-mono text-sm",
        "transition-[border-color,color,background-color] duration-200",
        highlight
          ? "border-foreground/40 text-foreground"
          : "border-border text-foreground/40 hover:border-foreground/30",
      )}
    >
      <input
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileChange(f);
        }}
      />
      <span className="truncate">{file ? file.name : <Trans>Drop or browse</Trans>}</span>
      <span className="shrink-0 text-foreground/40">.pdf</span>
    </label>
  );
}
