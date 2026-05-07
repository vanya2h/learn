import { PdfMethodCard } from "./PdfMethod";
import { UrlMethodCard } from "./UrlMethod";

import { Card } from "~/components/Card";

export type MethodPickerInputMode = "url" | "pdf" | null;

type MethodPickerProps = {
  url: string;
  onUrlChange: (v: string) => void;
  urlError?: string;
  file: File | null;
  onFileChange: (f: File | null) => void;
  activeMethod: MethodPickerInputMode;
};

export function MethodPicker({ url, onUrlChange, urlError, file, onFileChange, activeMethod }: MethodPickerProps) {
  return (
    <Card.Entry className="p-0 last:pb-0 grid grid-cols-1 sm:grid-cols-[1.6fr_1fr]">
      <UrlMethodCard
        url={url}
        onUrlChange={onUrlChange}
        error={urlError}
        active={activeMethod === "url"}
        className="border-b border-border sm:border-b-0 sm:border-r"
      />
      <PdfMethodCard file={file} onFileChange={onFileChange} active={activeMethod === "pdf"} />
    </Card.Entry>
  );
}
