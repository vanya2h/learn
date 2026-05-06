import type { InputMode } from "../useCurriculumBuilder";
import { PdfMethodCard } from "./PdfMethod";
import { UrlMethodCard } from "./UrlMethod";

type MethodPickerProps = {
  url: string;
  onUrlChange: (v: string) => void;
  file: File | null;
  onFileChange: (f: File | null) => void;
  activeMethod: InputMode;
  onSubmit: () => void;
};

export function MethodPicker({ url, onUrlChange, file, onFileChange, activeMethod, onSubmit }: MethodPickerProps) {
  return (
    <div className="flex w-full flex-col gap-5 sm:flex-row">
      <UrlMethodCard
        url={url}
        onUrlChange={onUrlChange}
        active={activeMethod === "url"}
        onSubmit={onSubmit}
        className="sm:flex-[1.6]"
      />
      <PdfMethodCard file={file} onFileChange={onFileChange} active={activeMethod === "pdf"} className="sm:flex-1" />
    </div>
  );
}
