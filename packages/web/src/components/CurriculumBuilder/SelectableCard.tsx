import type { ReactNode } from "react";

import { Card, CardProps } from "~/components/Card";
import { Checkbox } from "~/components/ui/checkbox";
import { cn } from "~/lib/utils";

type SelectableCardProps = Omit<CardProps, "title"> & {
  selected: boolean;
  onToggle?: () => void;
  readOnly?: boolean;
  title: ReactNode;
  description?: ReactNode;
};

export function SelectableCard({
  selected,
  onToggle,
  readOnly,
  title,
  description,
  className,
  ...restProps
}: SelectableCardProps) {
  const interactive = !readOnly && !!onToggle;
  return (
    <Card
      active={selected}
      hoverable={interactive}
      className={cn("p-0 rounded-lg", !selected && "opacity-80", className)}
      {...restProps}
    >
      <label className={cn("flex items-start gap-3 p-3", interactive ? "cursor-pointer" : "cursor-default")}>
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
    </Card>
  );
}
