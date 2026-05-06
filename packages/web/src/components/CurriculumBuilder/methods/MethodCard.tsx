import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

export type MethodCardProps = {
  active: boolean;
  className?: string;
  children: ReactNode;
};

export function MethodCard({ active, className, children }: MethodCardProps) {
  return (
    <div
      className={cn(
        "group relative flex min-h-50 flex-col justify-between rounded-[10px]",
        "border bg-background-layer p-6 text-left transition-[background-color,border-color] duration-300 ease-out",
        active ? "border-border-active" : "border-border hover:border-border-hover",
        className,
      )}
    >
      {children}
    </div>
  );
}
