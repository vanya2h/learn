import { Trans, useLingui } from "@lingui/react/macro";
import { MethodCard } from "./MethodCard";

import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

export type UrlMethodCardProps = {
  url: string;
  onUrlChange: (v: string) => void;
  active: boolean;
  onSubmit: () => void;
  className?: string;
};

export function UrlMethodCard({ url, onUrlChange, active, onSubmit, className }: UrlMethodCardProps) {
  const { t } = useLingui();
  return (
    <MethodCard active={active} className={className}>
      <div>
        <Badge className="mb-4">
          <Trans>Recommended</Trans>
        </Badge>
        <div className="mb-1.5 text-xl font-semibold tracking-[-0.018em] text-foreground">
          <Trans>Paste a job posting URL</Trans>
        </div>
        <p className="max-w-90 text-muted-foreground">
          <Trans>We read the role, company, and required skills, then draft a personal program in seconds.</Trans>
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-md border bg-muted/30 px-3 py-2.5 transition-colors",
            "focus-within:border-foreground/40",
            active ? "border-foreground/40" : "border-border",
          )}
        >
          <input
            type="url"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && url.trim()) onSubmit();
            }}
            placeholder={t`Paste job URL here..`}
            className="flex-1 border-0 bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-foreground/40"
          />
        </div>
        <p className="text-xs leading-normal text-foreground/40">
          <Trans>* Some sites block direct access. If this fails, save as PDF and use the upload option instead.</Trans>
        </p>
      </div>
    </MethodCard>
  );
}
