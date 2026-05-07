import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

export type MethodCardProps = ComponentProps<"div"> & {
  active?: boolean;
};

export function MethodCard({ active = false, className, ...restProps }: MethodCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between",
        "px-6 py-5 transition-[background-color] duration-300 ease-out",
        active ? "bg-card-active" : "hover:bg-card-hover",
        className,
      )}
      {...restProps}
    />
  );
}
