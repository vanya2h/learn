import { Card, CardProps } from "../../Card";

import { cn } from "~/lib/utils";

export type MethodCardProps = CardProps;

export function MethodCard({ className, ...restProps }: MethodCardProps) {
  return <Card className={cn("group relative flex flex-col justify-between", className)} {...restProps} />;
}
