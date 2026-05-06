import type { ReactNode } from "react";

import { Checkbox } from "~/components/ui/checkbox";
import { cn } from "~/lib/utils";

type Props = {
  selected: boolean;
  onToggle?: () => void;
  readOnly?: boolean;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
};

export function SelectableCard({ selected, onToggle, readOnly, title, description, className }: Props) {
  const interactive = !readOnly && !!onToggle;
  return (
    <label
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border transition-colors",
        interactive ? "cursor-pointer" : "cursor-default",
        selected ? "border-border-hover bg-background-layer" : "border-border opacity-80",
        className,
      )}
    >
      <Checkbox
        className="mt-1"
        checked={selected}
        onCheckedChange={interactive ? () => onToggle?.() : undefined}
        disabled={!interactive}
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground">{title}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </label>
  );
}
