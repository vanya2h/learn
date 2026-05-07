import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

export type CardProps = ComponentProps<"div"> & {
  active?: boolean;
  hoverable?: boolean;
};

export function Card({ active = false, hoverable = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl",
        "border border-border",
        "bg-card p-6 text-left transition-[background-color,border-color] duration-300 ease-out",
        active
          ? "border-border-active bg-card-active"
          : hoverable
            ? "hover:border-border-hover hover:bg-card-hover"
            : "",
        className,
      )}
      {...props}
    />
  );
}
