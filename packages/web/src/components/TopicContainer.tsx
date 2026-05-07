import { cn } from "~/lib/utils";

export type TopicContainerProps = React.ComponentProps<"div">;

export function TopicContainer({ className, children, ...restProps }: TopicContainerProps) {
  return (
    <div {...restProps} className={cn("max-w-3xl w-full mx-auto px-6", className)}>
      {children}
    </div>
  );
}
