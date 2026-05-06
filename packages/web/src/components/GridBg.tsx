import { cn } from "~/lib/utils";

export type GridBackgroundProps = React.ComponentProps<"div">;

export function GridBackground({ className, ...restProps }: GridBackgroundProps) {
  return (
    <div {...restProps} className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      <svg className="absolute inset-0 w-full h-full text-muted-foreground" aria-hidden>
        <defs>
          <pattern id="grid-bg-dots" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="currentColor" fillOpacity="0.15" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-bg-dots)" />
      </svg>
      <div className="absolute top-[-20%] right-[-20%] w-[40%] h-[40%] rounded-full bg-orange-500/20 dark:bg-orange-600/10 blur-[120px]" />
    </div>
  );
}
