import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

export type CardProps = ComponentProps<"div"> & {
  active: boolean;
};

export function Card({ active, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-md",
        "border border-border bg-foreground/4 p-6 text-left transition-[background-color,border-color] duration-300 ease-out",
        active ? "border-border-active bg-foreground/8" : "hover:border-border-hover",
        className,
      )}
      {...props}
    />
  );
}
